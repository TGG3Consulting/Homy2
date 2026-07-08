/**
 * GET /api/support/inbox - Consultant inbox
 * Returns conversations organized by status
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

async function getHandler(req: AuthenticatedRequest) {
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

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'new' | 'mine' | 'resolved' | null

    // Build different queries based on filter
    let whereClause: Record<string, unknown>;

    switch (filter) {
      case 'new':
        // Unassigned support conversations
        whereClause = {
          type: 'support',
          status: 'open',
          consultant_id: null
        };
        break;

      case 'mine':
        // Assigned to current consultant
        whereClause = {
          consultant_id: userId,
          status: { in: ['assigned', 'open'] }
        };
        break;

      case 'resolved':
        // Resolved by current consultant
        whereClause = {
          consultant_id: userId,
          status: { in: ['resolved', 'closed'] }
        };
        break;

      default:
        // All (for overview)
        whereClause = {
          OR: [
            { type: 'support', status: 'open', consultant_id: null },
            { consultant_id: userId }
          ]
        };
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      orderBy: { updated_at: 'desc' },
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
            email: true,
            phone: true,
            createdAt: true
          }
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

    // Get counts for each category
    const [newCount, mineCount, resolvedCount] = await Promise.all([
      prisma.conversation.count({
        where: {
          type: 'support',
          status: 'open',
          consultant_id: null
        }
      }),
      prisma.conversation.count({
        where: {
          consultant_id: userId,
          status: { in: ['assigned', 'open'] }
        }
      }),
      prisma.conversation.count({
        where: {
          consultant_id: userId,
          status: { in: ['resolved', 'closed'] }
        }
      })
    ]);

    // Transform conversations
    const result = conversations.map(conv => ({
      id: conv.id,
      type: conv.type,
      status: conv.status,
      subject: conv.subject,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      property: conv.property,
      client: {
        id: conv.client.id,
        first_name: conv.client.first_name,
        last_name: conv.client.last_name,
        avatar_url: conv.client.avatar_url,
        email: conv.client.email,
        phone: conv.client.phone,
        memberSince: conv.client.createdAt
      },
      lastMessage: conv.messages[0] || null,
      unreadCount: conv._count.messages,
      isAssignedToMe: conv.consultant_id === userId
    }));

    return NextResponse.json({
      success: true,
      conversations: result,
      counts: {
        new: newCount,
        mine: mineCount,
        resolved: resolvedCount
      },
      isOnline: user.is_online
    });

  } catch (error) {
    console.error('Support inbox error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inbox' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
