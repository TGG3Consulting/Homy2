/**
 * GET /api/chats/[id] - Get conversation details with messages
 * PATCH /api/chats/[id] - Update conversation status
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { validateBody } from '@/lib/validations/validate';
import { updateConversationSchema } from '@/lib/validations/schemas/chat';

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
// GET - Conversation details with messages
// ============================================

async function getHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = extractConversationId(req);
    if (!id) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            address: true,
            price: true,
            rooms: true
          }
        },
        client: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar_url: true,
            phone: true,
            email: true
          }
        },
        consultant: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar_url: true,
            phone: true,
            is_online: true
          }
        }
      }
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

    // Get messages with pagination
    const messages = await prisma.liveChatMessage.findMany({
      where: { conversation_id: id },
      orderBy: { created_at: 'asc' },
      skip: offset,
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

    // Get total message count
    const totalMessages = await prisma.liveChatMessage.count({
      where: { conversation_id: id }
    });

    // Transform messages
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
      conversation: {
        id: conversation.id,
        type: conversation.type,
        status: conversation.status,
        subject: conversation.subject,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        property: conversation.property,
        client: conversation.client,
        consultant: conversation.consultant,
        isClient: conversation.client_id === userId
      },
      messages: formattedMessages,
      pagination: {
        total: totalMessages,
        limit,
        offset,
        hasMore: offset + messages.length < totalMessages
      }
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Update conversation status
// ============================================

async function patchHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = extractConversationId(req);
    if (!id) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Schema validation (VULN-022): strict shape, status whitelist.
    const validation = validateBody(updateConversationSchema, await req.json());
    if (!validation.success) return validation.error;
    const { status } = validation.data;

    const conversation = await prisma.conversation.findUnique({
      where: { id }
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

    // Only consultant can resolve/close
    if (['resolved', 'closed'].includes(status) && conversation.consultant_id !== userId) {
      return NextResponse.json(
        { error: 'Only consultant can resolve or close conversation' },
        { status: 403 }
      );
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({
      success: true,
      conversation: updated
    });

  } catch (error) {
    console.error('Update conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);
