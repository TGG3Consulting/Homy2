import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { jwtService } from '@/lib/services/jwtService';
import { getAccessTokenFromRequest } from '@/lib/cookies';

// ---- auth helpers: owner or admin/moderator may author a tour, AND the session
// must still be valid — token_version match + not blocked (VULN-004). ----
function authSession(req: Request): { userId: string; tokenVersion: number } | null {
  const token = getAccessTokenFromRequest(req);
  if (!token) return null;
  const p = jwtService.verifyAccessToken(token);
  if (!p?.userId) return null;
  return { userId: p.userId, tokenVersion: p.tokenVersion ?? 0 };
}
async function canManage(auth: { userId: string; tokenVersion: number } | null, propertyId: string): Promise<boolean> {
  if (!auth) return false;
  const [prop, user] = await Promise.all([
    prisma.property.findUnique({ where: { id: propertyId }, select: { owner_id: true } }),
    prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true, token_version: true, is_blocked: true } }),
  ]);
  if (!prop || !user) return false;
  if (user.is_blocked || auth.tokenVersion !== user.token_version) return false; // revoked/blocked session
  return prop.owner_id === auth.userId || user.role === 'admin' || user.role === 'moderator';
}

const roomDto = (room: any) => ({
  id: room.id,
  name: { en: room.name_en, ru: room.name_ru, hy: room.name_hy },
  panorama_url: room.panorama_url,
  hotspots: room.hotspots || [],
  order_index: room.order_index,
});

// GET — public viewer; with ?manage=true returns ALL rooms + enabled flag for the owner/admin editor.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const manage = new URL(req.url).searchParams.get('manage') === 'true';

    const property = await prisma.property.findUnique({
      where: { id },
      include: { virtual_tour_rooms: { orderBy: { order_index: 'asc' } } },
    });
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

    if (manage) {
      if (!(await canManage(authSession(req), id))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({
        enabled: property.virtual_tour_enabled,
        rooms: property.virtual_tour_rooms.map(roomDto),
      });
    }

    if (!property.virtual_tour_enabled || property.virtual_tour_rooms.length === 0) {
      return NextResponse.json({ enabled: false, message: 'Virtual tour not available for this property' });
    }
    return NextResponse.json({
      enabled: true,
      start_room_id: property.virtual_tour_rooms[0].id,
      rooms: property.virtual_tour_rooms.map(roomDto),
    });
  } catch (error) {
    console.error('Virtual tour error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — create a room (owner/admin).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!(await canManage(authSession(req), id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const b = await req.json().catch(() => ({} as any));
    const name_ru = (b.name_ru || b.name || '').trim();
    if (!name_ru) return NextResponse.json({ error: 'Название комнаты обязательно' }, { status: 400 });
    if (!b.panorama_url || !String(b.panorama_url).trim()) {
      return NextResponse.json({ error: 'URL панорамы обязателен' }, { status: 400 });
    }

    const last = await prisma.virtualTourRoom.findFirst({
      where: { property_id: id },
      orderBy: { order_index: 'desc' },
      select: { order_index: true },
    });

    const room = await prisma.virtualTourRoom.create({
      data: {
        property_id: id,
        name_ru,
        name_en: (b.name_en || name_ru).trim(),
        name_hy: (b.name_hy || name_ru).trim(),
        panorama_url: String(b.panorama_url).trim(),
        hotspots: Array.isArray(b.hotspots) ? b.hotspots : [],
        order_index: (last?.order_index ?? -1) + 1,
      },
    });

    return NextResponse.json({ success: true, room: roomDto(room) }, { status: 201 });
  } catch (error) {
    console.error('Create tour room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
