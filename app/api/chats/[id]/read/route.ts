/**
 * PATCH /api/chats/[id]/read - Mark all messages as read
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
  const chatsIndex = pathParts.indexOf('chats');
  return pathParts[chatsIndex + 1] || null;
}

async function patchHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const conversationId = extractConversationId(req);
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is participant
    const isParticipant =
      conversation.client_id === userId ||
      conversation.consultant_id === userId;

    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Mark all unread messages from other user as read
    const result = await prisma.liveChatMessage.updateMany({
      where: {
        conversation_id: conversationId,
        sender_id: { not: userId },
        read: false
      },
      data: { read: true }
    });

    return NextResponse.json({
      success: true,
      markedAsRead: result.count
    });

  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}

export const PATCH = withAuth(patchHandler);
