import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withBroker, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { effectiveStage } from '@/lib/services/crmService';
import { validateBody } from '@/lib/validations/validate';
import { createLeadSchema } from '@/lib/validations/schemas/crm';

/**
 * GET /api/agent/leads?stage=new|warm|cold
 * List the current agent's leads (newest contact first), with computed stage.
 */
export const GET = withBroker(async (req: AuthenticatedRequest) => {
  try {
    const agentId = req.user!.id;
    const url = new URL(req.url);
    const stageFilter = url.searchParams.get('stage');

    const rows = await prisma.lead.findMany({
      where: { agent_id: agentId },
      orderBy: { last_contact_at: 'desc' },
      include: {
        property: { select: { id: true, title: true, district: true, neighborhood: true, imageUrl: true, images: true, price: true, currency: true } },
        client: { select: { id: true, first_name: true, last_name: true, name: true, email: true, phone: true, avatar_url: true } },
      },
    });

    const leads = rows.map((l) => ({
      ...l,
      stage: effectiveStage(l),
      storedStage: l.stage,
    }));

    const filtered = stageFilter && ['new', 'warm', 'cold'].includes(stageFilter)
      ? leads.filter((l) => l.stage === stageFilter)
      : leads;

    return NextResponse.json({ success: true, leads: filtered, count: filtered.length, total: leads.length });
  } catch (error) {
    console.error('[GET /api/agent/leads] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads', success: false }, { status: 500 });
  }
});

/**
 * POST /api/agent/leads
 * Manually add a lead. Body: { clientName, clientEmail?, clientPhone?, propertyId?, interest?, budget?, stage? }
 */
export const POST = withBroker(async (req: AuthenticatedRequest) => {
  try {
    const agentId = req.user!.id;
    const validation = validateBody(createLeadSchema, await req.json());
    if (!validation.success) return validation.error;
    const { clientName, clientEmail, clientPhone, propertyId, interest, budget, stage } = validation.data;

    if (!clientName && !clientEmail && !clientPhone) {
      return NextResponse.json({ error: 'Client name or contact is required', success: false }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        agent_id: agentId,
        client_name: clientName || null,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        property_id: propertyId || null,
        interest: interest || null,
        budget: budget != null ? Math.round(Number(budget)) : null,
        stage: stage && ['new', 'warm', 'cold'].includes(stage) ? stage : 'new',
        source: 'manual',
        last_contact_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error('[POST /api/agent/leads] Error:', error);
    return NextResponse.json({ error: 'Failed to create lead', success: false }, { status: 500 });
  }
});
