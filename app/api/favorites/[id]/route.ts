import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // Extract id from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    // Find favorite (by property_id or favorite_id)
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: req.user!.id,
        OR: [
          { id },
          { propertyId: id },
        ],
      },
    });

    if (!favorite) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    await prisma.favorite.delete({
      where: { id: favorite.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete favorite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
