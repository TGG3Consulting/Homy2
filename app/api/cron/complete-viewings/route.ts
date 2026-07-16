import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

/**
 * POST /api/cron/complete-viewings
 * Scheduled entry point: mark CONFIRMED viewings whose scheduled time has passed
 * as `completed`. This is what makes the "completed" counters (admin dashboard,
 * platform metrics, buyer dashboard) real — nothing else transitions to completed.
 *
 * Only `confirmed` viewings are completed. Pending ones that lapsed were never
 * agreed, and cancelled ones stay cancelled.
 *
 * Auth: header `x-cron-secret: <CRON_SECRET>`. If CRON_SECRET is unset, the
 * endpoint only runs outside production (local/dev convenience).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (req.headers.get('x-cron-secret') !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }

  try {
    const result = await prisma.viewing.updateMany({
      where: { status: 'confirmed', scheduledAt: { lt: new Date() } },
      data: { status: 'completed' },
    });
    return NextResponse.json({ success: true, completed: result.count });
  } catch (error) {
    console.error('[cron/complete-viewings] Error:', error);
    return NextResponse.json({ error: 'Failed to run', success: false }, { status: 500 });
  }
}
