import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { validateBody } from '@/lib/validations/validate';
import { proposeViewingSchema } from '@/lib/validations/schemas/viewing';
import { viewingInclude, formatViewing, ViewingWithRelations } from '../../types';

/**
 * PATCH /api/viewings/[id]/propose
 * Propose a new time for a viewing (counter-proposal)
 * - Accept: scheduledAt, comment
 * - Verify user is part of this viewing
 * - Update scheduledAt, comment
 * - Set lastProposedById = current user
 * - Toggle status based on who proposes
 * - Create notification for other party
 */
async function proposeViewingHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  try {
    // Extract viewing id from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const proposeIndex = pathParts.indexOf('propose');
    const viewingId = pathParts[proposeIndex - 1];

    if (!viewingId) {
      return NextResponse.json(
        { error: 'Viewing ID is required' },
        { status: 400 }
      );
    }

    // Zod gate (VULN-022): ISO future date + capped comment, .strict()
    // against junk keys — replaces the manual field checks.
    const validation = validateBody(proposeViewingSchema, await req.json());
    if (!validation.success) return validation.error;
    const { scheduledAt, comment } = validation.data;

    const scheduledDate = new Date(scheduledAt);

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

    // Check if viewing can be renegotiated
    if (viewing.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot propose changes to a cancelled viewing' },
        { status: 400 }
      );
    }

    if (viewing.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot propose changes to a completed viewing' },
        { status: 400 }
      );
    }

    // Determine the new status based on who is proposing
    // If client proposes: status = pending_agent (agent's turn to respond)
    // If agent proposes: status = pending_client (client's turn to respond)
    const newStatus = isClient ? 'pending_agent' : 'pending_client';

    // Get current user info for notification
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    // Update the viewing
    const updatedViewing = await prisma.viewing.update({
      where: { id: viewingId },
      data: {
        scheduledAt: scheduledDate,
        comment: comment || null,
        lastProposedById: userId,
        status: newStatus,
      },
      include: viewingInclude,
    });

    // Create notification for the other party
    const notifyUserId = isClient ? viewing.agent.id : viewing.client.id;
    const proposerName = currentUser?.name || (isClient ? viewing.client.name : viewing.agent.name);

    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: 'viewing_proposed',
        title: 'Предложено новое время',
        body: `${proposerName || 'Другая сторона'} предложил(а) новое время просмотра «${viewing.property.title}»: ${scheduledDate.toLocaleDateString('ru-RU', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}${comment ? `. Комментарий: ${comment}` : ''}`,
        data: {
          viewingId: viewing.id,
          propertyId: viewing.propertyId,
          scheduledAt: scheduledDate.toISOString(),
          comment: comment || null,
        },
      },
    });

    return NextResponse.json({
      success: true,
      viewing: formatViewing(updatedViewing as unknown as ViewingWithRelations, userId),
    });
  } catch (error) {
    console.error('Propose viewing error:', error);
    return NextResponse.json(
      { error: 'Failed to propose new viewing time' },
      { status: 500 }
    );
  }
}

export const PATCH = withAuth(proposeViewingHandler);
export const POST = withAuth(proposeViewingHandler);
