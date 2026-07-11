import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { markSearchSeen } from '@/lib/services/savedSearchMatcher';

/**
 * Extract saved search ID from URL
 */
function extractSearchId(url: string): string | null {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/');
  const savedSearchesIndex = pathParts.indexOf('saved-searches');
  if (savedSearchesIndex === -1 || savedSearchesIndex + 1 >= pathParts.length) {
    return null;
  }
  return pathParts[savedSearchesIndex + 1];
}

/**
 * GET /api/users/me/saved-searches/[id]
 * Get a single saved search by ID
 * - Verify that it belongs to the user
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user!.id;
    const searchId = extractSearchId(req.url);

    if (!searchId) {
      return NextResponse.json(
        { error: 'Search ID is required', success: false },
        { status: 400 }
      );
    }

    const search = await prisma.savedSearch.findUnique({
      where: { id: searchId },
    });

    if (!search) {
      return NextResponse.json(
        { error: 'Saved search not found', success: false },
        { status: 404 }
      );
    }

    // Check ownership
    if (search.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied', success: false },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      search,
    });
  } catch (error) {
    console.error('[GET /api/users/me/saved-searches/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved search', success: false },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/users/me/saved-searches/[id]
 * Update an existing saved search
 * - Overwrite chatMessages, properties, criteriaChips, insights, topChoiceId, comment, name
 */
export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user!.id;
    const searchId = extractSearchId(req.url);

    if (!searchId) {
      return NextResponse.json(
        { error: 'Search ID is required', success: false },
        { status: 400 }
      );
    }

    // Find existing search
    const existingSearch = await prisma.savedSearch.findUnique({
      where: { id: searchId },
    });

    if (!existingSearch) {
      return NextResponse.json(
        { error: 'Saved search not found', success: false },
        { status: 404 }
      );
    }

    // Check ownership
    if (existingSearch.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied', success: false },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      comment,
      chatMessages,
      properties,
      criteriaChips,
      insights,
      topChoiceId,
    } = body;

    // Build update data - only include fields that are provided
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name = name || null;
    }
    if (comment !== undefined) {
      updateData.comment = comment || null;
    }
    if (chatMessages !== undefined) {
      updateData.chatMessages = chatMessages;
    }
    if (properties !== undefined) {
      updateData.properties = properties;
    }
    if (criteriaChips !== undefined) {
      updateData.criteriaChips = criteriaChips;
    }
    if (insights !== undefined) {
      updateData.insights = insights || null;
    }
    if (topChoiceId !== undefined) {
      updateData.topChoiceId = topChoiceId || null;
    }

    // Update the saved search
    const search = await prisma.savedSearch.update({
      where: { id: searchId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      search,
    });
  } catch (error) {
    console.error('[PUT /api/users/me/saved-searches/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update saved search', success: false },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/users/me/saved-searches/[id]
 * Lightweight updates for saved-search notifications.
 * - Body: { notify?: boolean, markSeen?: boolean }
 *   notify   → toggle "new match" alerts for this search
 *   markSeen → mark this search's new-match notifications as read (clears the badge)
 */
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user!.id;
    const searchId = extractSearchId(req.url);
    if (!searchId) {
      return NextResponse.json({ error: 'Search ID is required', success: false }, { status: 400 });
    }

    const existing = await prisma.savedSearch.findUnique({ where: { id: searchId } });
    if (!existing) {
      return NextResponse.json({ error: 'Saved search not found', success: false }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Access denied', success: false }, { status: 403 });
    }

    const body = await req.json().catch(() => ({} as any));
    const { notify, markSeen } = body;

    if (markSeen) {
      await markSearchSeen(userId, searchId);
    }

    let search = existing;
    if (typeof notify === 'boolean') {
      search = await prisma.savedSearch.update({
        where: { id: searchId },
        data: { notify },
      });
    }

    return NextResponse.json({ success: true, search: { id: search.id, notify: search.notify } });
  } catch (error) {
    console.error('[PATCH /api/users/me/saved-searches/[id]] Error:', error);
    return NextResponse.json({ error: 'Failed to update saved search', success: false }, { status: 500 });
  }
});

/**
 * DELETE /api/users/me/saved-searches/[id]
 * Delete a saved search
 */
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user!.id;
    const searchId = extractSearchId(req.url);

    if (!searchId) {
      return NextResponse.json(
        { error: 'Search ID is required', success: false },
        { status: 400 }
      );
    }

    // Find existing search
    const existingSearch = await prisma.savedSearch.findUnique({
      where: { id: searchId },
    });

    if (!existingSearch) {
      return NextResponse.json(
        { error: 'Saved search not found', success: false },
        { status: 404 }
      );
    }

    // Check ownership
    if (existingSearch.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied', success: false },
        { status: 403 }
      );
    }

    // Delete the saved search
    await prisma.savedSearch.delete({
      where: { id: searchId },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[DELETE /api/users/me/saved-searches/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved search', success: false },
      { status: 500 }
    );
  }
});
