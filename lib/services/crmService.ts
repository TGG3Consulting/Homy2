/**
 * CRM service (broker cabinet) — leads & deals. Production logic, no mocks.
 *
 * A lead is created automatically when a buyer engages with an agent's property
 * (currently: requests a viewing). Agents can also add leads manually and move
 * them through stages (new → warm → cold). Deals are agent-managed transactions
 * that can originate from a lead.
 */
import prisma from '@/lib/db/prisma';

export type LeadStage = 'new' | 'warm' | 'cold';
const STALE_DAYS = 14;

function daysSince(d: Date | string): number {
  const t = new Date(d).getTime();
  return (Date.now() - t) / 86_400_000;
}

/** Localized-JSON aware plain-text resolver. */
function plain(v: any): string {
  if (v == null) return '';
  if (typeof v === 'object') return v.ru || v.en || Object.values(v)[0] as string || '';
  if (typeof v === 'string') {
    const s = v.trim();
    if (s.startsWith('{') && s.includes('"')) { try { const o = JSON.parse(s); return o.ru || o.en || v; } catch { return v; } }
    return v;
  }
  return String(v);
}

/**
 * Effective stage for display/filtering: a stored new/warm lead with no contact
 * for STALE_DAYS is surfaced as "cold" (real recency, no background job needed).
 */
export function effectiveStage(lead: { stage: string; last_contact_at: Date | string }): LeadStage {
  if (lead.stage === 'cold') return 'cold';
  if ((lead.stage === 'new' || lead.stage === 'warm') && daysSince(lead.last_contact_at) > STALE_DAYS) return 'cold';
  return (lead.stage as LeadStage) || 'new';
}

/** Build the "interest" one-liner from a property. */
export function interestFromProperty(p: any): string {
  if (!p) return '';
  const rooms = p.rooms || p.bedrooms;
  const bit = rooms ? `${rooms}-комн` : (plain(p.title) || 'объект');
  const district = plain(p.district || p.neighborhood);
  const price = p.price != null ? Number(p.price).toLocaleString('ru-RU').replace(/,/g, ' ') : '';
  return [bit, district, price ? `${price} AMD` : ''].filter(Boolean).join(' · ');
}

/**
 * Capture / refresh a lead when a client engages with an agent's property.
 * Deduplicated per (agent, client, property). Returns the lead id (or null).
 */
export async function captureLead(params: {
  agentId: string;
  clientId?: string | null;
  property?: any;              // property record (for interest + property_id)
  client?: any;                // client user record (for contact snapshot)
  source?: string;             // viewing | chat | manual
}): Promise<string | null> {
  const { agentId } = params;
  if (!agentId) return null;
  // Don't create a lead where the agent is their own client.
  if (params.clientId && params.clientId === agentId) return null;

  const propertyId: string | null = params.property?.id ?? null;
  const clientId: string | null = params.clientId ?? null;

  const existing = await prisma.lead.findFirst({
    where: { agent_id: agentId, client_id: clientId, property_id: propertyId },
  });

  const clientName = params.client
    ? ([params.client.first_name, params.client.last_name].filter(Boolean).join(' ') || params.client.name || params.client.email)
    : undefined;

  if (existing) {
    await prisma.lead.update({
      where: { id: existing.id },
      data: {
        last_contact_at: new Date(),
        // re-engagement warms a previously cold lead
        ...(existing.stage === 'cold' ? { stage: 'warm' } : {}),
        ...(clientName && !existing.client_name ? { client_name: clientName } : {}),
      },
    });
    return existing.id;
  }

  const lead = await prisma.lead.create({
    data: {
      agent_id: agentId,
      client_id: clientId,
      property_id: propertyId,
      client_name: clientName || null,
      client_email: params.client?.email || null,
      client_phone: params.client?.phone || null,
      interest: interestFromProperty(params.property) || null,
      budget: params.property?.price != null ? Math.round(Number(params.property.price)) : null,
      stage: 'new',
      source: params.source || 'viewing',
      last_contact_at: new Date(),
    },
  });
  return lead.id;
}

/** Aggregate CRM metrics for the broker dashboard (D1 tiles). */
export async function getAgentCrmMetrics(agentId: string): Promise<{
  active_listings: number;
  total_leads: number;
  new_leads: number;
  warm_leads: number;
  cold_leads: number;
  deals_open: number;
  deals_won: number;
}> {
  const [activeListings, leads, dealsOpen, dealsWon] = await Promise.all([
    prisma.property.count({ where: { owner_id: agentId, available: true } }),
    prisma.lead.findMany({ where: { agent_id: agentId }, select: { stage: true, last_contact_at: true } }),
    prisma.deal.count({ where: { agent_id: agentId, status: 'open' } }),
    prisma.deal.count({ where: { agent_id: agentId, status: 'won' } }),
  ]);

  let newL = 0, warm = 0, cold = 0;
  for (const l of leads) {
    const s = effectiveStage(l);
    if (s === 'new') newL++; else if (s === 'warm') warm++; else cold++;
  }

  return {
    active_listings: activeListings,
    total_leads: leads.length,
    new_leads: newL,
    warm_leads: warm,
    cold_leads: cold,
    deals_open: dealsOpen,
    deals_won: dealsWon,
  };
}
