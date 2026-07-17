import { NextRequest, NextResponse } from 'next/server';
import { withModerator, AdminAuthenticatedRequest } from '@/lib/middleware/adminMiddleware';
import prisma from '@/lib/db/prisma';

/**
 * Admin view of the coming-soon waitlist (email capture).
 * GET — all entries (email + date), newest first.
 */
export async function GET(req: NextRequest) {
  return withModerator(async (r: AdminAuthenticatedRequest) => {
    const { searchParams } = new URL(r.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '200')));

    const [entries, total] = await Promise.all([
      prisma.waitlistEntry.findMany({
        select: { id: true, email: true, created_at: true },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.waitlistEntry.count(),
    ]);

    return NextResponse.json({ success: true, entries, total, page, pages: Math.ceil(total / limit) });
  })(req);
}
