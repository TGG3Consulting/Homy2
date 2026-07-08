import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

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

    const body = await req.json();

    // Validate rating if provided
    let rating = review.rating;
    if (body.rating !== undefined) {
      rating = parseInt(body.rating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        );
      }
    }

    // Validate comment if provided
    let comment = review.comment;
    if (body.comment !== undefined) {
      comment = body.comment?.trim() || null;
      if (comment && comment.length > 2000) {
        return NextResponse.json(
          { error: 'Comment too long (max 2000 characters)' },
          { status: 400 }
        );
      }
    }

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
