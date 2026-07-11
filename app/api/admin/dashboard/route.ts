import { NextResponse } from 'next/server';
import { withAdmin, AdminAuthenticatedRequest } from '@/lib/middleware/adminMiddleware';
import prisma from '@/lib/db/prisma';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    blocked: number;
    by_role: {
      user: number;
      moderator: number;
      admin: number;
    };
    by_type: {
      buyer: number;
      renter: number;
      owner: number;
      agent: number;
    };
    new_today: number;
    new_this_week: number;
  };
  listings: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    new_today: number;
  };
  properties: {
    total: number;
    available: number;
    verified: number;
  };
  viewings: {
    total: number;
    pending: number;
    completed: number;
    this_week: number;
  };
  deals: {
    open: number;
    won_this_month: number;
  };
  recent_actions: Array<{
    id: string;
    admin_email: string;
    action_type: string;
    target_type: string;
    created_at: string;
  }>;
}

async function getDashboardStats(req: AdminAuthenticatedRequest) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    // Parallel queries for performance
    const [
      totalUsers,
      blockedUsers,
      usersByRole,
      usersByType,
      newUsersToday,
      newUsersWeek,
      totalListings,
      pendingListings,
      approvedListings,
      rejectedListings,
      newListingsToday,
      totalProperties,
      availableProperties,
      verifiedProperties,
      totalViewings,
      pendingViewings,
      completedViewings,
      weekViewings,
      recentActions,
      dealsOpen,
      dealsWonMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { is_blocked: true } }),
      prisma.user.groupBy({ by: ['role'], _count: true }),
      prisma.user.groupBy({ by: ['user_type'], _count: true }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.propertyListing.count(),
      prisma.propertyListing.count({ where: { status: 'pending' } }),
      prisma.propertyListing.count({ where: { status: 'approved' } }),
      prisma.propertyListing.count({ where: { status: 'rejected' } }),
      prisma.propertyListing.count({ where: { created_at: { gte: todayStart } } }),
      prisma.property.count(),
      prisma.property.count({ where: { available: true } }),
      prisma.property.count({ where: { verified: true } }),
      prisma.viewing.count(),
      prisma.viewing.count({ where: { status: 'pending' } }),
      prisma.viewing.count({ where: { status: 'completed' } }),
      prisma.viewing.count({ where: { scheduledAt: { gte: weekStart } } }),
      prisma.adminActionLog.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: { admin: { select: { email: true } } },
      }),
      prisma.deal.count({ where: { status: 'open' } }),
      prisma.deal.count({ where: { status: 'won', closed_at: { gte: monthStart } } }),
    ]);

    // Transform role counts
    const roleCountMap: Record<string, number> = {};
    usersByRole.forEach(r => { roleCountMap[r.role || 'user'] = r._count; });

    // Transform type counts
    const typeCountMap: Record<string, number> = {};
    usersByType.forEach(t => { typeCountMap[t.user_type || 'buyer'] = t._count; });

    const stats: DashboardStats = {
      users: {
        total: totalUsers,
        active: totalUsers - blockedUsers,
        blocked: blockedUsers,
        by_role: {
          user: roleCountMap['user'] || 0,
          moderator: roleCountMap['moderator'] || 0,
          admin: roleCountMap['admin'] || 0,
        },
        by_type: {
          buyer: typeCountMap['buyer'] || 0,
          renter: typeCountMap['renter'] || 0,
          owner: typeCountMap['owner'] || 0,
          agent: typeCountMap['agent'] || 0,
        },
        new_today: newUsersToday,
        new_this_week: newUsersWeek,
      },
      listings: {
        total: totalListings,
        pending: pendingListings,
        approved: approvedListings,
        rejected: rejectedListings,
        new_today: newListingsToday,
      },
      properties: {
        total: totalProperties,
        available: availableProperties,
        verified: verifiedProperties,
      },
      viewings: {
        total: totalViewings,
        pending: pendingViewings,
        completed: completedViewings,
        this_week: weekViewings,
      },
      deals: {
        open: dealsOpen,
        won_this_month: dealsWonMonth,
      },
      recent_actions: recentActions.map(a => ({
        id: a.id,
        admin_email: a.admin.email,
        action_type: a.action_type,
        target_type: a.target_type,
        created_at: a.created_at.toISOString(),
      })),
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}

export const GET = withAdmin(getDashboardStats);
