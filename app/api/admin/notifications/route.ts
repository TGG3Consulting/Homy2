import { NextRequest, NextResponse } from 'next/server';
import { withModerator, AdminAuthenticatedRequest } from '@/lib/middleware/adminMiddleware';
import prisma from '@/lib/db/prisma';

/**
 * Admin broadcast notifications.
 * POST — send a `system` notification to every user (optionally filtered by persona).
 *        Body: { title, body, target } where target = 'all' | buyer | renter | owner | agent | consultant.
 */
const TARGETS = ['all', 'buyer', 'renter', 'owner', 'agent', 'consultant'];

export async function POST(req: NextRequest) {
  return withModerator(async (r: AdminAuthenticatedRequest) => {
    const b = await r.json().catch(() => ({} as any));
    const title = (b.title || '').trim();
    const body = (b.body || '').trim();
    const target = b.target || 'all';

    if (!title || !body) {
      return NextResponse.json({ error: 'Заголовок и текст обязательны' }, { status: 400 });
    }
    if (!TARGETS.includes(target)) {
      return NextResponse.json({ error: 'Некорректная аудитория' }, { status: 400 });
    }

    const where = target === 'all' ? {} : { user_type: target };
    const users = await prisma.user.findMany({ where, select: { id: true } });
    if (users.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    const created = await prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.id, type: 'system', title, body })),
    });

    await prisma.adminActionLog.create({
      data: {
        admin_id: r.user!.id,
        action_type: 'notification_broadcast',
        target_type: 'broadcast',
        target_id: target,
        details: { title, target, recipients: created.count },
      },
    });

    return NextResponse.json({ success: true, sent: created.count });
  })(req);
}
