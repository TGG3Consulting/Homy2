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
    // Atomic claim: only the moderator who flips pending -> approved proceeds.
    // A concurrent moderator gets count = 0 and no duplicate Property is created.
    const claim = await prisma.propertyListing.updateMany({
      where: { id: listingId, status: 'pending' },
      data: { status: 'approved', moderated_at: new Date(), moderated_by: adminId, rejection_reason: null },
    });

    if (claim.count === 0) {
      const existing = await prisma.propertyListing.findUnique({ where: { id: listingId }, select: { status: true } });
      if (!existing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
      return NextResponse.json(
        { error: 'Объявление уже обработано другим модератором', status: existing.status },
        { status: 409 }
      );
    }

    const listing = await prisma.propertyListing.findUnique({ where: { id: listingId } });
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    // Build the live catalogue Property from the approved listing.
    const roomsLabel = listing.rooms ? `${listing.rooms}-комнатная` : (listing.property_type === 'studio' ? 'Студия' : 'Объект');
    const titleText = (listing.title && listing.title.trim()) || [roomsLabel, listing.district].filter(Boolean).join(' · ') || listing.location;
    const images = Array.isArray(listing.photos) ? (listing.photos as any[]).filter((x) => typeof x === 'string') : [];

    const property = await prisma.property.create({
      data: {
        title: JSON.stringify({ ru: titleText, en: titleText, hy: titleText }),
        owner: { connect: { id: listing.owner_id } },
        address: listing.address || listing.location || null,
        province: listing.province || null,
        city: listing.city || null,
        district: listing.district || null,
        neighborhood: listing.neighborhood ? JSON.stringify({ ru: listing.neighborhood, en: listing.neighborhood, hy: listing.neighborhood }) : null,
        price: listing.price,
        currency: listing.currency || 'AMD',
        rooms: listing.rooms,
        bedrooms: listing.rooms,
        area: listing.area,
        sizeSqm: listing.area,
        floor: listing.floor ?? null,
        description: listing.description || null,
        images,
        imageUrl: images[0] || null,
        dealType: listing.deal_type || null,
        propertyType: listing.property_type || 'apartment',
        depositMonths: listing.deposit_months ?? null,
        utilitiesEstimate: listing.utilities_estimate ?? null,
        minimumLeaseMonths: listing.minimum_lease_months ?? null,
        available: true,
        verified: true,
      },
    });

    await Promise.all([
      prisma.propertyListing.update({ where: { id: listingId }, data: { published_property_id: property.id } }),
      prisma.adminActionLog.create({
        data: {
          admin_id: adminId!,
          action_type: 'listing_approve',
          target_type: 'listing',
          target_id: listingId,
          details: { previous_status: 'pending', propertyId: property.id },
        },
      }),
      prisma.notification.create({
        data: {
          userId: listing.owner_id,
          type: 'listing_approved',
          title: 'Объявление одобрено',
          body: `«${titleText}» прошло модерацию и опубликовано.`,
          data: { propertyId: property.id, listingId },
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Listing approved', propertyId: property.id });
  } catch (error) {
    console.error('Approve listing error:', error);
    return NextResponse.json({ error: 'Failed to approve listing' }, { status: 500 });
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
