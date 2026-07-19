import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withBroker, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { validateBody } from '@/lib/validations/validate';
import { updateLeadSchema } from '@/lib/validations/schemas/crm';

function leadId(url: string): string | null {
  const parts = new URL(url).pathname.split('/');
  const i = parts.indexOf('leads');
  return i >= 0 && parts[i + 1] ? parts[i + 1] : null;
}

/**
 * PATCH /api/agent/leads/[id]
 * Update a lead. Body: { stage?, notes?, interest?, budget?, touch? (bump last_contact_at) }
 */
export const PATCH = withBroker(async (req: AuthenticatedRequest) => {
  try {
    const agentId = req.user!.id;
    const id = leadId(req.url);
    if (!id) return NextResponse.json({ error: 'Lead ID required', success: false }, { status: 400 });

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Lead not found', success: false }, { status: 404 });
    if (existing.agent_id !== agentId) return NextResponse.json({ error: 'Access denied', success: false }, { status: 403 });

    const validation = validateBody(updateLeadSchema, await req.json().catch(() => ({})));
    if (!validation.success) return validation.error;
    const body = validation.data;
    const data: Record<string, unknown> = {};
    if (body.stage && ['new', 'warm', 'cold'].includes(body.stage)) {
      data.stage = body.stage;
      // B6: manually moving a lead to an active stage must reset recency, otherwise
      // effectiveStage() re-surfaces it as "cold" on the next read (sticky stage).
      if (body.stage === 'new' || body.stage === 'warm') data.last_contact_at = new Date();
    }
    if (body.notes !== undefined) data.notes = body.notes || null;
    if (body.interest !== undefined) data.interest = body.interest || null;
    if (body.budget !== undefined) data.budget = body.budget != null ? Math.round(Number(body.budget)) : null;
    if (body.touch) data.last_contact_at = new Date();

    const lead = await prisma.lead.update({ where: { id }, data });
    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error('[PATCH /api/agent/leads/[id]] Error:', error);
    return NextResponse.json({ error: 'Failed to update lead', success: false }, { status: 500 });
  }
});

/**
 * DELETE /api/agent/leads/[id]
 */
export const DELETE = withBroker(async (req: AuthenticatedRequest) => {
  try {
    const agentId = req.user!.id;
    const id = leadId(req.url);
    if (!id) return NextResponse.json({ error: 'Lead ID required', success: false }, { status: 400 });

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Lead not found', success: false }, { status: 404 });
    if (existing.agent_id !== agentId) return NextResponse.json({ error: 'Access denied', success: false }, { status: 403 });

    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/agent/leads/[id]] Error:', error);
    return NextResponse.json({ error: 'Failed to delete lead', success: false }, { status: 500 });
  }
});
