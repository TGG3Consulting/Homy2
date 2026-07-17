import { NextResponse } from 'next/server';
import { withOptionalAuth } from '@/lib/middleware/authMiddleware';

/**
 * GET /api/consultant/assigned
 * Returns the consultant assigned to the current user.
 *
 * 3.4: there is no user↔consultant assignment mechanism yet, so this must NOT
 * fabricate a person. It returns { consultant: null } honestly. When an
 * assignment model exists, look it up here and return the real consultant.
 */
export const GET = withOptionalAuth(async () => {
  return NextResponse.json({ consultant: null });
});
