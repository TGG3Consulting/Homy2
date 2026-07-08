import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

/**
 * GET /api/users/me/properties
 * Get properties for viewing creation
 * - Owners: their own properties (owner_id = userId)
 * - Agents: all properties (can be enhanced with agent-property relationship)
 */
async function getHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;

  if (!userId) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 401 }
    );
  }

  try {
    // Get current user to check user_type
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        user_type: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only owners and agents can access this endpoint
    if (currentUser.user_type !== 'owner' && currentUser.user_type !== 'agent') {
      return NextResponse.json(
        { error: 'Only property owners and agents can access properties for viewings' },
        { status: 403 }
      );
    }

    // Build where clause based on user type
    let whereClause: Record<string, unknown> = {};

    if (currentUser.user_type === 'owner') {
      // Owners see only their own properties
      whereClause = {
        owner_id: userId,
      };
    }
    // Agents see all properties (no filter)
    // Can be enhanced later with agent-property management relationship

    // Fetch properties
    const properties = await prisma.property.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        address: true,
        district: true,
        neighborhood: true,
        price: true,
        currency: true,
        rooms: true,
        area: true,
        imageUrl: true,
        images: true,
        owner_id: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to 100 properties
    });

    return NextResponse.json({
      success: true,
      properties: properties.map((p) => ({
        id: p.id,
        title: p.title,
        address: p.address,
        district: p.district,
        neighborhood: p.neighborhood,
        price: p.price ? Number(p.price) : null,
        currency: p.currency,
        rooms: p.rooms,
        area: p.area ? Number(p.area) : null,
        imageUrl: p.imageUrl,
        images: p.images || [],
        owner_id: p.owner_id,
      })),
    });
  } catch (error) {
    console.error('Error fetching user properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
