import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import emailService from '@/lib/services/emailService';
import { viewingInclude, formatViewing, ViewingWithRelations } from './types';

/**
 * POST /api/viewings
 * Create a viewing request with negotiation support
 * - Accepts: propertyId, clientId (or clientEmail), scheduledAt, message
 * - Determines agentId from property.owner_id
 * - Sets status based on who creates (agent vs client)
 */
async function createViewingHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { propertyId, clientEmail, clientId, scheduledAt, message } = body;

    // Validate required fields
    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    if (!scheduledAt) {
      return NextResponse.json(
        { error: 'Scheduled date/time is required' },
        { status: 400 }
      );
    }

    // Parse and validate scheduled date
    const scheduledDate = new Date(scheduledAt);
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

    // Get current user info
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        user_type: true,
        name: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get property details including owner
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        address: true,
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

    // Determine agentId (always property owner) and clientId
    const agentId = property.owner_id;
    let finalClientId: string;
    let isAgentCreating = false;

    // Check if current user is the property owner/agent
    if (currentUser.id === property.owner_id ||
        currentUser.user_type === 'owner' ||
        currentUser.user_type === 'agent') {
      isAgentCreating = true;

      // Agent is creating the viewing, need client information
      if (!clientEmail && !clientId) {
        return NextResponse.json(
          { error: 'Client email or client ID is required when agent creates viewing' },
          { status: 400 }
        );
      }

      // Find the client user
      let clientUser;
      if (clientId) {
        clientUser = await prisma.user.findUnique({
          where: { id: clientId },
          select: { id: true, email: true, name: true },
        });

        if (!clientUser) {
          return NextResponse.json(
            { error: 'Client user not found' },
            { status: 404 }
          );
        }
      } else if (clientEmail) {
        clientUser = await prisma.user.findUnique({
          where: { email: clientEmail.toLowerCase().trim() },
          select: { id: true, email: true, name: true },
        });

        if (!clientUser) {
          return NextResponse.json(
            { error: 'No user found with this email. The client must have a Homy account.' },
            { status: 400 }
          );
        }
      }

      if (!clientUser) {
        return NextResponse.json(
          { error: 'Could not find client user' },
          { status: 400 }
        );
      }

      finalClientId = clientUser.id;
    } else {
      // Client is creating the viewing request
      isAgentCreating = false;
      finalClientId = currentUser.id;
    }

    // Check if there's already an active viewing for this property by this client
    const existingViewing = await prisma.viewing.findFirst({
      where: {
        propertyId,
        clientId: finalClientId,
        status: { notIn: ['cancelled', 'completed'] },
      },
    });

    if (existingViewing) {
      return NextResponse.json(
        { error: 'An active viewing request already exists for this client and property' },
        { status: 409 }
      );
    }

    // Determine initial status based on who creates
    const initialStatus = isAgentCreating ? 'pending_client' : 'pending_agent';

    // Create the viewing
    const viewing = await prisma.viewing.create({
      data: {
        propertyId,
        clientId: finalClientId,
        agentId,
        createdById: currentUser.id,
        lastProposedById: currentUser.id,
        scheduledAt: scheduledDate,
        message: message || null,
        status: initialStatus,
      },
      include: viewingInclude,
    });

    // Create notification for the other party
    const notifyUserId = isAgentCreating ? finalClientId : agentId;
    const notifyTitle = isAgentCreating
      ? 'Предложен просмотр'
      : 'Новый запрос на просмотр';
    const notifyBody = isAgentCreating
      ? `${property.owner?.name || 'Владелец объекта'} предложил(а) просмотр «${property.title}» на ${scheduledDate.toLocaleDateString('ru-RU', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : `${currentUser.name || 'Клиент'} запросил(а) просмотр «${property.title}» на ${scheduledDate.toLocaleDateString('ru-RU', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`;

    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: isAgentCreating ? 'viewing_proposed' : 'viewing_request',
        title: notifyTitle,
        body: notifyBody,
        data: {
          viewingId: viewing.id,
          propertyId: property.id,
          scheduledAt: scheduledDate.toISOString(),
        },
      },
    });

    // Send email notification
    try {
      if (!isAgentCreating && property.owner?.email) {
        await emailService.sendViewingRequest(
          property.owner.email,
          property.title,
          scheduledDate
        );
      } else if (isAgentCreating) {
        const clientUser = viewing.client;
        if (clientUser?.email) {
          await emailService.sendViewingConfirmation(
            clientUser.email,
            property.title,
            scheduledDate
          );
        }
      }
    } catch (emailError) {
      console.error('Failed to send viewing notification email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      viewing: formatViewing(viewing as unknown as ViewingWithRelations, userId),
    });
  } catch (error) {
    console.error('Create viewing error:', error);
    return NextResponse.json(
      { error: 'Failed to create viewing' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/viewings
 * Get viewings where user is either client OR agent
 * Includes all party information and groups by upcoming/past
 */
async function getViewingsHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // pending_client, pending_agent, confirmed, completed, cancelled
    const propertyId = searchParams.get('propertyId');
    const role = searchParams.get('role'); // 'client', 'agent', or null for both
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause - fetch where user is either client OR agent
    const whereClause: Record<string, unknown> = {
      OR: [
        { clientId: userId },
        { agentId: userId },
      ],
    };

    // Filter by role if specified
    if (role === 'client') {
      delete whereClause.OR;
      whereClause.clientId = userId;
    } else if (role === 'agent') {
      delete whereClause.OR;
      whereClause.agentId = userId;
    }

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    // Add property filter if provided
    if (propertyId) {
      whereClause.propertyId = propertyId;
    }

    // Fetch viewings with pagination
    const [viewings, total] = await Promise.all([
      prisma.viewing.findMany({
        where: whereClause,
        include: viewingInclude,
        orderBy: { scheduledAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.viewing.count({ where: whereClause }),
    ]);

    // Separate into upcoming and past
    const now = new Date();
    const formattedViewings = viewings.map(v => formatViewing(v as unknown as ViewingWithRelations, userId));

    const upcoming = formattedViewings.filter(v => new Date(v.scheduledAt) >= now);
    const past = formattedViewings.filter(v => new Date(v.scheduledAt) < now);

    return NextResponse.json({
      success: true,
      viewings: formattedViewings,
      upcoming: {
        count: upcoming.length,
        viewings: upcoming,
      },
      past: {
        count: past.length,
        viewings: past,
      },
      total,
      hasMore: offset + viewings.length < total,
    });
  } catch (error) {
    console.error('Get viewings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch viewings' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(createViewingHandler);
export const GET = withAuth(getViewingsHandler);
