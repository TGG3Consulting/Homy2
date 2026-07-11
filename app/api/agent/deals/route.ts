import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

const STAGES = ['negotiation', 'offer', 'contract', 'closed', 'lost'];
const STATUSES = ['open', 'won', 'lost'];

/**
 * GET /api/agent/deals?status=open|won|lost
 * List the current agent's deals.
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const agentId = req.user!.id;
    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    const deals = await prisma.deal.findMany({
      where: { agent_id: agentId, ...(status && STATUSES.includes(status) ? { status } : {}) },
      orderBy: { updated_at: 'desc' },
      include: {
        property: { select: { id: true, title: true, district: true, imageUrl: true, images: true, price: true, currency: true, dealType: true } },
        client: { select: { id: true, first_name: true, last_name: true, name: true, email: true } },
        lead: { select: { id: true, client_name: true } },
      },
    });

    return NextResponse.json({ success: true, deals, count: deals.length });
  } catch (error) {
    console.error('[GET /api/agent/deals] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch deals', success: false }, { status: 500 });
  }
});

/**
 * POST /api/agent/deals
 * Create a deal (optionally from a lead).
 * Body: { title?, clientName?, propertyId?, leadId?, clientId?, value?, stage? }
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const agentId = req.user!.id;
    const body = await req.json();
    const { title, clientName, propertyId, leadId, clientId, value, stage, commission } = body;

    // If created from a lead, inherit its context.
    let leadCtx: any = null;
    if (leadId) {
      leadCtx = await prisma.lead.findUnique({ where: { id: leadId } });
      if (leadCtx && leadCtx.agent_id !== agentId) leadCtx = null;
    }

    const deal = await prisma.deal.create({
      data: {
        agent_id: agentId,
        client_id: clientId || leadCtx?.client_id || null,
        property_id: propertyId || leadCtx?.property_id || null,
        lead_id: leadId || null,
        title: title || null,
        client_name: clientName || leadCtx?.client_name || null,
        value: value != null ? Math.round(Number(value)) : (leadCtx?.budget ?? null),
        commission: commission != null ? Math.round(Number(commission))
          : (value != null ? Math.round(Number(value) * 0.02) : (leadCtx?.budget ? Math.round(leadCtx.budget * 0.02) : null)),
        stage: STAGES.includes(stage) ? stage : 'negotiation',
        status: 'open',
      },
    });

    // A deal means the lead is actively progressing → warm it.
    if (leadCtx) {
      await prisma.lead.update({ where: { id: leadCtx.id }, data: { stage: 'warm', last_contact_at: new Date() } });
    }

    return NextResponse.json({ success: true, deal });
  } catch (error) {
    console.error('[POST /api/agent/deals] Error:', error);
    return NextResponse.json({ error: 'Failed to create deal', success: false }, { status: 500 });
  }
});
