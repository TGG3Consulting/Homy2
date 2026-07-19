import { NextRequest, NextResponse } from 'next/server';
import { runForAll } from '@/lib/services/savedSearchMatcher';
import { verifyCronSecret } from '@/lib/cronAuth';

/**
 * POST /api/cron/saved-search-notifications
 * Scheduled entry point: evaluate every user's notify-enabled saved searches
 * and create notifications for new matches.
 *
 * Auth: send header `x-cron-secret: <CRON_SECRET>`. If CRON_SECRET is unset,
 * the endpoint only runs outside production (local/dev convenience).
 */
export async function POST(req: NextRequest) {
  // Constant-time cron auth (VULN-013).
  const unauthorized = verifyCronSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const result = await runForAll();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[cron/saved-search-notifications] Error:', error);
    return NextResponse.json({ error: 'Failed to run', success: false }, { status: 500 });
  }
}
