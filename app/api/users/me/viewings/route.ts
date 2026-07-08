// app/api/users/me/viewings/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export type ViewingStatus = 'pending_client' | 'pending_agent' | 'confirmed' | 'completed' | 'cancelled';

export interface ViewingResponse {
  id: string;
  propertyId: string;
  scheduledAt: string;
  status: ViewingStatus;
  message: string | null;
  comment: string | null;
  createdAt: string;
  isMyTurnToRespond: boolean;
  wasCancelledByMe: boolean;
  property: {
    id: string;
    title: string;
    address: string | null;
    district: string | null;
    imageUrl: string | null;
    images: string[];
    price: number | null;
    currency: string;
    contact: {
      name?: string;
      phone?: string;
      type?: string;
    } | null;
  };
  client: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  agent: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
}

export interface ViewingsApiResponse {
  upcoming: ViewingResponse[];
  completed: ViewingResponse[];
  total: number;
}

async function getViewingsHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as ViewingStatus | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const now = new Date();

    // Build where clause - user can be client OR agent
    const baseWhere = {
      OR: [
        { clientId: userId },
        { agentId: userId },
      ],
    };
    const statusFilter = status ? { status } : {};

    // Fetch all viewings with property and party data
    const viewings = await prisma.viewing.findMany({
      where: {
        ...baseWhere,
        ...statusFilter,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            district: true,
            imageUrl: true,
            images: true,
            price: true,
            currency: true,
            contact: true,
          },
        },
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
        cancelledBy: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.viewing.count({
      where: {
        ...baseWhere,
        ...statusFilter,
      },
    });

    // Transform and categorize viewings
    const transformViewing = (viewing: typeof viewings[0]): ViewingResponse => {
      const isClient = viewing.clientId === userId;
      const isMyTurnToRespond =
        (viewing.status === 'pending_client' && isClient) ||
        (viewing.status === 'pending_agent' && !isClient);
      const wasCancelledByMe = viewing.cancelledById === userId;

      return {
        id: viewing.id,
        propertyId: viewing.propertyId,
        scheduledAt: viewing.scheduledAt.toISOString(),
        status: viewing.status as ViewingStatus,
        message: viewing.message,
        comment: viewing.comment,
        createdAt: viewing.createdAt.toISOString(),
        isMyTurnToRespond,
        wasCancelledByMe,
        property: {
          id: viewing.property.id,
          title: viewing.property.title,
          address: viewing.property.address,
          district: viewing.property.district,
          imageUrl: viewing.property.imageUrl || viewing.property.images?.[0] || null,
          images: viewing.property.images || [],
          price: viewing.property.price ? Number(viewing.property.price) : null,
          currency: viewing.property.currency,
          contact: viewing.property.contact as ViewingResponse['property']['contact'],
        },
        client: {
          id: viewing.client.id,
          name: viewing.client.name,
          email: viewing.client.email,
          phone: viewing.client.phone,
        },
        agent: {
          id: viewing.agent.id,
          name: viewing.agent.name,
          email: viewing.agent.email,
          phone: viewing.agent.phone,
        },
      };
    };

    // Separate into upcoming and completed
    const upcoming: ViewingResponse[] = [];
    const completed: ViewingResponse[] = [];

    for (const viewing of viewings) {
      const transformed = transformViewing(viewing);
      const isUpcoming =
        new Date(viewing.scheduledAt) > now &&
        viewing.status !== 'completed' &&
        viewing.status !== 'cancelled';

      if (isUpcoming) {
        upcoming.push(transformed);
      } else {
        completed.push(transformed);
      }
    }

    // Sort: upcoming by date ascending, completed by date descending
    upcoming.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    completed.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

    const response: ViewingsApiResponse = {
      upcoming,
      completed,
      total,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get viewings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch viewings' },
      { status: 500 }
    );
  }
}

async function cancelViewingHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  try {
    const { viewingId, reason } = await req.json();

    if (!viewingId) {
      return NextResponse.json(
        { error: 'Viewing ID is required' },
        { status: 400 }
      );
    }

    // Find the viewing and verify user is part of it
    const viewing = await prisma.viewing.findFirst({
      where: {
        id: viewingId,
        OR: [
          { clientId: userId },
          { agentId: userId },
        ],
      },
    });

    if (!viewing) {
      return NextResponse.json(
        { error: 'Viewing not found or you are not part of this viewing' },
        { status: 404 }
      );
    }

    // Check if viewing can be cancelled
    if (viewing.status === 'completed' || viewing.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed or already cancelled viewing' },
        { status: 400 }
      );
    }

    // Update viewing status to cancelled
    const updatedViewing = await prisma.viewing.update({
      where: { id: viewingId },
      data: {
        status: 'cancelled',
        cancelledById: userId,
        comment: reason ? `Cancellation reason: ${reason}` : viewing.comment,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Create notification for the other party
    const notifyUserId = viewing.clientId === userId ? viewing.agentId : viewing.clientId;
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: 'viewing_cancelled',
        title: 'Viewing Cancelled',
        body: `${currentUser?.name || 'The other party'} has cancelled the viewing for "${updatedViewing.property.title}"${reason ? `. Reason: ${reason}` : ''}`,
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
      message: 'Viewing cancelled successfully',
      viewing: {
        id: updatedViewing.id,
        status: updatedViewing.status,
        propertyTitle: updatedViewing.property.title,
      },
    });
  } catch (error) {
    console.error('Cancel viewing error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel viewing' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getViewingsHandler);
export const PATCH = withAuth(cancelViewingHandler);
