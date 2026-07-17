import { NextResponse } from 'next/server';

/**
 * DEPRECATED (3.2): a dead twin of /api/users/me. Use /api/users/me (authed user)
 * or /api/auth/session (soft check that always 200s).
 */
export function GET() {
  return NextResponse.json({ error: 'Use /api/users/me or /api/auth/session' }, { status: 410 });
}
