import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyCronSecret } from '@/lib/cronAuth';

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
  // Constant-time cron auth (VULN-013).
  const unauthorized = verifyCronSecret(req);
  if (unauthorized) return unauthorized;

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
