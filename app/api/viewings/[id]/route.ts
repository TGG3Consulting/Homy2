import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { viewingInclude, formatViewing, ViewingWithRelations } from '../types';

/**
 * GET /api/viewings/[id]
 * Get a single viewing by ID
 * - Verify user is part of this viewing (client or agent)
 * - Return full viewing details with all party information
 */
async function getViewingHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  try {
    // Extract viewing id from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const viewingsIndex = pathParts.indexOf('viewings');
    const viewingId = pathParts[viewingsIndex + 1];

    if (!viewingId) {
      return NextResponse.json(
        { error: 'Viewing ID is required' },
        { status: 400 }
      );
    }

    // Find the viewing with all party information
    const viewingResult = await prisma.viewing.findUnique({
      where: { id: viewingId },
      include: viewingInclude,
    });

    if (!viewingResult) {
      return NextResponse.json(
        { error: 'Viewing not found' },
        { status: 404 }
      );
    }

    // Cast to ViewingWithRelations for type safety
    const viewing = viewingResult as unknown as unknown as ViewingWithRelations;

    // Verify user is part of this viewing
    const isClient = viewing.client.id === userId;
    const isAgent = viewing.agent.id === userId;

    if (!isClient && !isAgent) {
      return NextResponse.json(
        { error: 'You are not part of this viewing' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      viewing: formatViewing(viewing as unknown as ViewingWithRelations, userId),
    });
  } catch (error) {
    console.error('Get viewing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch viewing' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getViewingHandler);
