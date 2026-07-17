import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

// GET - Get listing by ID (public)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const listing = await prisma.propertyListing.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      listing: {
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
        owner: listing.owner,
      },
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

// PATCH - Update listing (owner only)
async function patchHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const userId = req.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Check ownership
    const listing = await prisma.propertyListing.findUnique({
      where: { id: listingId },
      select: { owner_id: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.owner_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      property_type,
      location,
      province,
      city,
      district,
      price,
      currency,
      area,
      rooms,
      description,
      photos,
      contact,
      deposit_months,
      utilities_estimate,
      minimum_lease_months,
    } = body;

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {};
    if (deposit_months !== undefined) updateData.deposit_months = deposit_months === '' || deposit_months == null ? null : parseInt(deposit_months);
    if (utilities_estimate !== undefined) updateData.utilities_estimate = utilities_estimate === '' || utilities_estimate == null ? null : parseFloat(utilities_estimate);
    if (minimum_lease_months !== undefined) updateData.minimum_lease_months = minimum_lease_months === '' || minimum_lease_months == null ? null : parseInt(minimum_lease_months);
    if (province !== undefined) updateData.province = province || null;
    if (city !== undefined) updateData.city = city || null;
    if (district !== undefined) updateData.district = district || null;

    if (property_type !== undefined) {
      const validTypes = ['apartment', 'house', 'studio'];
      if (!validTypes.includes(property_type)) {
        return NextResponse.json(
          { error: 'Invalid property type. Must be one of: apartment, house, studio' },
          { status: 400 }
        );
      }
      updateData.property_type = property_type;
    }

    if (location !== undefined) {
      if (typeof location !== 'string' || location.trim().length === 0) {
        return NextResponse.json(
          { error: 'Location is required and must be a non-empty string' },
          { status: 400 }
        );
      }
      updateData.location = location.trim();
    }

    if (price !== undefined) {
      if (typeof price !== 'number' || price <= 0) {
        return NextResponse.json(
          { error: 'Price must be a positive number' },
          { status: 400 }
        );
      }
      updateData.price = price;
    }

    if (currency !== undefined) {
      const validCurrencies = ['USD', 'AMD', 'EUR', 'RUB'];
      if (!validCurrencies.includes(currency)) {
        return NextResponse.json(
          { error: 'Invalid currency. Must be one of: USD, AMD, EUR, RUB' },
          { status: 400 }
        );
      }
      updateData.currency = currency;
    }

    if (area !== undefined) {
      if (typeof area !== 'number' || area <= 0) {
        return NextResponse.json(
          { error: 'Area must be a positive number' },
          { status: 400 }
        );
      }
      updateData.area = area;
    }

    if (rooms !== undefined) {
      if (!Number.isInteger(rooms) || rooms <= 0) {
        return NextResponse.json(
          { error: 'Rooms must be a positive integer' },
          { status: 400 }
        );
      }
      updateData.rooms = rooms;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (photos !== undefined) {
      if (!Array.isArray(photos)) {
        return NextResponse.json(
          { error: 'Photos must be an array' },
          { status: 400 }
        );
      }
      updateData.photos = photos;
    }

    if (contact !== undefined) {
      if (typeof contact !== 'string' || contact.trim().length === 0) {
        return NextResponse.json(
          { error: 'Contact is required and must be a non-empty string' },
          { status: 400 }
        );
      }
      updateData.contact = contact.trim();
    }

    // Check if there are any fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updatedListing = await prisma.propertyListing.update({
      where: { id: listingId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Listing updated successfully',
      listing: {
        id: updatedListing.id,
        owner_id: updatedListing.owner_id,
        property_type: updatedListing.property_type,
        location: updatedListing.location,
        price: updatedListing.price,
        currency: updatedListing.currency,
        area: updatedListing.area,
        rooms: updatedListing.rooms,
        description: updatedListing.description,
        photos: updatedListing.photos,
        contact: updatedListing.contact,
        status: updatedListing.status,
        created_at: updatedListing.created_at.toISOString(),
        updated_at: updatedListing.updated_at.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

// DELETE - Delete listing (owner only)
async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const userId = req.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Check ownership
    const listing = await prisma.propertyListing.findUnique({
      where: { id: listingId },
      select: { owner_id: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.owner_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await prisma.propertyListing.delete({
      where: { id: listingId },
    });

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}

// Wrapper function for PATCH that handles the params
function withAuthAndParams(
  handler: (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => Promise<NextResponse>
) {
  return (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const wrappedHandler = withAuth((authReq: AuthenticatedRequest) => handler(authReq, context));
    return wrappedHandler(req);
  };
}

export const PATCH = withAuthAndParams(patchHandler);
export const DELETE = withAuthAndParams(deleteHandler);
