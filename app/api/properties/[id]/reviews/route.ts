import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest, withOptionalAuth } from '@/lib/middleware/authMiddleware';

// GET /api/properties/[id]/reviews - List reviews for a property with pagination and stats
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const skip = (page - 1) * limit;

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true }
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Fetch reviews with pagination and stats in parallel
    const [reviews, totalCount, avgResult, distribution] = await Promise.all([
      prisma.review.findMany({
        where: { property_id: propertyId },
        include: {
          user: {
            select: {
              id: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { property_id: propertyId } }),
      prisma.review.aggregate({
        where: { property_id: propertyId },
        _avg: { rating: true },
      }),
      // Get rating distribution
      prisma.review.groupBy({
        by: ['rating'],
        where: { property_id: propertyId },
        _count: { rating: true },
      }),
    ]);

    // Build distribution object
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => {
      ratingDistribution[d.rating] = d._count.rating;
    });

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        averageRating: avgResult._avg.rating ? Number(avgResult._avg.rating.toFixed(1)) : 0,
        totalReviews: totalCount,
        distribution: ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/properties/[id]/reviews - Create a review (authenticated users only)
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // Extract property ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const reviewsIndex = pathParts.indexOf('reviews');
    const propertyId = pathParts[reviewsIndex - 1];

    const body = await req.json();

    // Validate rating
    const rating = parseInt(body.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate comment length
    const comment = body.comment?.trim() || null;
    if (comment && comment.length > 2000) {
      return NextResponse.json(
        { error: 'Comment too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true }
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Check if user already has a review for this property
    const existingReview = await prisma.review.findUnique({
      where: {
        property_id_user_id: {
          property_id: propertyId,
          user_id: req.user!.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this property. Use PATCH to update.' },
        { status: 409 }
      );
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        property_id: propertyId,
        user_id: req.user!.id,
        rating,
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
