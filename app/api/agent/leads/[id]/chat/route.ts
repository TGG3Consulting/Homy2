import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withBroker, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

function leadId(url: string): string | null {
  const parts = new URL(url).pathname.split('/');
  const i = parts.indexOf('leads');
  return i >= 0 && parts[i + 1] ? parts[i + 1] : null;
}

/**
 * POST /api/agent/leads/[id]/chat
 * Start (or find) a direct conversation between the agent and the lead's client.
 * Reuses the Conversation/LiveChatMessage models. Returns { conversationId }.
 * Only works when the lead is linked to a registered client (client_id).
 */
export const POST = withBroker(async (req: AuthenticatedRequest) => {
  try {
    const agentId = req.user!.id;
    const id = leadId(req.url);
    if (!id) return NextResponse.json({ error: 'Lead ID required', success: false }, { status: 400 });

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ error: 'Lead not found', success: false }, { status: 404 });
    if (lead.agent_id !== agentId) return NextResponse.json({ error: 'Access denied', success: false }, { status: 403 });
    if (!lead.client_id) return NextResponse.json({ error: 'Клиент не зарегистрирован — напишите на email/телефон', success: false }, { status: 400 });

    let conversation = await prisma.conversation.findFirst({
      where: { type: 'property', client_id: lead.client_id, consultant_id: agentId, property_id: lead.property_id || undefined },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          type: 'property',
          status: 'open',
          client_id: lead.client_id,
          consultant_id: agentId,
          property_id: lead.property_id || null,
          subject: lead.interest || 'Диалог с агентом',
        },
      });
    }

    return NextResponse.json({ success: true, conversationId: conversation.id });
  } catch (error) {
    console.error('[POST /api/agent/leads/[id]/chat] Error:', error);
    return NextResponse.json({ error: 'Failed to open chat', success: false }, { status: 500 });
  }
});
