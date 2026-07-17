/**
 * POST /api/chats/[id]/messages - Send a message (REST fallback)
 * GET /api/chats/[id]/messages - Get messages with pagination
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimiter';

/**
 * Extract conversation ID from URL
 */
function extractConversationId(req: AuthenticatedRequest): string | null {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const chatsIndex = pathParts.indexOf('chats');
  return pathParts[chatsIndex + 1] || null;
}

// ============================================
// POST - Send message
// ============================================

async function postHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate-limit message sending per user (VULN-015).
  const rl = checkRateLimit(`chat-msg:${userId}`, RATE_LIMITS.api);
  if (!rl.success) {
    return NextResponse.json({ error: 'Слишком много сообщений, притормозите' }, { status: 429 });
  }

  try {
    const conversationId = extractConversationId(req);
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Message too long. Maximum 5000 characters.' },
        { status: 400 }
      );
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

    // Check if conversation is closed
    if (conversation.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot send message to closed conversation' },
        { status: 400 }
      );
    }

    // Create message
    const message = await prisma.liveChatMessage.create({
      data: {
        conversation_id: conversationId,
        sender_id: userId,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar_url: true
          }
        }
      }
    });

    // Update conversation updated_at
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updated_at: new Date() }
    });

    // Create notification for recipient if needed
    const recipientId = conversation.client_id === userId
      ? conversation.consultant_id
      : conversation.client_id;

    if (recipientId) {
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: recipientId,
          type: 'chat_message',
          title: `Новое сообщение от ${message.sender.first_name || 'Пользователь'}`,
          body: content.length > 100 ? content.substring(0, 100) + '...' : content,
          data: { conversationId }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        senderId: message.sender_id,
        senderName: `${message.sender.first_name} ${message.sender.last_name}`.trim(),
        senderAvatar: message.sender.avatar_url,
        content: message.content,
        read: message.read,
        createdAt: message.created_at.toISOString()
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Get messages with pagination
// ============================================

async function getHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const conversationId = extractConversationId(req);
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const before = searchParams.get('before'); // Message ID for cursor pagination
    const after = searchParams.get('after');   // Message ID for cursor pagination

    // Check access
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isParticipant =
      conversation.client_id === userId ||
      conversation.consultant_id === userId;

    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build where clause for cursor pagination
    const whereClause: Record<string, unknown> = {
      conversation_id: conversationId
    };

    if (before) {
      const beforeMsg = await prisma.liveChatMessage.findUnique({
        where: { id: before },
        select: { created_at: true }
      });
      if (beforeMsg) {
        whereClause.created_at = { lt: beforeMsg.created_at };
      }
    }

    if (after) {
      const afterMsg = await prisma.liveChatMessage.findUnique({
        where: { id: after },
        select: { created_at: true }
      });
      if (afterMsg) {
        whereClause.created_at = { gt: afterMsg.created_at };
      }
    }

    const messages = await prisma.liveChatMessage.findMany({
      where: whereClause,
      orderBy: { created_at: before ? 'desc' : 'asc' },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar_url: true
          }
        }
      }
    });

    // Reverse if fetching before (to maintain chronological order)
    if (before) {
      messages.reverse();
    }

    const formattedMessages = messages.map(m => ({
      id: m.id,
      senderId: m.sender_id,
      senderName: `${m.sender.first_name} ${m.sender.last_name}`.trim(),
      senderAvatar: m.sender.avatar_url,
      content: m.content,
      read: m.read,
      createdAt: m.created_at.toISOString()
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      hasMore: messages.length === limit
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(postHandler);
export const GET = withAuth(getHandler);
