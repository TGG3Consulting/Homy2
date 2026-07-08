import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

// GET - Get current user's listings with pagination
async function getHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;

  if (!userId) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);

    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    // Optional status filter
    const status = searchParams.get('status');
    const validStatuses = ['pending', 'approved', 'rejected'];

    // Build where clause
    const whereClause: Record<string, unknown> = {
      owner_id: userId,
    };

    if (status && validStatuses.includes(status)) {
      whereClause.status = status;
    }

    // Get total count for pagination
    const total = await prisma.propertyListing.count({
      where: whereClause,
    });

    // Get listings
    const listings = await prisma.propertyListing.findMany({
      where: whereClause,
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      listings: listings.map((listing) => ({
        id: listing.id,
        owner_id: listing.owner_id,
        property_type: listing.property_type,
        location: listing.location,
        price: listing.price,
        currency: listing.currency,
        area: listing.area,
        rooms: listing.rooms,
        description: listing.description,
        photos: listing.photos,
        contact: listing.contact,
        status: listing.status,
        created_at: listing.created_at.toISOString(),
        updated_at: listing.updated_at.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching user listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
