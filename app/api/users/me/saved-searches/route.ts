import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { deriveNotifyCriteria, generateNotifications, getUnseenCounts } from '@/lib/services/savedSearchMatcher';
import { createSavedSearchSchema } from '@/lib/validations/schemas/user';
import { validateBody } from '@/lib/validations/validate';

const MAX_SAVED_SEARCHES = 20;

/**
 * GET /api/users/me/saved-searches
 * Fetch all saved searches for the authenticated user
 * - Max 20 records
 * - Sorted by updatedAt desc
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user!.id;

    // Evaluate notify-enabled searches for new matches (idempotent), then read counts.
    try { await generateNotifications(userId); } catch (e) { console.error('[saved-searches] notify eval failed:', e); }
    const newCounts = await getUnseenCounts(userId).catch(() => ({} as Record<string, number>));

    const searches = await prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: MAX_SAVED_SEARCHES,
    });

    return NextResponse.json({
      success: true,
      searches: searches.map((s) => ({ ...s, newCount: newCounts[s.id] || 0 })),
      count: searches.length,
    });
  } catch (error) {
    console.error('[GET /api/users/me/saved-searches] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved searches', success: false },
      { status: 500 }
    );
  }
});

/**
 * POST /api/users/me/saved-searches
 * Save a new search
 * - Body: { name?, comment?, query, chatMessages, properties, criteriaChips, insights, topChoiceId }
 * - Check limit of 20 - if exceeded return 400 with { error: 'limit_exceeded', count: N }
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user!.id;
    // Schema validation (VULN-022): required fields + element counts +
    // serialized-size caps on every stored JSON blob.
    const validation = validateBody(createSavedSearchSchema, await req.json());
    if (!validation.success) return validation.error;
    const {
      name,
      comment,
      query,
      chatMessages,
      properties,
      criteriaChips,
      insights,
      topChoiceId,
    } = validation.data;

    // Check limit
    const currentCount = await prisma.savedSearch.count({
      where: { userId },
    });

    if (currentCount >= MAX_SAVED_SEARCHES) {
      return NextResponse.json(
        { error: 'limit_exceeded', count: currentCount, success: false },
        { status: 400 }
      );
    }

    // Derive structured notify criteria + seed the known set from the snapshot,
    // so notifications only fire for listings that appear AFTER this save.
    const notifyCriteria = deriveNotifyCriteria(properties);
    const knownPropertyIds = Array.isArray(properties)
      ? properties.map((p: any) => p?.id).filter((x: any): x is string => typeof x === 'string')
      : [];

    // Create saved search
    const search = await prisma.savedSearch.create({
      data: {
        userId,
        name: name || null,
        comment: comment || null,
        query,
        chatMessages: chatMessages as Prisma.InputJsonValue,
        properties: properties as Prisma.InputJsonValue,
        criteriaChips,
        insights: insights == null ? Prisma.DbNull : (insights as Prisma.InputJsonValue),
        topChoiceId: topChoiceId || null,
        notifyCriteria: notifyCriteria as any,
        knownPropertyIds,
        lastCheckedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      search,
    });
  } catch (error) {
    console.error('[POST /api/users/me/saved-searches] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save search', success: false },
      { status: 500 }
    );
  }
});
