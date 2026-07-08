import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import propertyAdapter from '@/lib/adapters/propertyAdapter';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      include: { property: true },
      orderBy: { createdAt: 'desc' },
    });

    const properties = favorites.map(f =>
      propertyAdapter.toFrontendFormat(f.property)
    );

    return NextResponse.json({ favorites: properties });
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { property_id } = await req.json();

    if (!property_id) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: property_id },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Check if already favorited
    const existing = await prisma.favorite.findFirst({
      where: {
        userId: req.user!.id,
        propertyId: property_id,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already in favorites' },
        { status: 409 }
      );
    }

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId: req.user!.id,
        propertyId: property_id,
      },
    });

    return NextResponse.json({ success: true, id: favorite.id });
  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
