import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { createPropertyListingSchema } from '@/lib/validations/schemas/property';
import { validateBody } from '@/lib/validations/validate';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimiter';

async function handler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  // Per-user rate limit (VULN-012): otherwise an authenticated account can
  // flood the moderation queue with pending listings. Keyed by user (not IP).
  // withAuth requires a NextResponse return, so build the 429 here.
  const rl = checkRateLimit(`listing-create:${userId}`, RATE_LIMITS.api);
  if (!rl.success) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED', retryAfter },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  // Schema validation (VULN-022, supersedes the manual VULN-002 checks):
  // coerced+bounded numbers, enum deal/property types, capped text/photos,
  // unknown keys rejected.
  const validation = validateBody(createPropertyListingSchema, await req.json());
  if (!validation.success) return validation.error;
  const {
    property_type,
    location,
    price,
    currency,
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
  } = validation.data;

  // Build a human location from address / district (Yerevan) / city if not supplied.
  const loc = location || [address, district, city].filter(Boolean).join(' · ') || city || district || null;
  if (!loc) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const descriptionVal = description ?? null;
  const titleVal = title ?? null;
  const photosVal = photos ?? null;

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
      price,
      currency,
      area,
      rooms,
      description: descriptionVal,
      photos: photosVal ?? Prisma.DbNull,
      contact: contactValue,
      status: 'pending',
      deal_type: deal_type || null,
      province: province || null,
      city: city || null,
      district: district || null,
      neighborhood: neighborhood || district || null,
      address: address || null,
      floor: floor ?? null,
      title: titleVal,
      deposit_months: deposit_months ?? null,
      utilities_estimate: utilities_estimate ?? null,
      minimum_lease_months: minimum_lease_months ?? null,
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
