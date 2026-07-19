import { NextRequest, NextResponse } from 'next/server';
import { withModerator, AdminAuthenticatedRequest } from '@/lib/middleware/adminMiddleware';
import prisma from '@/lib/db/prisma';
import { validateBody } from '@/lib/validations/validate';
import { adminBroadcastSchema } from '@/lib/validations/schemas/admin';

/**
 * Admin broadcast notifications.
 * POST — send a `system` notification to every user (optionally filtered by persona).
 *        Body: { title, body, target } where target = 'all' | buyer | renter | owner | agent | consultant.
 */
export async function POST(req: NextRequest) {
  return withModerator(async (r: AdminAuthenticatedRequest) => {
    // Schema validation (VULN-022): title 1..200, body 1..2000, target enum.
    const validation = validateBody(adminBroadcastSchema, await r.json().catch(() => null));
    if (!validation.success) return validation.error;
    const { title, body } = validation.data;
    const target = validation.data.target ?? 'all';

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
        // `target` is defaulted to 'all' by the schema; `?? 'all'` is type-level only.
        target_id: target ?? 'all',
        details: { title, target, recipients: created.count },
      },
    });

    return NextResponse.json({ success: true, sent: created.count });
  })(req);
}
