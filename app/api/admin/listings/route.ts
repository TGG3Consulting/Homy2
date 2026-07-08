import { NextResponse } from 'next/server';
import { withModerator, AdminAuthenticatedRequest } from '@/lib/middleware/adminMiddleware';
import prisma from '@/lib/db/prisma';

// GET - List listings for moderation
async function getListings(req: AdminAuthenticatedRequest) {
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const status = searchParams.get('status') || 'pending';
  const sortBy = searchParams.get('sort_by') || 'created_at';
  const sortOrder = (searchParams.get('sort_order') || 'asc') as 'asc' | 'desc';

  try {
    const where: Record<string, unknown> = {};
    if (status !== 'all') {
      where.status = status;
    }

    const [listings, total] = await Promise.all([
      prisma.propertyListing.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              phone: true,
              is_blocked: true,
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.propertyListing.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        listings,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get listings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

export const GET = withModerator(getListings);
