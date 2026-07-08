import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { viewingInclude, formatViewing, ViewingWithRelations } from '../../types';

interface RejectRequestBody {
  reason?: string;
}

/**
 * POST /api/viewings/[id]/reject
 * Reject a viewing request (similar to cancel but semantically different)
 * Used when the agent/owner rejects a client's initial request
 * - Verify user is the agent (property owner)
 * - Set status = "cancelled"
 * - Set cancelledById = current user
 * - Create notification for other party
 */
async function rejectViewingHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  try {
    // Extract viewing id from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const rejectIndex = pathParts.indexOf('reject');
    const viewingId = pathParts[rejectIndex - 1];

    if (!viewingId) {
      return NextResponse.json(
        { error: 'Viewing ID is required' },
        { status: 400 }
      );
    }

    // Parse request body for optional rejection reason
    let rejectionReason: string | undefined;
    try {
      const body: RejectRequestBody = await req.json();
      rejectionReason = body.reason;
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

    // Verify user is the agent (property owner)
    if (viewing.agent.id !== userId) {
      return NextResponse.json(
        { error: 'Only the property owner/agent can reject viewings' },
        { status: 403 }
      );
    }

    // Check if viewing is in a rejectable status
    if (viewing.status !== 'pending_agent' && viewing.status !== 'pending_client') {
      return NextResponse.json(
        { error: `Cannot reject a viewing with status '${viewing.status}'. Only pending viewings can be rejected.` },
        { status: 400 }
      );
    }

    // Get current user info for notification
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    // Update viewing status to cancelled
    const updatedViewing = await prisma.viewing.update({
      where: { id: viewingId },
      data: {
        status: 'cancelled',
        cancelledById: userId,
        comment: rejectionReason ? `Rejection reason: ${rejectionReason}` : viewing.comment,
      },
      include: viewingInclude,
    });

    // Create notification for the client
    await prisma.notification.create({
      data: {
        userId: viewing.client.id,
        type: 'viewing_rejected',
        title: 'Viewing Request Declined',
        body: `${currentUser?.name || 'The property owner'} has declined your viewing request for "${viewing.property.title}"${rejectionReason ? `. Reason: ${rejectionReason}` : ''}`,
        data: {
          viewingId: viewing.id,
          propertyId: viewing.propertyId,
          rejectionReason: rejectionReason || null,
        },
      },
    });

    return NextResponse.json({
      success: true,
      viewing: formatViewing(updatedViewing as unknown as ViewingWithRelations, userId),
    });
  } catch (error) {
    console.error('Reject viewing error:', error);
    return NextResponse.json(
      { error: 'Failed to reject viewing' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(rejectViewingHandler);
export const PATCH = withAuth(rejectViewingHandler);
