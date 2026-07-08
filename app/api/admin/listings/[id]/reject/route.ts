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

    const listing = await prisma.propertyListing.findUnique({
      where: { id: listingId },
      select: { id: true, status: true, owner_id: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.status === 'rejected') {
      return NextResponse.json(
        { error: 'Listing is already rejected' },
        { status: 400 }
      );
    }

    const [updatedListing] = await Promise.all([
      prisma.propertyListing.update({
        where: { id: listingId },
        data: {
          status: 'rejected',
          moderated_at: new Date(),
          moderated_by: adminId,
          rejection_reason: reason.trim(),
        },
      }),
      prisma.adminActionLog.create({
        data: {
          admin_id: adminId!,
          action_type: 'listing_reject',
          target_type: 'listing',
          target_id: listingId,
          details: { previous_status: listing.status, reason },
        },
      }),
    ]);

    // TODO: Send notification to owner about rejection with reason

    return NextResponse.json({
      success: true,
      message: 'Listing rejected',
      listing: updatedListing,
    });
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
