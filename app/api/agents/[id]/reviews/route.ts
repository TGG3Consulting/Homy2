import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

/**
 * Reviews target the BROKER (agent), not the property.
 * GET  /api/agents/[id]/reviews — list + stats for a broker.
 * POST /api/agents/[id]/reviews — leave a review about a broker (one per author).
 */

// GET — list reviews for a broker with pagination and stats
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const skip = (page - 1) * limit;

    const agent = await prisma.user.findUnique({ where: { id: agentId }, select: { id: true } });
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const [reviews, totalCount, avgResult, distribution] = await Promise.all([
      prisma.review.findMany({
        where: { agent_id: agentId },
        include: {
          user: { select: { id: true, first_name: true, last_name: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { agent_id: agentId } }),
      prisma.review.aggregate({ where: { agent_id: agentId }, _avg: { rating: true } }),
      prisma.review.groupBy({ by: ['rating'], where: { agent_id: agentId }, _count: { rating: true } }),
    ]);

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => { ratingDistribution[d.rating] = d._count.rating; });

    return NextResponse.json({
      reviews,
      pagination: { page, limit, total: totalCount, totalPages: Math.ceil(totalCount / limit) },
      stats: {
        averageRating: avgResult._avg.rating ? Number(avgResult._avg.rating.toFixed(1)) : 0,
        totalReviews: totalCount,
        distribution: ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Get agent reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — leave a review about a broker (authenticated; one per author per broker)
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const reviewsIndex = pathParts.indexOf('reviews');
    const agentId = pathParts[reviewsIndex - 1];

    const body = await req.json();

    const rating = parseInt(body.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const comment = body.comment?.trim() || null;
    if (comment && comment.length > 2000) {
      return NextResponse.json({ error: 'Comment too long (max 2000 characters)' }, { status: 400 });
    }

    // Cannot review yourself.
    if (agentId === req.user!.id) {
      return NextResponse.json({ error: 'Нельзя оставить отзыв самому себе' }, { status: 400 });
    }

    const agent = await prisma.user.findUnique({ where: { id: agentId }, select: { id: true, user_type: true } });
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    // Reviews are for brokers only — cannot review a plain client account (VULN-010).
    if (agent.user_type !== 'agent' && agent.user_type !== 'owner') {
      return NextResponse.json({ error: 'Отзывы можно оставлять только брокерам' }, { status: 400 });
    }
    // Require a real interaction: reviewer must have had a viewing with this broker,
    // so reputation can't be fabricated/review-bombed by throwaway accounts (CHAIN-003).
    const interaction = await prisma.viewing.findFirst({
      where: { clientId: req.user!.id, agentId },
      select: { id: true },
    });
    if (!interaction) {
      return NextResponse.json(
        { error: 'Оставить отзыв можно только после просмотра с этим брокером' },
        { status: 403 }
      );
    }

    const existing = await prisma.review.findUnique({
      where: { agent_id_user_id: { agent_id: agentId, user_id: req.user!.id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Вы уже оставили отзыв об этом брокере. Обновите через PATCH.' },
        { status: 409 }
      );
    }

    const review = await prisma.review.create({
      data: { agent_id: agentId, user_id: req.user!.id, rating, comment },
      include: { user: { select: { id: true, first_name: true, last_name: true } } },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Create agent review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
