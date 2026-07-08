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
