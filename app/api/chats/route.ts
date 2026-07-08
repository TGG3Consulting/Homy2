/**
 * POST /api/chats - Create a new conversation
 * GET /api/chats - List user's conversations
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

// ============================================
// POST - Create conversation
// ============================================

async function postHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, property_id, subject } = body;

    // Validate type
    if (!type || !['property', 'support'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid conversation type. Must be "property" or "support"' },
        { status: 400 }
      );
    }

    let consultantId: string | null = null;

    if (type === 'property') {
      // Property chat: find property owner
      if (!property_id) {
        return NextResponse.json(
          { error: 'property_id is required for property chats' },
          { status: 400 }
        );
      }

      const property = await prisma.property.findUnique({
        where: { id: property_id },
        select: { id: true, owner_id: true, title: true }
      });

      if (!property) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      }

      if (!property.owner_id) {
        return NextResponse.json(
          { error: 'Property has no owner assigned' },
          { status: 400 }
        );
      }

      // Can't chat with yourself
      if (property.owner_id === userId) {
        return NextResponse.json(
          { error: 'Cannot create chat with yourself' },
          { status: 400 }
        );
      }

      consultantId = property.owner_id;

      // Check if conversation already exists
      const existing = await prisma.conversation.findFirst({
        where: {
          type: 'property',
          property_id: property_id,
          client_id: userId,
          consultant_id: consultantId,
          status: { not: 'closed' }
        }
      });

      if (existing) {
        return NextResponse.json({
          success: true,
          conversation: existing,
          existing: true
        });
      }

      // Create conversation
      const conversation = await prisma.conversation.create({
        data: {
          type: 'property',
          status: 'assigned', // Property owner is auto-assigned
          property_id: property_id,
          client_id: userId,
          consultant_id: consultantId,
          subject: subject || `Запрос по объекту: ${property.title?.substring(0, 50) || property_id}`
        },
        include: {
          property: {
            select: { id: true, title: true, imageUrl: true }
          },
          client: {
            select: { id: true, first_name: true, last_name: true, avatar_url: true }
          },
          consultant: {
            select: { id: true, first_name: true, last_name: true, avatar_url: true }
          }
        }
      });

      // Create notification for property owner
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: consultantId,
          type: 'chat_new',
          title: 'Новый запрос по объекту',
          body: `${conversation.client.first_name || 'Пользователь'} интересуется вашим объектом`,
          data: { conversationId: conversation.id, propertyId: property_id }
        }
      });

      return NextResponse.json({
        success: true,
        conversation,
        existing: false
      });

    } else {
      // Support chat: find available consultant
      // Find online consultant with fewest open chats
      const availableConsultant = await prisma.user.findFirst({
        where: {
          user_type: 'consultant',
          is_online: true,
          is_blocked: false
        },
        orderBy: {
          conversationsAsConsultant: {
            _count: 'asc'
          }
        },
        select: { id: true, first_name: true, last_name: true }
      });

      // Check if user already has open support conversation
      const existingSupport = await prisma.conversation.findFirst({
        where: {
          type: 'support',
          client_id: userId,
          status: { in: ['open', 'assigned'] }
        }
      });

      if (existingSupport) {
        return NextResponse.json({
          success: true,
          conversation: existingSupport,
          existing: true
        });
      }

      // Create conversation (may be unassigned if no consultant available)
      const conversation = await prisma.conversation.create({
        data: {
          type: 'support',
          status: availableConsultant ? 'assigned' : 'open',
          client_id: userId,
          consultant_id: availableConsultant?.id || null,
          subject: subject || 'Обращение в поддержку'
        },
        include: {
          client: {
            select: { id: true, first_name: true, last_name: true, avatar_url: true }
          },
          consultant: {
            select: { id: true, first_name: true, last_name: true, avatar_url: true }
          }
        }
      });

      // Notify consultant if assigned
      if (availableConsultant) {
        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: availableConsultant.id,
            type: 'chat_new',
            title: 'Новый запрос в поддержку',
            body: `${conversation.client.first_name || 'Пользователь'} обратился в поддержку`,
            data: { conversationId: conversation.id }
          }
        });
      }

      return NextResponse.json({
        success: true,
        conversation,
        existing: false,
        consultantAvailable: !!availableConsultant
      });
    }

  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

// ============================================
// GET - List conversations
// ============================================

async function getHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'property' | 'support' | null (all)
    const status = searchParams.get('status'); // 'open' | 'assigned' | 'resolved' | 'closed' | null

    // Build where clause - user is either client or consultant
    const whereClause: Record<string, unknown> = {
      OR: [
        { client_id: userId },
        { consultant_id: userId }
      ]
    };

    if (type) {
      whereClause.type = type;
    }

    if (status) {
      whereClause.status = status;
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      orderBy: { updated_at: 'desc' },
      include: {
        property: {
          select: { id: true, title: true, imageUrl: true, address: true }
        },
        client: {
          select: { id: true, first_name: true, last_name: true, avatar_url: true }
        },
        consultant: {
          select: { id: true, first_name: true, last_name: true, avatar_url: true }
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            sender_id: true,
            read: true,
            created_at: true
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                read: false,
                sender_id: { not: userId }
              }
            }
          }
        }
      }
    });

    // Transform to include last message and unread count
    const result = conversations.map(conv => ({
      id: conv.id,
      type: conv.type,
      status: conv.status,
      subject: conv.subject,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      property: conv.property,
      client: conv.client,
      consultant: conv.consultant,
      lastMessage: conv.messages[0] || null,
      unreadCount: conv._count.messages,
      isClient: conv.client_id === userId
    }));

    return NextResponse.json({
      success: true,
      conversations: result,
      total: result.length
    });

  } catch (error) {
    console.error('List conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(postHandler);
export const GET = withAuth(getHandler);
