import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withBroker, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getAgentCrmMetrics, effectiveStage } from '@/lib/services/crmService';

/**
 * GET /api/agent/dashboard
 * Aggregate for the broker dashboard (D1): metrics + recent leads + my listings.
 */
export const GET = withBroker(async (req: AuthenticatedRequest) => {
  try {
    const agentId = req.user!.id;
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);

    const [metrics, inquiries7d, listings, recentLeadRows] = await Promise.all([
      getAgentCrmMetrics(agentId),
      // Real 7-day engagement: viewing requests on this agent's properties.
      prisma.viewing.count({ where: { agentId, createdAt: { gte: weekAgo } } }),
      prisma.property.findMany({
        where: { owner_id: agentId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true, title: true, district: true, neighborhood: true, imageUrl: true, images: true,
          price: true, currency: true, available: true,
          _count: { select: { leads: true, viewings: true } },
        },
      }),
      prisma.lead.findMany({
        where: { agent_id: agentId },
        orderBy: { last_contact_at: 'desc' },
        take: 5,
        include: {
          property: { select: { id: true, title: true, district: true } },
          client: { select: { id: true, first_name: true, last_name: true, name: true, avatar_url: true } },
        },
      }),
    ]);

    const recentLeads = recentLeadRows.map((l) => ({ ...l, stage: effectiveStage(l) }));

    return NextResponse.json({
      success: true,
      metrics: { ...metrics, inquiries_7d: inquiries7d },
      listings,
      recentLeads,
    });
  } catch (error) {
    console.error('[GET /api/agent/dashboard] Error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard', success: false }, { status: 500 });
  }
});
