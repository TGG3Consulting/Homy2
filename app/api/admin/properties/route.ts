import { NextRequest, NextResponse } from 'next/server';
import { withModerator, AdminAuthenticatedRequest } from '@/lib/middleware/adminMiddleware';
import prisma from '@/lib/db/prisma';

/**
 * Admin overview of LIVE properties (catalogue), including unpublished ones.
 * GET — list all Property rows (owner + key fields + availability).
 * Edit / unpublish / delete go through PATCH|DELETE /api/properties/[id]
 * (now admin-aware).
 */
export async function GET(req: NextRequest) {
  return withModerator(async (r: AdminAuthenticatedRequest) => {
    const { searchParams } = new URL(r.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const availability = searchParams.get('available'); // 'true' | 'false'
    const search = searchParams.get('search')?.trim();

    const where: Record<string, unknown> = {};
    if (availability === 'true') where.available = true;
    if (availability === 'false') where.available = false;
    if (search) where.address = { contains: search, mode: 'insensitive' };

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        select: {
          id: true,
          title: true,
          address: true,
          district: true,
          city: true,
          price: true,
          currency: true,
          available: true,
          verified: true,
          createdAt: true,
          owner: { select: { id: true, first_name: true, last_name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return NextResponse.json({ success: true, properties, total, page, pages: Math.ceil(total / limit) });
  })(req);
}
