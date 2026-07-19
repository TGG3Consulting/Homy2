import { NextRequest, NextResponse } from 'next/server';
import { withModerator, AdminAuthenticatedRequest } from '@/lib/middleware/adminMiddleware';
import prisma from '@/lib/db/prisma';
import { effectiveStage } from '@/lib/services/crmService';
import { validateBody, validateQuery } from '@/lib/validations/validate';
import { adminLeadReassignSchema, adminLeadDeleteQuerySchema } from '@/lib/validations/schemas/crm';

/**
 * Admin overview of CRM leads (agent-scoped in the cabinet; global here).
 * GET    — list all leads (agent + client + property + effective stage).
 * PATCH  — reassign a lead to another agent. Body: { lead_id, action:'reassign', agent_id }.
 * DELETE — remove a lead (e.g. junk/test). Query: ?lead_id=...  (linked deals keep, lead_id→null).
 */

const PERSON = { select: { id: true, first_name: true, last_name: true, email: true } };

export async function GET(req: NextRequest) {
  return withModerator(async (r: AdminAuthenticatedRequest) => {
    const { searchParams } = new URL(r.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const stage = searchParams.get('stage');

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        include: { agent: PERSON, client: PERSON, property: { select: { id: true, title: true } } },
        orderBy: { last_contact_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count(),
    ]);

    // effectiveStage surfaces stale new/warm leads as "cold" (real recency).
    let rows = leads.map((l) => ({
      ...l,
      stage: effectiveStage({ stage: l.stage, last_contact_at: l.last_contact_at }),
    }));
    if (stage) rows = rows.filter((l) => l.stage === stage);

    return NextResponse.json({ success: true, leads: rows, total, page, pages: Math.ceil(total / limit) });
  })(req);
}

export async function PATCH(req: NextRequest) {
  return withModerator(async (r: AdminAuthenticatedRequest) => {
    const validation = validateBody(adminLeadReassignSchema, await r.json().catch(() => ({})));
    if (!validation.success) return validation.error;
    const { lead_id, action, agent_id } = validation.data;
    if (action !== 'reassign' || !lead_id || !agent_id) {
      return NextResponse.json({ error: 'lead_id, action=reassign и agent_id обязательны' }, { status: 400 });
    }

    const [lead, newAgent] = await Promise.all([
      prisma.lead.findUnique({ where: { id: lead_id }, select: { id: true, agent_id: true } }),
      prisma.user.findUnique({ where: { id: agent_id }, select: { id: true, user_type: true } }),
    ]);
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    if (!newAgent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    if (!['agent', 'owner', 'consultant'].includes(newAgent.user_type || '')) {
      return NextResponse.json({ error: 'Переназначить можно только на агента/владельца/консультанта' }, { status: 400 });
    }

    await Promise.all([
      prisma.lead.update({ where: { id: lead_id }, data: { agent_id } }),
      prisma.adminActionLog.create({
        data: {
          admin_id: r.user!.id,
          action_type: 'lead_reassign',
          target_type: 'lead',
          target_id: lead_id,
          details: { from_agent: lead.agent_id, to_agent: agent_id },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  })(req);
}

export async function DELETE(req: NextRequest) {
  return withModerator(async (r: AdminAuthenticatedRequest) => {
    const queryValidation = validateQuery(adminLeadDeleteQuerySchema, new URL(r.url).searchParams);
    if (!queryValidation.success) return queryValidation.error;
    const { lead_id } = queryValidation.data;

    const lead = await prisma.lead.findUnique({ where: { id: lead_id }, select: { id: true, agent_id: true } });
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    await prisma.lead.delete({ where: { id: lead_id } });
    await prisma.adminActionLog.create({
      data: {
        admin_id: r.user!.id,
        action_type: 'lead_delete',
        target_type: 'lead',
        target_id: lead_id,
        details: { agent_id: lead.agent_id },
      },
    });

    return NextResponse.json({ success: true });
  })(req);
}
