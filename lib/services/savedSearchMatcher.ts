/**
 * Saved-search notifications — production logic (no mocks).
 *
 * A saved search stores a snapshot of the properties the user saw. We derive a
 * deterministic structured filter from that snapshot (districts, price ceiling,
 * min rooms, deal/property type) and re-run it against the live catalogue to
 * find NEW matching listings the user hasn't seen yet. New matches create real
 * Notification rows; the A10 "N новых" badge is driven by unread notifications.
 */
import prisma from '../db/prisma';

export interface NotifyCriteria {
  districts?: string[];
  maxPrice?: number;
  minRooms?: number;
  dealType?: string;      // long_term_rental | short_term_rental | sale
  propertyType?: string;  // apartment | house | studio
}

const NOTIF_TYPE = 'saved_search_match';

function plural(n: number, one: string, few: string, many: string): string {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return few;
  return many;
}

/** Derive a deterministic structured filter from the saved snapshot properties. */
export function deriveNotifyCriteria(properties: any): NotifyCriteria | null {
  if (!Array.isArray(properties) || properties.length === 0) return null;
  const districts = new Set<string>();
  const prices: number[] = [];
  const rooms: number[] = [];
  const dealCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};

  for (const p of properties) {
    const d = p.district || p.neighborhood;
    if (d && typeof d === 'string') districts.add(d);
    const price = Number(p.price);
    if (Number.isFinite(price) && price > 0) prices.push(price);
    const r = Number(p.rooms ?? p.bedrooms);
    if (Number.isFinite(r) && r > 0) rooms.push(r);
    const dt = p.deal_type || p.dealType;
    if (dt) dealCounts[dt] = (dealCounts[dt] || 0) + 1;
    const t = p.property_type || p.propertyType;
    if (t) typeCounts[t] = (typeCounts[t] || 0) + 1;
  }

  const dominant = (obj: Record<string, number>): string | undefined => {
    const e = Object.entries(obj).sort((a, b) => b[1] - a[1]);
    return e.length ? e[0][0] : undefined;
  };

  const crit: NotifyCriteria = {};
  if (districts.size) crit.districts = [...districts];
  if (prices.length) crit.maxPrice = Math.max(...prices);
  if (rooms.length) crit.minRooms = Math.min(...rooms);
  const dt = dominant(dealCounts); if (dt) crit.dealType = dt;
  const pt = dominant(typeCounts); if (pt) crit.propertyType = pt;
  return Object.keys(crit).length ? crit : null;
}

/** Current available property IDs matching the criteria, excluding already-known IDs. */
export async function findNewMatchIds(
  criteria: NotifyCriteria | null,
  knownIds: string[],
  limit = 50,
): Promise<string[]> {
  if (!criteria) return [];
  const where: any = { available: true };
  if (criteria.districts && criteria.districts.length) {
    where.OR = [
      { district: { in: criteria.districts } },
      { neighborhood: { in: criteria.districts } },
    ];
  }
  if (criteria.maxPrice) where.price = { lte: criteria.maxPrice };
  if (criteria.minRooms) where.rooms = { gte: criteria.minRooms };
  if (criteria.dealType) where.dealType = criteria.dealType;
  if (criteria.propertyType) where.propertyType = criteria.propertyType;
  if (knownIds.length) where.id = { notIn: knownIds };

  const rows = await prisma.property.findMany({
    where,
    select: { id: true },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((r) => r.id);
}

/**
 * For one user: find new matches for every notify-enabled saved search,
 * create notifications, and mark those properties as known (dedup).
 * Idempotent — repeated calls won't re-notify the same listings.
 */
export async function generateNotifications(userId: string): Promise<void> {
  const searches = await prisma.savedSearch.findMany({ where: { userId, notify: true } });
  for (const s of searches) {
    const criteria = (s.notifyCriteria as NotifyCriteria | null) || deriveNotifyCriteria(s.properties);
    const known = s.knownPropertyIds || [];
    const newIds = criteria ? await findNewMatchIds(criteria, known) : [];

    if (newIds.length > 0) {
      const name = s.name || s.query || 'Ваш поиск';
      const word = plural(newIds.length, 'новый объект', 'новых объекта', 'новых объектов');
      await prisma.notification.create({
        data: {
          userId,
          type: NOTIF_TYPE,
          title: 'Новые объекты по вашему поиску',
          body: `${newIds.length} ${word} по запросу «${name}»`,
          data: { savedSearchId: s.id, propertyIds: newIds },
        },
      });
    }

    // Persist derived criteria (if it wasn't stored yet), extend known set, stamp check time.
    await prisma.savedSearch.update({
      where: { id: s.id },
      data: {
        ...(s.notifyCriteria ? {} : criteria ? { notifyCriteria: criteria as any } : {}),
        ...(newIds.length ? { knownPropertyIds: { set: [...known, ...newIds] } } : {}),
        lastCheckedAt: new Date(),
      },
    });
  }
}

/** Per-search count of new matches the user hasn't opened yet (unread notifications). */
export async function getUnseenCounts(userId: string): Promise<Record<string, number>> {
  const notifs = await prisma.notification.findMany({
    where: { userId, type: NOTIF_TYPE, read: false },
    select: { data: true },
  });
  const counts: Record<string, number> = {};
  for (const n of notifs) {
    const d = (n.data as any) || {};
    const sid = d.savedSearchId;
    const ids: string[] = Array.isArray(d.propertyIds) ? d.propertyIds : [];
    if (sid) counts[sid] = (counts[sid] || 0) + ids.length;
  }
  return counts;
}

/** Mark a saved search's new-match notifications as read (badge → 0 when user opens it). */
export async function markSearchSeen(userId: string, savedSearchId: string): Promise<void> {
  const notifs = await prisma.notification.findMany({
    where: { userId, type: NOTIF_TYPE, read: false },
    select: { id: true, data: true },
  });
  const ids = notifs
    .filter((n) => ((n.data as any) || {}).savedSearchId === savedSearchId)
    .map((n) => n.id);
  if (ids.length) {
    await prisma.notification.updateMany({ where: { id: { in: ids } }, data: { read: true } });
  }
}

/** For scheduled/cron runs: evaluate every user that has notify-enabled searches. */
export async function runForAll(): Promise<{ users: number }> {
  const rows = await prisma.savedSearch.findMany({
    where: { notify: true },
    select: { userId: true },
    distinct: ['userId'],
  });
  for (const r of rows) {
    await generateNotifications(r.userId);
  }
  return { users: rows.length };
}
