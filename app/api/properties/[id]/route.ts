import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import propertyAdapter from '@/lib/adapters/propertyAdapter';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getAccessTokenFromRequest } from '@/lib/cookies';
import jwtService from '@/lib/services/jwtService';

function propIdFromUrl(url: string): string | null {
  const parts = new URL(url).pathname.split('/');
  const i = parts.indexOf('properties');
  return i >= 0 && parts[i + 1] ? parts[i + 1] : null;
}

/**
 * Record a property view (3.5). Fire-and-forget: any failure is swallowed and
 * NEVER affects the detail response. viewer_id is captured when a valid token
 * is present, otherwise null (anonymous).
 */
async function recordView(req: NextRequest, propertyId: string): Promise<void> {
  try {
    let viewerId: string | null = null;
    const token = getAccessTokenFromRequest(req);
    if (token) {
      try {
        const payload = jwtService.verifyAccessToken(token);
        viewerId = (payload as { userId?: string })?.userId ?? null;
      } catch {
        // invalid/expired token → treat as anonymous
      }
    }
    await prisma.propertyView.create({
      data: { property_id: propertyId, viewer_id: viewerId },
    });
  } catch {
    // never block or break the response on view tracking
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, first_name: true, last_name: true, user_type: true } },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Fire-and-forget view tracking (does not await-block the response path).
    void recordView(req, id);

    const frontendProperty = propertyAdapter.toFrontendFormat(property);

    return NextResponse.json(frontendProperty);
  } catch (error) {
    console.error('Property detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/** Admins/moderators may manage any live property (2.2), not just their own. */
async function isAdminUser(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return u?.role === 'admin' || u?.role === 'moderator';
}

/**
 * PATCH /api/properties/[id]
 * Owner/agent edit or unpublish (available:false). Owner-scoped (admins may edit any).
 * Body: partial { title, address, district, neighborhood, price, rooms, bedrooms,
 *   area, sizeSqm, floor, totalFloors, description, images, imageUrl, dealType,
 *   propertyType, available }
 */
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user!.id;
    const id = propIdFromUrl(req.url);
    if (!id) return NextResponse.json({ error: 'Property ID required', success: false }, { status: 400 });

    const existing = await prisma.property.findUnique({ where: { id }, select: { owner_id: true } });
    if (!existing) return NextResponse.json({ error: 'Property not found', success: false }, { status: 404 });
    if (existing.owner_id !== userId && !(await isAdminUser(userId))) return NextResponse.json({ error: 'Access denied', success: false }, { status: 403 });

    const b = await req.json().catch(() => ({} as any));
    const data: Record<string, unknown> = {};
    const str = ['address', 'province', 'city', 'district', 'description', 'imageUrl', 'dealType', 'propertyType'];
    for (const k of str) if (b[k] !== undefined) data[k] = b[k];
    if (b.title !== undefined) data.title = typeof b.title === 'object' ? JSON.stringify(b.title) : b.title;
    if (b.neighborhood !== undefined) data.neighborhood = typeof b.neighborhood === 'object' ? JSON.stringify(b.neighborhood) : b.neighborhood;
    if (b.price !== undefined) data.price = b.price != null ? Number(b.price) : null;
    if (b.rooms !== undefined) data.rooms = b.rooms != null ? Number(b.rooms) : null;
    if (b.bedrooms !== undefined) data.bedrooms = b.bedrooms != null ? Number(b.bedrooms) : null;
    if (b.area !== undefined) data.area = b.area != null ? Number(b.area) : null;
    if (b.sizeSqm !== undefined) data.sizeSqm = b.sizeSqm != null ? Number(b.sizeSqm) : null;
    if (b.floor !== undefined) data.floor = b.floor != null ? Number(b.floor) : null;
    if (b.totalFloors !== undefined) data.totalFloors = b.totalFloors != null ? Number(b.totalFloors) : null;
    if (Array.isArray(b.images)) data.images = b.images;
    if (typeof b.available === 'boolean') data.available = b.available;
    if (typeof b.virtual_tour_enabled === 'boolean') data.virtual_tour_enabled = b.virtual_tour_enabled;
    if (b.depositMonths !== undefined) data.depositMonths = b.depositMonths != null && b.depositMonths !== '' ? Number(b.depositMonths) : null;
    if (b.utilitiesEstimate !== undefined) data.utilitiesEstimate = b.utilitiesEstimate != null && b.utilitiesEstimate !== '' ? Number(b.utilitiesEstimate) : null;
    if (b.minimumLeaseMonths !== undefined) data.minimumLeaseMonths = b.minimumLeaseMonths != null && b.minimumLeaseMonths !== '' ? Number(b.minimumLeaseMonths) : null;

    const property = await prisma.property.update({ where: { id }, data });
    return NextResponse.json({ success: true, property: propertyAdapter.toFrontendFormat(property) });
  } catch (error) {
    console.error('[PATCH /api/properties/[id]] Error:', error);
    return NextResponse.json({ error: 'Failed to update property', success: false }, { status: 500 });
  }
});

/**
 * DELETE /api/properties/[id] — owner-scoped delete.
 */
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user!.id;
    const id = propIdFromUrl(req.url);
    if (!id) return NextResponse.json({ error: 'Property ID required', success: false }, { status: 400 });

    const existing = await prisma.property.findUnique({ where: { id }, select: { owner_id: true } });
    if (!existing) return NextResponse.json({ error: 'Property not found', success: false }, { status: 404 });
    if (existing.owner_id !== userId && !(await isAdminUser(userId))) return NextResponse.json({ error: 'Access denied', success: false }, { status: 403 });

    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/properties/[id]] Error:', error);
    return NextResponse.json({ error: 'Failed to delete property', success: false }, { status: 500 });
  }
});
