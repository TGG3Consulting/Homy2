import prisma from '@/lib/db/prisma';

// Dashboard interfaces for different user types
export interface BuyerRenterDashboard {
  favorites_count: number;
  viewings_scheduled: number;
  viewings_completed: number;
  properties_viewed: number;
  search_history_count: number;
  recommended_count: number;
}

export interface OwnerDashboard {
  listings_count: number;
  listings_pending: number;
  listings_approved: number;
  total_views: number;
  total_inquiries: number;
  upcoming_viewings: number;
}

export interface AgentDashboard {
  clients_count: number;
  properties_managed: number;
  viewings_conducted: number;
  deals_closed: number;
}

export type DashboardData = BuyerRenterDashboard | OwnerDashboard | AgentDashboard;

// High match score threshold for recommendations
const HIGH_MATCH_SCORE_THRESHOLD = 80;

export const dashboardService = {
  /**
   * Get dashboard statistics based on user type
   */
  async getDashboard(userId: string): Promise<DashboardData> {
    // Get user to determine user_type
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { user_type: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const userType = user.user_type || 'buyer';

    switch (userType) {
      case 'owner':
        return this.getOwnerDashboard(userId);
      case 'agent':
        return this.getAgentDashboard(userId);
      case 'buyer':
      case 'renter':
      default:
        return this.getBuyerRenterDashboard(userId);
    }
  },

  /**
   * Get dashboard for buyers and renters
   */
  async getBuyerRenterDashboard(userId: string): Promise<BuyerRenterDashboard> {
    const now = new Date();

    // Count favorites
    const favorites_count = await prisma.favorite.count({
      where: { userId }
    });

    // Count scheduled viewings (future, not completed) where user is client
    const viewings_scheduled = await prisma.viewing.count({
      where: {
        clientId: userId,
        scheduledAt: { gte: now },
        status: { in: ['pending_client', 'pending_agent', 'confirmed'] }
      }
    });

    // Count completed viewings where user is client
    const viewings_completed = await prisma.viewing.count({
      where: {
        clientId: userId,
        status: 'completed'
      }
    });

    // Properties viewed based on viewings (distinct property count)
    const viewingsWithProperties = await prisma.viewing.findMany({
      where: { clientId: userId },
      select: { propertyId: true },
      distinct: ['propertyId']
    });
    const properties_viewed = viewingsWithProperties.length;

    // Saved searches the user has stored
    const search_history_count = await prisma.savedSearch.count({
      where: { userId }
    });

    // Recommended count - properties with high match score
    const recommended_count = await prisma.property.count({
      where: {
        available: true,
        matchScore: { gte: HIGH_MATCH_SCORE_THRESHOLD }
      }
    });

    return {
      favorites_count,
      viewings_scheduled,
      viewings_completed,
      properties_viewed,
      search_history_count,
      recommended_count
    };
  },

  /**
   * Get dashboard for property owners
   */
  async getOwnerDashboard(userId: string): Promise<OwnerDashboard> {
    const now = new Date();

    // Count total listings
    const listings_count = await prisma.propertyListing.count({
      where: { owner_id: userId }
    });

    // Count pending listings
    const listings_pending = await prisma.propertyListing.count({
      where: {
        owner_id: userId,
        status: 'pending'
      }
    });

    // Count approved listings
    const listings_approved = await prisma.propertyListing.count({
      where: {
        owner_id: userId,
        status: 'approved'
      }
    });

    // Real views of the owner's properties in the last 7 days (excludes the
    // owner's own views). Matches the "Просмотры за 7 дней" mockup tile.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const total_views = await prisma.propertyView.count({
      where: {
        property: { owner_id: userId },
        created_at: { gte: sevenDaysAgo },
        NOT: { viewer_id: userId },
      }
    });

    // Count inquiries (viewings) where user is the agent (property owner)
    const total_inquiries = await prisma.viewing.count({
      where: {
        agentId: userId,
      }
    });

    // Upcoming viewings where user is the agent
    const upcoming_viewings = await prisma.viewing.count({
      where: {
        agentId: userId,
        scheduledAt: { gte: now },
        status: { in: ['pending_client', 'pending_agent', 'confirmed'] }
      }
    });

    return {
      listings_count,
      listings_pending,
      listings_approved,
      total_views,
      total_inquiries,
      upcoming_viewings
    };
  },

  /**
   * Get dashboard for agents
   */
  async getAgentDashboard(userId: string): Promise<AgentDashboard> {
    // Count unique clients from viewings where user is agent
    const clientsResult = await prisma.viewing.findMany({
      where: { agentId: userId },
      select: { clientId: true },
      distinct: ['clientId']
    });
    const clients_count = clientsResult.length;

    // Properties managed - count properties where user is owner
    const properties_managed = await prisma.property.count({
      where: { owner_id: userId }
    });

    // Viewings conducted - count completed viewings where user is agent
    const viewings_conducted = await prisma.viewing.count({
      where: {
        agentId: userId,
        status: 'completed'
      }
    });

    // Deals actually won by this agent
    const deals_closed = await prisma.deal.count({
      where: { agent_id: userId, status: 'won' }
    });

    return {
      clients_count,
      properties_managed,
      viewings_conducted,
      deals_closed
    };
  }
};

export default dashboardService;
