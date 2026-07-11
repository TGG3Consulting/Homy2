import { NextRequest, NextResponse } from 'next/server';
import { runForAll } from '@/lib/services/savedSearchMatcher';

/**
 * POST /api/cron/saved-search-notifications
 * Scheduled entry point: evaluate every user's notify-enabled saved searches
 * and create notifications for new matches.
 *
 * Auth: send header `x-cron-secret: <CRON_SECRET>`. If CRON_SECRET is unset,
 * the endpoint only runs outside production (local/dev convenience).
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
    const result = await runForAll();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[cron/saved-search-notifications] Error:', error);
    return NextResponse.json({ error: 'Failed to run', success: false }, { status: 500 });
  }
}
