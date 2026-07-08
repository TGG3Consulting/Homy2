/**
 * Shared types for viewing API endpoints
 */

// Type for formatted viewing response sent to client
export interface ViewingResponse {
  id: string;
  propertyId: string;
  clientId: string;
  agentId: string;
  createdById: string;
  lastProposedById: string;
  cancelledById: string | null;
  scheduledAt: string;
  status: string;
  comment: string | null;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    title: string;
    address: string | null;
    district: string | null;
    imageUrl: string | null;
    images: string[];
    price: number | null;
    currency: string;
  };
  client: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
  };
  agent: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
  };
  createdBy: {
    id: string;
    email: string;
    name: string | null;
  };
  lastProposedBy: {
    id: string;
    email: string;
    name: string | null;
  };
  cancelledBy: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  isCreatedByMe: boolean;
  isMyTurnToRespond: boolean;
  wasCancelledByMe: boolean;
}

// Type for viewing input from Prisma (accepts Decimal)
export interface ViewingWithRelations {
  id: string;
  propertyId: string;
  scheduledAt: Date;
  status: string;
  comment: string | null;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
  cancelledById: string | null;
  clientId: string;
  agentId: string;
  property: {
    id: string;
    title: string;
    address: string | null;
    district: string | null;
    imageUrl: string | null;
    images: string[];
    price: unknown; // Prisma Decimal
    currency: string;
  };
  client: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
  };
  agent: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
  };
  createdBy: {
    id: string;
    email: string;
    name: string | null;
  };
  lastProposedBy: {
    id: string;
    email: string;
    name: string | null;
  };
  cancelledBy: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

/**
 * Common include query for viewings
 */
export const viewingInclude = {
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
    },
  },
  client: {
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
    },
  },
  agent: {
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
  lastProposedBy: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
  cancelledBy: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
};

/**
 * Format viewing with all party information and helper flags
 */
export function formatViewing(viewing: ViewingWithRelations, currentUserId: string): ViewingResponse {
  const isCreatedByMe = viewing.createdBy.id === currentUserId;

  // Determine if it's my turn to respond based on status
  // pending_client = client's turn, pending_agent = agent's turn
  const isClient = viewing.client.id === currentUserId;
  const isMyTurnToRespond =
    (viewing.status === 'pending_client' && isClient) ||
    (viewing.status === 'pending_agent' && !isClient);

  const wasCancelledByMe = viewing.cancelledBy?.id === currentUserId;

  return {
    id: viewing.id,
    propertyId: viewing.propertyId,
    clientId: viewing.client.id,
    agentId: viewing.agent.id,
    createdById: viewing.createdBy.id,
    lastProposedById: viewing.lastProposedBy.id,
    cancelledById: viewing.cancelledBy?.id || null,
    scheduledAt: viewing.scheduledAt.toISOString(),
    status: viewing.status,
    comment: viewing.comment,
    message: viewing.message,
    createdAt: viewing.createdAt.toISOString(),
    updatedAt: viewing.updatedAt.toISOString(),
    property: {
      id: viewing.property.id,
      title: viewing.property.title,
      address: viewing.property.address,
      district: viewing.property.district,
      imageUrl: viewing.property.imageUrl,
      images: viewing.property.images,
      price: viewing.property.price ? Number(viewing.property.price) : null,
      currency: viewing.property.currency,
    },
    client: {
      id: viewing.client.id,
      email: viewing.client.email,
      name: viewing.client.name,
      phone: viewing.client.phone,
    },
    agent: {
      id: viewing.agent.id,
      email: viewing.agent.email,
      name: viewing.agent.name,
      phone: viewing.agent.phone,
    },
    createdBy: {
      id: viewing.createdBy.id,
      email: viewing.createdBy.email,
      name: viewing.createdBy.name,
    },
    lastProposedBy: {
      id: viewing.lastProposedBy.id,
      email: viewing.lastProposedBy.email,
      name: viewing.lastProposedBy.name,
    },
    cancelledBy: viewing.cancelledBy ? {
      id: viewing.cancelledBy.id,
      email: viewing.cancelledBy.email,
      name: viewing.cancelledBy.name,
    } : null,
    isCreatedByMe,
    isMyTurnToRespond,
    wasCancelledByMe,
  };
}
