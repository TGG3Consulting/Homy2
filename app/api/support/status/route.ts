/**
 * POST /api/support/status - Toggle consultant online status
 * GET /api/support/status - Get current status
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

// ============================================
// POST - Update online status
// ============================================

async function postHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify user is consultant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { user_type: true, is_online: true }
    });

    if (user?.user_type !== 'consultant') {
      return NextResponse.json(
        { error: 'Access denied. Consultants only.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { is_online } = body;

    if (typeof is_online !== 'boolean') {
      return NextResponse.json(
        { error: 'is_online must be a boolean' },
        { status: 400 }
      );
    }

    // Update status
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { is_online },
      select: { is_online: true }
    });

    // If going offline, optionally reassign open conversations
    // (For now, we'll keep them assigned but could implement reassignment logic)

    return NextResponse.json({
      success: true,
      is_online: updated.is_online
    });

  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Get current status
// ============================================

async function getHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { user_type: true, is_online: true }
    });

    if (user?.user_type !== 'consultant') {
      return NextResponse.json(
        { error: 'Access denied. Consultants only.' },
        { status: 403 }
      );
    }

    // Get stats
    const [activeChats, todayResolved] = await Promise.all([
      prisma.conversation.count({
        where: {
          consultant_id: userId,
          status: { in: ['assigned', 'open'] }
        }
      }),
      prisma.conversation.count({
        where: {
          consultant_id: userId,
          status: 'resolved',
          updated_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      is_online: user.is_online,
      stats: {
        activeChats,
        todayResolved
      }
    });

  } catch (error) {
    console.error('Get status error:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(postHandler);
export const GET = withAuth(getHandler);
