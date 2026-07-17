import { NextRequest, NextResponse } from 'next/server';
import { withModerator, AdminAuthenticatedRequest } from '@/lib/middleware/adminMiddleware';
import prisma from '@/lib/db/prisma';

/**
 * Admin support desk: overview of support conversations + consultant load/online.
 * GET   — support conversations (client + consultant + status + msg count) and the
 *         consultant roster (online status + assigned load).
 * PATCH — assign/reassign a conversation to a specific consultant (or unassign).
 *         Body: { conversation_id, consultant_id | null }.
 */
const PERSON = { select: { id: true, first_name: true, last_name: true, email: true } };

export async function GET(req: NextRequest) {
  return withModerator(async (r: AdminAuthenticatedRequest) => {
    const { searchParams } = new URL(r.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { type: 'support' };
    if (status) where.status = status;

    const [conversations, consultants, load] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          client: PERSON,
          consultant: PERSON,
          _count: { select: { messages: true } },
        },
        orderBy: { updated_at: 'desc' },
        take: 100,
      }),
      prisma.user.findMany({
        where: { user_type: 'consultant' },
        select: { id: true, first_name: true, last_name: true, email: true, is_online: true },
        orderBy: { is_online: 'desc' },
      }),
      prisma.conversation.groupBy({
        by: ['consultant_id'],
        where: { type: 'support', status: 'assigned', consultant_id: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const loadMap: Record<string, number> = {};
    load.forEach((l) => { if (l.consultant_id) loadMap[l.consultant_id] = l._count._all; });
    const consultantRoster = consultants.map((c) => ({ ...c, assigned: loadMap[c.id] || 0 }));

    return NextResponse.json({ success: true, conversations, consultants: consultantRoster });
  })(req);
}

export async function PATCH(req: NextRequest) {
  return withModerator(async (r: AdminAuthenticatedRequest) => {
    const body = await r.json().catch(() => ({} as any));
    const { conversation_id, consultant_id } = body;
    if (!conversation_id) {
      return NextResponse.json({ error: 'conversation_id обязателен' }, { status: 400 });
    }

    const conv = await prisma.conversation.findUnique({ where: { id: conversation_id }, select: { id: true, consultant_id: true } });
    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    if (consultant_id) {
      const c = await prisma.user.findUnique({ where: { id: consultant_id }, select: { user_type: true } });
      if (!c || c.user_type !== 'consultant') {
        return NextResponse.json({ error: 'Назначать можно только консультанта' }, { status: 400 });
      }
    }

    await Promise.all([
      prisma.conversation.update({
        where: { id: conversation_id },
        data: { consultant_id: consultant_id || null, status: consultant_id ? 'assigned' : 'open' },
      }),
      prisma.adminActionLog.create({
        data: {
          admin_id: r.user!.id,
          action_type: consultant_id ? 'support_assign' : 'support_unassign',
          target_type: 'conversation',
          target_id: conversation_id,
          details: { from_consultant: conv.consultant_id, to_consultant: consultant_id || null },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  })(req);
}
