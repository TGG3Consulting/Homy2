/**
 * POST /api/support/assign/[id] - Assign conversation to self
 * DELETE /api/support/assign/[id] - Unassign from conversation
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

/**
 * Extract conversation ID from URL
 */
function extractConversationId(req: AuthenticatedRequest): string | null {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const assignIndex = pathParts.indexOf('assign');
  return pathParts[assignIndex + 1] || null;
}

// ============================================
// POST - Assign conversation to self
// ============================================

async function postHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const conversationId = extractConversationId(req);
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Verify user is consultant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { user_type: true, first_name: true, last_name: true }
    });

    if (user?.user_type !== 'consultant') {
      return NextResponse.json(
        { error: 'Access denied. Consultants only.' },
        { status: 403 }
      );
    }

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        client: {
          select: { id: true, first_name: true }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if already assigned to someone else
    if (conversation.consultant_id && conversation.consultant_id !== userId) {
      return NextResponse.json(
        { error: 'Conversation already assigned to another consultant' },
        { status: 409 }
      );
    }

    // Check if conversation is closed
    if (conversation.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot assign closed conversation' },
        { status: 400 }
      );
    }

    // Assign to self
    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        consultant_id: userId,
        status: 'assigned'
      },
      include: {
        property: {
          select: { id: true, title: true, imageUrl: true }
        },
        client: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar_url: true,
            email: true
          }
        },
        consultant: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar_url: true
          }
        }
      }
    });

    // Notify client that consultant was assigned
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: conversation.client_id,
        type: 'chat_assigned',
        title: 'Консультант назначен',
        body: `${user.first_name || 'Консультант'} ${user.last_name || ''} теперь работает над вашим запросом`,
        data: { conversationId }
      }
    });

    return NextResponse.json({
      success: true,
      conversation: updated
    });

  } catch (error) {
    console.error('Assign conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to assign conversation' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Unassign from conversation
// ============================================

async function deleteHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const conversationId = extractConversationId(req);
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Verify user is consultant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { user_type: true }
    });

    if (user?.user_type !== 'consultant') {
      return NextResponse.json(
        { error: 'Access denied. Consultants only.' },
        { status: 403 }
      );
    }

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if assigned to current user
    if (conversation.consultant_id !== userId) {
      return NextResponse.json(
        { error: 'Not assigned to you' },
        { status: 403 }
      );
    }

    // Only support conversations can be unassigned
    if (conversation.type !== 'support') {
      return NextResponse.json(
        { error: 'Property conversations cannot be unassigned' },
        { status: 400 }
      );
    }

    // Unassign
    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        consultant_id: null,
        status: 'open'
      }
    });

    return NextResponse.json({
      success: true,
      conversation: updated
    });

  } catch (error) {
    console.error('Unassign conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to unassign conversation' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(postHandler);
export const DELETE = withAuth(deleteHandler);
