import { NextRequest, NextResponse } from 'next/server';
import { withModerator, AdminAuthenticatedRequest } from '@/lib/middleware/adminMiddleware';
import prisma from '@/lib/db/prisma';
import { validateBody } from '@/lib/validations/validate';
import { adminDeleteReviewSchema } from '@/lib/validations/schemas/admin';

/**
 * Admin moderation of BROKER reviews (reviews target agents, not properties).
 * GET    — list reviews (agent reviewed + author), filterable by max_rating.
 * DELETE — remove any review (moderation), body: { review_id }.
 */

// GET /api/admin/reviews
export async function GET(req: NextRequest) {
  return withModerator(async (r: AdminAuthenticatedRequest) => {
    const { searchParams } = new URL(r.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const maxRating = searchParams.get('max_rating');

    const where: Record<string, unknown> = {};
    if (maxRating) {
      const mr = parseInt(maxRating);
      if (!isNaN(mr)) where.rating = { lte: mr };
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          agent: { select: { id: true, first_name: true, last_name: true, email: true } },
          user: { select: { id: true, first_name: true, last_name: true, email: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      reviews,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  })(req);
}

// DELETE /api/admin/reviews  { review_id }
export async function DELETE(req: NextRequest) {
  return withModerator(async (r: AdminAuthenticatedRequest) => {
    // Schema validation (VULN-022): review_id must be a UUID.
    const validation = validateBody(adminDeleteReviewSchema, await r.json().catch(() => null));
    if (!validation.success) return validation.error;
    const reviewId = validation.data.review_id;

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    await Promise.all([
      prisma.review.delete({ where: { id: reviewId } }),
      prisma.adminActionLog.create({
        data: {
          admin_id: r.user!.id,
          action_type: 'review_delete',
          target_type: 'review',
          target_id: reviewId,
          details: { agent_id: review.agent_id, author_id: review.user_id, rating: review.rating },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  })(req);
}
