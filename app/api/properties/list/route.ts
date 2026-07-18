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

  // Validate PARSED numbers, not raw strings — "0"/"-5000" are truthy and would
  // otherwise pass the check above and land a negative/zero price in the catalogue
  // (VULN-002). Enforce positive values with sane upper bounds.
  const priceNum = parseFloat(price);
  const areaNum = parseFloat(area);
  const roomsNum = parseInt(rooms, 10);
  const floorNum = floor != null && floor !== '' ? parseInt(floor, 10) : null;
  if (!Number.isFinite(priceNum) || priceNum <= 0 || priceNum > 100_000_000_000) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
  }
  if (!Number.isFinite(areaNum) || areaNum <= 0 || areaNum > 100_000) {
    return NextResponse.json({ error: 'Invalid area' }, { status: 400 });
  }
  if (!Number.isInteger(roomsNum) || roomsNum < 0 || roomsNum > 100) {
    return NextResponse.json({ error: 'Invalid rooms' }, { status: 400 });
  }
  if (floorNum != null && (!Number.isInteger(floorNum) || floorNum < -5 || floorNum > 300)) {
    return NextResponse.json({ error: 'Invalid floor' }, { status: 400 });
  }
  // Bound free-text / arrays to prevent storage abuse (VULN-022 partial).
  const descriptionVal = description != null ? String(description).slice(0, 5000) : null;
  const titleVal = title != null ? String(title).slice(0, 200) : null;
  const photosVal = Array.isArray(photos) ? photos.slice(0, 30) : (photos || null);

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
      price: priceNum,
      currency,
      area: areaNum,
      rooms: roomsNum,
      description: descriptionVal,
      photos: photosVal,
      contact: contactValue,
      status: 'pending',
      deal_type: deal_type || null,
      province: province || null,
      city: city || null,
      district: district || null,
      neighborhood: neighborhood || district || null,
      address: address || null,
      floor: floorNum,
      title: titleVal,
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
