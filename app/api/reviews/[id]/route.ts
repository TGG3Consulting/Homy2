import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { validateBody } from '@/lib/validations/validate';
import { updateReviewSchema } from '@/lib/validations/schemas/chat';

// PATCH /api/reviews/[id] - Update own review
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // Extract review ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const reviewId = pathParts[pathParts.length - 1];

    // Find the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check ownership
    if (review.user_id !== req.user!.id) {
      return NextResponse.json(
        { error: 'You can only edit your own reviews' },
        { status: 403 }
      );
    }

    // Schema validation (VULN-022): strict shape, rating int 1..5, comment cap 2000.
    const validation = validateBody(updateReviewSchema, await req.json());
    if (!validation.success) return validation.error;
    const body = validation.data;

    // Absent field keeps the stored value; empty/null comment clears it.
    const rating = body.rating !== undefined ? body.rating : review.rating;
    const comment =
      body.comment !== undefined ? (body.comment || null) : review.comment;

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating,
        comment,
        updated_at: new Date(),
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

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error('Update review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// DELETE /api/reviews/[id] - Delete own review
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // Extract review ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const reviewId = pathParts[pathParts.length - 1];

    // Find the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check ownership
    if (review.user_id !== req.user!.id) {
      return NextResponse.json(
        { error: 'You can only delete your own reviews' },
        { status: 403 }
      );
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
