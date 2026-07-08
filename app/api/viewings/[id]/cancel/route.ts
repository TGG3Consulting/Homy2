import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { viewingInclude, formatViewing, ViewingWithRelations } from '../../types';

/**
 * PATCH /api/viewings/[id]/cancel
 * Cancel a viewing
 * - Verify user is part of this viewing
 * - Set status = "cancelled"
 * - Set cancelledById = current user
 * - Create notification for other party
 */
async function cancelViewingHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  try {
    // Extract viewing id from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const cancelIndex = pathParts.indexOf('cancel');
    const viewingId = pathParts[cancelIndex - 1];

    if (!viewingId) {
      return NextResponse.json(
        { error: 'Viewing ID is required' },
        { status: 400 }
      );
    }

    // Parse optional reason from request body
    let reason: string | undefined;
    try {
      const body = await req.json();
      reason = body.reason;
    } catch {
      // No body provided, which is fine since reason is optional
    }

    // Find the viewing with all party information
    const viewingResult = await prisma.viewing.findUnique({
      where: { id: viewingId },
      include: viewingInclude,
    });

    if (!viewingResult) {
      return NextResponse.json(
        { error: 'Viewing not found' },
        { status: 404 }
      );
    }

    // Cast to ViewingWithRelations for type safety
    const viewing = viewingResult as unknown as unknown as ViewingWithRelations;

    // Verify user is part of this viewing
    const isClient = viewing.client.id === userId;
    const isAgent = viewing.agent.id === userId;

    if (!isClient && !isAgent) {
      return NextResponse.json(
        { error: 'You are not part of this viewing' },
        { status: 403 }
      );
    }

    // Check if viewing is already cancelled
    if (viewing.status === 'cancelled') {
      return NextResponse.json(
        { error: 'This viewing is already cancelled' },
        { status: 400 }
      );
    }

    // Check if viewing is already completed
    if (viewing.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed viewing' },
        { status: 400 }
      );
    }

    // Get current user info for notification
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    // Update the viewing
    const updatedViewing = await prisma.viewing.update({
      where: { id: viewingId },
      data: {
        status: 'cancelled',
        cancelledById: userId,
        comment: reason ? `Cancellation reason: ${reason}` : viewing.comment,
      },
      include: viewingInclude,
    });

    // Create notification for the other party
    const notifyUserId = isClient ? viewing.agent.id : viewing.client.id;
    const cancellerName = currentUser?.name || (isClient ? viewing.client.name : viewing.agent.name);

    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: 'viewing_cancelled',
        title: 'Viewing Cancelled',
        body: `${cancellerName || 'The other party'} has cancelled the viewing for "${viewing.property.title}" that was scheduled for ${viewing.scheduledAt.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}${reason ? `. Reason: ${reason}` : ''}`,
        data: {
          viewingId: viewing.id,
          propertyId: viewing.propertyId,
          cancelledById: userId,
          reason: reason || null,
        },
      },
    });

    return NextResponse.json({
      success: true,
      viewing: formatViewing(updatedViewing as unknown as ViewingWithRelations, userId),
    });
  } catch (error) {
    console.error('Cancel viewing error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel viewing' },
      { status: 500 }
    );
  }
}

export const PATCH = withAuth(cancelViewingHandler);
export const POST = withAuth(cancelViewingHandler);
