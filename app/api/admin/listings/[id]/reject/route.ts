import { NextRequest, NextResponse } from 'next/server';
import { withModerator, AdminAuthenticatedRequest } from '@/lib/middleware/adminMiddleware';
import prisma from '@/lib/db/prisma';

async function rejectListing(
  req: AdminAuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const adminId = req.user?.id;

  try {
    const body = await req.json();
    const { reason } = body;

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Rejection reason is required (min 10 characters)' },
        { status: 400 }
      );
    }

    // Atomic claim: only a still-pending listing can be rejected, and only one
    // moderator wins. Concurrent moderators get 409.
    const claim = await prisma.propertyListing.updateMany({
      where: { id: listingId, status: 'pending' },
      data: { status: 'rejected', moderated_at: new Date(), moderated_by: adminId, rejection_reason: reason.trim() },
    });

    if (claim.count === 0) {
      const existing = await prisma.propertyListing.findUnique({ where: { id: listingId }, select: { status: true } });
      if (!existing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
      return NextResponse.json(
        { error: 'Объявление уже обработано другим модератором', status: existing.status },
        { status: 409 }
      );
    }

    const listing = await prisma.propertyListing.findUnique({ where: { id: listingId }, select: { owner_id: true, location: true } });

    await Promise.all([
      prisma.adminActionLog.create({
        data: {
          admin_id: adminId!,
          action_type: 'listing_reject',
          target_type: 'listing',
          target_id: listingId,
          details: { previous_status: 'pending', reason },
        },
      }),
      listing ? prisma.notification.create({
        data: {
          userId: listing.owner_id,
          type: 'listing_rejected',
          title: 'Объявление отклонено',
          body: `«${listing.location}» не прошло модерацию: ${reason.trim()}`,
          data: { listingId, reason: reason.trim() },
        },
      }) : Promise.resolve(),
    ]);

    return NextResponse.json({ success: true, message: 'Listing rejected' });
  } catch (error) {
    console.error('Reject listing error:', error);
    return NextResponse.json(
      { error: 'Failed to reject listing' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withModerator(async (authenticatedReq) => {
    return rejectListing(authenticatedReq, context);
  })(req);
}
