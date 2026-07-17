import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withBroker, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

const STAGES = ['negotiation', 'offer', 'contract', 'closed', 'lost'];
const STATUSES = ['open', 'won', 'lost'];

function dealId(url: string): string | null {
  const parts = new URL(url).pathname.split('/');
  const i = parts.indexOf('deals');
  return i >= 0 && parts[i + 1] ? parts[i + 1] : null;
}

/**
 * PATCH /api/agent/deals/[id]
 * Update a deal. Body: { stage?, status?, value?, title?, notes? }
 * Setting status to won/lost (or stage closed/lost) stamps closed_at.
 */
export const PATCH = withBroker(async (req: AuthenticatedRequest) => {
  try {
    const agentId = req.user!.id;
    const id = dealId(req.url);
    if (!id) return NextResponse.json({ error: 'Deal ID required', success: false }, { status: 400 });

    const existing = await prisma.deal.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Deal not found', success: false }, { status: 404 });
    if (existing.agent_id !== agentId) return NextResponse.json({ error: 'Access denied', success: false }, { status: 403 });

    const body = await req.json().catch(() => ({} as any));
    const data: Record<string, unknown> = {};
    if (body.stage && STAGES.includes(body.stage)) data.stage = body.stage;
    if (body.status && STATUSES.includes(body.status)) data.status = body.status;
    if (body.value !== undefined) data.value = body.value != null ? Math.round(Number(body.value)) : null;
    if (body.commission !== undefined) data.commission = body.commission != null ? Math.round(Number(body.commission)) : null;
    if (body.title !== undefined) data.title = body.title || null;
    if (body.notes !== undefined) data.notes = body.notes || null;

    const nextStatus = (data.status as string) || existing.status;
    const nextStage = (data.stage as string) || existing.stage;
    const isClosed = nextStatus === 'won' || nextStatus === 'lost' || nextStage === 'closed' || nextStage === 'lost';
    if (isClosed && !existing.closed_at) data.closed_at = new Date();
    if (!isClosed) data.closed_at = null;

    const deal = await prisma.deal.update({ where: { id }, data });
    return NextResponse.json({ success: true, deal });
  } catch (error) {
    console.error('[PATCH /api/agent/deals/[id]] Error:', error);
    return NextResponse.json({ error: 'Failed to update deal', success: false }, { status: 500 });
  }
});

/**
 * DELETE /api/agent/deals/[id]
 */
export const DELETE = withBroker(async (req: AuthenticatedRequest) => {
  try {
    const agentId = req.user!.id;
    const id = dealId(req.url);
    if (!id) return NextResponse.json({ error: 'Deal ID required', success: false }, { status: 400 });

    const existing = await prisma.deal.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Deal not found', success: false }, { status: 404 });
    if (existing.agent_id !== agentId) return NextResponse.json({ error: 'Access denied', success: false }, { status: 403 });

    await prisma.deal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/agent/deals/[id]] Error:', error);
    return NextResponse.json({ error: 'Failed to delete deal', success: false }, { status: 500 });
  }
});
