import { NextRequest, NextResponse } from 'next/server';
import { withModerator, AdminAuthenticatedRequest } from '@/lib/middleware/adminMiddleware';
import prisma from '@/lib/db/prisma';

async function approveListing(
  req: AdminAuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const adminId = req.user?.id;

  try {
    // Check listing exists
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

    if (listing.status === 'approved') {
      return NextResponse.json(
        { error: 'Listing is already approved' },
        { status: 400 }
      );
    }

    // Update listing and log action
    const [updatedListing] = await Promise.all([
      prisma.propertyListing.update({
        where: { id: listingId },
        data: {
          status: 'approved',
          moderated_at: new Date(),
          moderated_by: adminId,
          rejection_reason: null,
        },
      }),
      prisma.adminActionLog.create({
        data: {
          admin_id: adminId!,
          action_type: 'listing_approve',
          target_type: 'listing',
          target_id: listingId,
          details: { previous_status: listing.status },
        },
      }),
    ]);

    // TODO: Send notification to owner about approval

    return NextResponse.json({
      success: true,
      message: 'Listing approved successfully',
      listing: updatedListing,
    });
  } catch (error) {
    console.error('Approve listing error:', error);
    return NextResponse.json(
      { error: 'Failed to approve listing' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withModerator(async (authenticatedReq) => {
    return approveListing(authenticatedReq, context);
  })(req);
}
