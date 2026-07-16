import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import propertyAdapter from '@/lib/adapters/propertyAdapter';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

function propIdFromUrl(url: string): string | null {
  const parts = new URL(url).pathname.split('/');
  const i = parts.indexOf('properties');
  return i >= 0 && parts[i + 1] ? parts[i + 1] : null;
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

/**
 * PATCH /api/properties/[id]
 * Owner/agent edit or unpublish (available:false). Owner-scoped.
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
    if (existing.owner_id !== userId) return NextResponse.json({ error: 'Access denied', success: false }, { status: 403 });

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
    if (existing.owner_id !== userId) return NextResponse.json({ error: 'Access denied', success: false }, { status: 403 });

    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/properties/[id]] Error:', error);
    return NextResponse.json({ error: 'Failed to delete property', success: false }, { status: 500 });
  }
});
