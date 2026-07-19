import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { viewingInclude, formatViewing, ViewingWithRelations } from '../../types';

/**
 * PATCH /api/viewings/[id]/approve
 * Approve a viewing proposal
 * - Verify user is the one who should approve (opposite of lastProposedById)
 * - Set status = "confirmed"
 * - Create notification for other party
 */
async function approveViewingHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  try {
    // Extract viewing id from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const approveIndex = pathParts.indexOf('approve');
    const viewingId = pathParts[approveIndex - 1];

    if (!viewingId) {
      return NextResponse.json(
        { error: 'Viewing ID is required' },
        { status: 400 }
      );
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
    const viewing = viewingResult as unknown as ViewingWithRelations;

    // Verify user is part of this viewing
    const isClient = viewing.client.id === userId;
    const isAgent = viewing.agent.id === userId;

    if (!isClient && !isAgent) {
      return NextResponse.json(
        { error: 'You are not part of this viewing' },
        { status: 403 }
      );
    }

    // Verify user is the one who should approve (opposite of lastProposedById)
    // The person who last proposed cannot approve - they must wait for the other party
    if (viewing.lastProposedBy.id === userId) {
      return NextResponse.json(
        { error: 'You cannot approve your own proposal. Wait for the other party to respond.' },
        { status: 403 }
      );
    }

    // Check if viewing is in a pending status
    if (viewing.status !== 'pending_client' && viewing.status !== 'pending_agent') {
      return NextResponse.json(
        { error: `Cannot approve a viewing with status '${viewing.status}'. Only pending viewings can be approved.` },
        { status: 400 }
      );
    }

    // Verify it's the correct party's turn
    if (viewing.status === 'pending_client' && !isClient) {
      return NextResponse.json(
        { error: 'It is the client\'s turn to respond to this viewing' },
        { status: 403 }
      );
    }

    if (viewing.status === 'pending_agent' && !isAgent) {
      return NextResponse.json(
        { error: 'It is the agent\'s turn to respond to this viewing' },
        { status: 403 }
      );
    }

    // Check if viewing is in the past
    if (new Date(viewing.scheduledAt) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot approve a past viewing' },
        { status: 400 }
      );
    }

    // Prevent double-booking the agent's calendar (VULN-005 / VULN-012).
    // The conflict check + confirm MUST be atomic: two pending viewings for the
    // same agent+time, approved concurrently, would otherwise both read "no
    // conflict" and both write 'confirmed' (TOCTOU). A Serializable transaction
    // makes the read-then-write a single unit; the loser aborts with P2034 →
    // we surface it as 409 (same class as a real slot conflict). The in-tx
    // status re-check also blocks a double-approve of the SAME viewing.
    let updatedViewing;
    try {
      updatedViewing = await prisma.$transaction(async (tx) => {
        const current = await tx.viewing.findUnique({
          where: { id: viewingId },
          select: { status: true },
        });
        if (!current || (current.status !== 'pending_client' && current.status !== 'pending_agent')) {
          throw new Error('ALREADY_HANDLED');
        }

        const slotConflict = await tx.viewing.findFirst({
          where: {
            id: { not: viewingId },
            agentId: viewing.agent.id,
            scheduledAt: viewing.scheduledAt,
            status: 'confirmed',
          },
          select: { id: true },
        });
        if (slotConflict) throw new Error('SLOT_CONFLICT');

        return tx.viewing.update({
          where: { id: viewingId },
          data: { status: 'confirmed' },
          include: viewingInclude,
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (e) {
      if (e instanceof Error && e.message === 'SLOT_CONFLICT') {
        return NextResponse.json(
          { error: 'На это время у агента уже подтверждён другой просмотр' },
          { status: 409 }
        );
      }
      if (e instanceof Error && e.message === 'ALREADY_HANDLED') {
        return NextResponse.json(
          { error: 'Этот просмотр уже обработан' },
          { status: 409 }
        );
      }
      // Serializable write-write conflict (concurrent approval) → 409.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
        return NextResponse.json(
          { error: 'На это время у агента уже подтверждён другой просмотр' },
          { status: 409 }
        );
      }
      throw e;
    }

    // Create notification for the other party
    const notifyUserId = isClient ? viewing.agent.id : viewing.client.id;
    const approverName = isClient ? viewing.client.name : viewing.agent.name;

    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: 'viewing_confirmed',
        title: 'Просмотр подтверждён',
        body: `${approverName || 'Другая сторона'} подтвердил(а) просмотр «${viewing.property.title}» на ${viewing.scheduledAt.toLocaleDateString('ru-RU', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        data: {
          viewingId: viewing.id,
          propertyId: viewing.propertyId,
          scheduledAt: viewing.scheduledAt.toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      viewing: formatViewing(updatedViewing as unknown as ViewingWithRelations, userId),
    });
  } catch (error) {
    console.error('Approve viewing error:', error);
    return NextResponse.json(
      { error: 'Failed to approve viewing' },
      { status: 500 }
    );
  }
}

export const PATCH = withAuth(approveViewingHandler);
// Keep POST for backwards compatibility
export const POST = withAuth(approveViewingHandler);
