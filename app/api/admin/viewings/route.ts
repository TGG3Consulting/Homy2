import { NextRequest, NextResponse } from 'next/server';
import { withModerator, AdminAuthenticatedRequest } from '@/lib/middleware/adminMiddleware';
import prisma from '@/lib/db/prisma';
import { validateBody } from '@/lib/validations/validate';
import { adminViewingActionSchema } from '@/lib/validations/schemas/admin';

/**
 * Admin overview of viewings (client-requested; agent confirms).
 * GET   — list all viewings (property + client + agent + time + status), filter by status.
 * PATCH — moderator marks a viewing completed or cancelled. Body: { viewing_id, action }.
 */

const PERSON = { select: { id: true, first_name: true, last_name: true, email: true } };

export async function GET(req: NextRequest) {
  return withModerator(async (r: AdminAuthenticatedRequest) => {
    const { searchParams } = new URL(r.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [viewings, total] = await Promise.all([
      prisma.viewing.findMany({
        where,
        include: {
          property: { select: { id: true, title: true } },
          client: PERSON,
          agent: PERSON,
        },
        orderBy: { scheduledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.viewing.count({ where }),
    ]);

    return NextResponse.json({ success: true, viewings, total, page, pages: Math.ceil(total / limit) });
  })(req);
}

export async function PATCH(req: NextRequest) {
  return withModerator(async (r: AdminAuthenticatedRequest) => {
    // Schema validation (VULN-022): viewing_id UUID + action enum.
    const validation = validateBody(adminViewingActionSchema, await r.json().catch(() => null));
    if (!validation.success) return validation.error;
    const { viewing_id, action } = validation.data;

    const viewing = await prisma.viewing.findUnique({ where: { id: viewing_id }, select: { id: true, status: true } });
    if (!viewing) {
      return NextResponse.json({ error: 'Viewing not found' }, { status: 404 });
    }

    const data: Record<string, unknown> =
      action === 'complete'
        ? { status: 'completed' }
        : { status: 'cancelled', cancelledById: r.user!.id };

    await Promise.all([
      prisma.viewing.update({ where: { id: viewing_id }, data }),
      prisma.adminActionLog.create({
        data: {
          admin_id: r.user!.id,
          action_type: action === 'complete' ? 'viewing_complete' : 'viewing_cancel',
          target_type: 'viewing',
          target_id: viewing_id,
          details: { previous_status: viewing.status },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  })(req);
}
