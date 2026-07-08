// app/api/users/me/dashboard/route.ts
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { dashboardService } from '@/lib/services/dashboard';

async function handler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  const dashboard = await dashboardService.getDashboard(userId);
  return NextResponse.json(dashboard);
}

export const GET = withAuth(handler);
