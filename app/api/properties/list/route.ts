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
    currency = 'AMD',
    area,
    rooms,
    description,
    photos,
    contact,
    deal_type,
    province,
    city,
    district,
    neighborhood,
    address,
    floor,
    title,
    deposit_months,
    utilities_estimate,
    minimum_lease_months,
  } = body;

  // Build a human location from address / district (Yerevan) / city if not supplied.
  const loc = location || [address, district, city].filter(Boolean).join(' · ') || city || district || null;

  // Validation (contact defaults to the submitter below)
  if (!property_type || !price || !area || !rooms || !loc) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Default the contact to the submitter's own account.
  let contactValue = contact;
  if (!contactValue) {
    const me = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, first_name: true, last_name: true, email: true, phone: true } });
    contactValue = [me?.name || [me?.first_name, me?.last_name].filter(Boolean).join(' '), me?.phone || me?.email].filter(Boolean).join(' · ') || 'Владелец';
  }

  const listing = await prisma.propertyListing.create({
    data: {
      owner_id: userId,
      property_type,
      location: loc,
      price: parseFloat(price),
      currency,
      area: parseFloat(area),
      rooms: parseInt(rooms),
      description: description || null,
      photos: photos || null,
      contact: contactValue,
      status: 'pending',
      deal_type: deal_type || null,
      province: province || null,
      city: city || null,
      district: district || null,
      neighborhood: neighborhood || district || null,
      address: address || null,
      floor: floor != null ? parseInt(floor) : null,
      title: title || null,
      deposit_months: deposit_months != null && deposit_months !== '' ? parseInt(deposit_months) : null,
      utilities_estimate: utilities_estimate != null && utilities_estimate !== '' ? parseFloat(utilities_estimate) : null,
      minimum_lease_months: minimum_lease_months != null && minimum_lease_months !== '' ? parseInt(minimum_lease_months) : null,
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
