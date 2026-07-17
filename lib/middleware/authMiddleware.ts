import { NextRequest, NextResponse } from 'next/server';
import { jwtService } from '../services/jwtService';
import { getAccessTokenFromRequest } from '../cookies';
import prisma from '../db/prisma';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
  };
}

export type AuthHandler = (
  req: AuthenticatedRequest
) => Promise<NextResponse>;

/**
 * Extract token from Authorization header or cookies
 */
function extractToken(req: NextRequest): string | null {
  // First try Authorization header (for backwards compatibility)
  const authHeader = req.headers.get('authorization');
  const headerToken = jwtService.extractTokenFromHeader(authHeader);
  if (headerToken) return headerToken;

  // Then try HttpOnly cookie
  const cookieToken = getAccessTokenFromRequest(req);
  return cookieToken;
}

/**
 * Middleware that requires authentication
 */
export function withAuth(handler: AuthHandler) {
  return async (req: NextRequest) => {
    const token = extractToken(req);

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const payload = jwtService.verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      email: payload.email
    };

    return handler(req as AuthenticatedRequest);
  };
}

/**
 * Middleware that requires a BROKER-side persona (agent or owner).
 *
 * The JWT only carries { userId, email }, so the persona is fetched from the DB.
 * Buyers, renters and consultants get 403 — they must never reach broker CRM
 * (leads/deals/agent dashboard). req.user keeps the same { id, email } shape as
 * withAuth, so existing handlers need no other change.
 *
 * NOTE: this intentionally allows BOTH agent and owner (the two personas that
 * currently share the broker cabinet). Whether an owner should keep CRM at all
 * is a separate product decision, not an auth concern.
 */
export function withBroker(handler: AuthHandler) {
  return async (req: NextRequest) => {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const payload = jwtService.verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, user_type: true, is_blocked: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (dbUser.is_blocked) {
      return NextResponse.json({ error: 'Account is blocked' }, { status: 403 });
    }
    if (dbUser.user_type !== 'agent' && dbUser.user_type !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden: broker (agent/owner) access required' },
        { status: 403 }
      );
    }

    (req as AuthenticatedRequest).user = { id: payload.userId, email: payload.email };
    return handler(req as AuthenticatedRequest);
  };
}

/**
 * Middleware that optionally extracts user if token present
 */
export function withOptionalAuth(handler: AuthHandler) {
  return async (req: NextRequest) => {
    const token = extractToken(req);

    if (token) {
      const payload = jwtService.verifyAccessToken(token);
      if (payload) {
        (req as AuthenticatedRequest).user = {
          id: payload.userId,
          email: payload.email
        };
      }
    }

    return handler(req as AuthenticatedRequest);
  };
}

/**
 * Get current user from request
 */
export async function getCurrentUser(req: NextRequest) {
  const token = extractToken(req);

  if (!token) return null;

  const payload = jwtService.verifyAccessToken(token);
  if (!payload) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });
    return user;
  } catch {
    return null;
  }
}
