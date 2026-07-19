import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Constant-time authorization for cron endpoints (VULN-013).
 *
 * Compares the `x-cron-secret` header to CRON_SECRET with crypto.timingSafeEqual
 * so the check leaks no timing information about the secret. If CRON_SECRET is
 * unset, the endpoint runs only outside production (local/dev convenience) and
 * returns 503 in production (fail-closed).
 *
 * Returns a NextResponse to return early (401/503), or null when authorized.
 */
export function verifyCronSecret(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const provided = req.headers.get('x-cron-secret') || '';
    const a = Buffer.from(provided);
    const b = Buffer.from(secret);
    const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
  }

  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  return null;
}
