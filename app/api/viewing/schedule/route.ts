import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import emailService from '@/lib/services/emailService';

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { property_id, scheduled_at, message } = await req.json();

    // Validate input
    if (!property_id || !scheduled_at) {
      return NextResponse.json(
        { error: 'Property ID and scheduled date are required' },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (scheduledDate < new Date()) {
      return NextResponse.json(
        { error: 'Cannot schedule viewing in the past' },
        { status: 400 }
      );
    }

    // Check if property exists and get owner
    const property = await prisma.property.findUnique({
      where: { id: property_id },
      select: {
        id: true,
        title: true,
        owner_id: true,
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    if (!property.owner_id || !property.owner) {
      return NextResponse.json(
        { error: 'Property has no owner assigned' },
        { status: 400 }
      );
    }

    const clientId = req.user!.id;
    const agentId = property.owner_id;

    // Get current user info
    const currentUser = await prisma.user.findUnique({
      where: { id: clientId },
      select: { name: true },
    });

    // Check if there's already an active viewing for this property by this client
    const existingViewing = await prisma.viewing.findFirst({
      where: {
        propertyId: property_id,
        clientId,
        status: { notIn: ['cancelled', 'completed'] },
      },
    });

    if (existingViewing) {
      return NextResponse.json(
        { error: 'An active viewing request already exists for this property' },
        { status: 409 }
      );
    }

    // Create viewing - client is the requester, agent is property owner
    const viewing = await prisma.viewing.create({
      data: {
        propertyId: property_id,
        clientId,
        agentId,
        createdById: clientId,
        lastProposedById: clientId,
        scheduledAt: scheduledDate,
        message: message || null,
        status: 'pending_agent', // Waiting for agent to respond
      },
    });

    // Create notification for the agent
    await prisma.notification.create({
      data: {
        userId: agentId,
        type: 'viewing_request',
        title: 'New Viewing Request',
        body: `${currentUser?.name || 'A client'} has requested a viewing for "${property.title}" on ${scheduledDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        data: {
          viewingId: viewing.id,
          propertyId: property.id,
          scheduledAt: scheduledDate.toISOString(),
        },
      },
    });

    // Send confirmation email to client
    try {
      await emailService.sendViewingConfirmation(
        req.user!.email,
        property.title,
        scheduledDate
      );
      // Also notify property owner
      if (property.owner?.email) {
        await emailService.sendViewingRequest(
          property.owner.email,
          property.title,
          scheduledDate
        );
      }
    } catch (emailError) {
      console.error('Failed to send viewing notification email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      viewing_id: viewing.id,
      scheduled_at: viewing.scheduledAt,
    });
  } catch (error) {
    console.error('Schedule viewing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const viewings = await prisma.viewing.findMany({
      where: {
        OR: [
          { clientId: req.user!.id },
          { agentId: req.user!.id },
        ],
      },
      include: {
        property: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json({ viewings });
  } catch (error) {
    console.error('Get viewings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
