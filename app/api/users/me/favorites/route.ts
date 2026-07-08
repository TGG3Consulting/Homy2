import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import propertyAdapter from '@/lib/adapters/propertyAdapter';

/**
 * GET /api/users/me/favorites
 * Fetch all favorites for the authenticated user with full property details
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user!.id;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        property: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to frontend format with favorite metadata
    const properties = favorites.map((favorite) => {
      const property = propertyAdapter.toFrontendFormat(favorite.property);
      return {
        ...property,
        favoriteId: favorite.id,
        favoritedAt: favorite.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      favorites: properties,
      count: properties.length,
    });
  } catch (error) {
    console.error('[GET /api/users/me/favorites] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites', success: false },
      { status: 500 }
    );
  }
});

/**
 * POST /api/users/me/favorites
 * Add a property to user's favorites
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user!.id;
    const body = await req.json();
    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required', success: false },
        { status: 400 }
      );
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found', success: false },
        { status: 404 }
      );
    }

    // Check if already favorited
    const existing = await prisma.favorite.findFirst({
      where: {
        userId,
        propertyId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Property already in favorites', success: false },
        { status: 409 }
      );
    }

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        propertyId,
      },
      include: {
        property: true,
      },
    });

    const propertyData = propertyAdapter.toFrontendFormat(favorite.property);

    return NextResponse.json({
      success: true,
      favorite: {
        ...propertyData,
        favoriteId: favorite.id,
        favoritedAt: favorite.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[POST /api/users/me/favorites] Error:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite', success: false },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/users/me/favorites
 * Remove a property from user's favorites
 * Accepts either propertyId or favoriteId in the request body
 */
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user!.id;
    const body = await req.json();
    const { propertyId, favoriteId } = body;

    if (!propertyId && !favoriteId) {
      return NextResponse.json(
        { error: 'Property ID or Favorite ID is required', success: false },
        { status: 400 }
      );
    }

    // Find the favorite
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId,
        ...(favoriteId ? { id: favoriteId } : { propertyId }),
      },
    });

    if (!favorite) {
      return NextResponse.json(
        { error: 'Favorite not found', success: false },
        { status: 404 }
      );
    }

    // Delete the favorite
    await prisma.favorite.delete({
      where: { id: favorite.id },
    });

    return NextResponse.json({
      success: true,
      removedPropertyId: favorite.propertyId,
    });
  } catch (error) {
    console.error('[DELETE /api/users/me/favorites] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite', success: false },
      { status: 500 }
    );
  }
});
