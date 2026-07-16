import { NextResponse } from 'next/server';
import { withOptionalAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

/**
 * GET /api/auth/session — SOFT auth check that ALWAYS returns 200.
 *
 * For cosmetic "am I logged in?" checks (socket connect, guest-vs-authed UI) that
 * run for logged-out visitors too. Using this instead of /api/users/me avoids the
 * red 401s those visitors would otherwise see in the console. `/api/users/me`
 * stays 401-on-logout because many callers use its res.ok as the auth signal.
 */
export const GET = withOptionalAuth(async (req: AuthenticatedRequest) => {
  const user = req.user || null;
  return NextResponse.json({ authenticated: !!user, user });
});
