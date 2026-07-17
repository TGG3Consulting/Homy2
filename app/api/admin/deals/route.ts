import { NextRequest, NextResponse } from 'next/server';
import { withModerator, AdminAuthenticatedRequest } from '@/lib/middleware/adminMiddleware';
import prisma from '@/lib/db/prisma';

/**
 * Admin overview of CRM deals (read-only pipeline).
 * GET — list all deals (agent + client + property + stage + status + value).
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

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: { agent: PERSON, client: PERSON, property: { select: { id: true, title: true } } },
        orderBy: { updated_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.deal.count({ where }),
    ]);

    return NextResponse.json({ success: true, deals, total, page, pages: Math.ceil(total / limit) });
  })(req);
}
