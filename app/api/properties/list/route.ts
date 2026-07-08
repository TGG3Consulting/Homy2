import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

async function handler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  const body = await req.json();

  const {
    property_type,
    location,
    price,
    currency = 'USD',
    area,
    rooms,
    description,
    photos,
    contact
  } = body;

  // Validation
  if (!property_type || !location || !price || !area || !rooms || !contact) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const listing = await prisma.propertyListing.create({
    data: {
      owner_id: userId,
      property_type,
      location,
      price: parseFloat(price),
      currency,
      area: parseFloat(area),
      rooms: parseInt(rooms),
      description: description || null,
      photos: photos || null,
      contact,
      status: 'pending'
    }
  });

  return NextResponse.json({
    success: true,
    listing_id: listing.id,
    status: listing.status,
    message: 'Your listing has been submitted for review'
  });
}

export const POST = withAuth(handler);
