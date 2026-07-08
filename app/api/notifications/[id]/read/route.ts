import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

/**
 * POST /api/notifications/[id]/read
 * Mark a single notification as read
 * Verifies ownership before updating
 */
async function markAsReadHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  try {
    // Extract notification id from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const readIndex = pathParts.indexOf('read');
    const notificationId = pathParts[readIndex - 1];

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership before updating
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Update notification as read
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: updatedNotification.id,
        type: updatedNotification.type,
        title: updatedNotification.title,
        body: updatedNotification.body,
        data: updatedNotification.data,
        read: updatedNotification.read,
        createdAt: updatedNotification.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(markAsReadHandler);
