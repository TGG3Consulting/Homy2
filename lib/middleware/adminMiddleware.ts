import { NextRequest, NextResponse } from 'next/server';
import { jwtService } from '../services/jwtService';
import prisma from '../db/prisma';

// Roles hierarchy
export type UserRole = 'user' | 'moderator' | 'admin';

export interface AdminAuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export type AdminHandler = (
  req: AdminAuthenticatedRequest
) => Promise<NextResponse>;

/**
 * Get user with role from database
 */
async function getUserWithRole(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      is_blocked: true,
    }
  });
}

/**
 * Middleware that requires admin role
 */
export function withAdmin(handler: AdminHandler) {
  return async (req: NextRequest) => {
    const authHeader = req.headers.get('authorization');
    const token = jwtService.extractTokenFromHeader(authHeader);

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

    // Fetch user with role
    const user = await getUserWithRole(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is blocked
    if (user.is_blocked) {
      return NextResponse.json(
        { error: 'Account is blocked' },
        { status: 403 }
      );
    }

    // Check admin role
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Attach user to request
    (req as AdminAuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
    };

    return handler(req as AdminAuthenticatedRequest);
  };
}

/**
 * Middleware that requires moderator or admin role
 */
export function withModerator(handler: AdminHandler) {
  return async (req: NextRequest) => {
    const authHeader = req.headers.get('authorization');
    const token = jwtService.extractTokenFromHeader(authHeader);

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

    const user = await getUserWithRole(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.is_blocked) {
      return NextResponse.json(
        { error: 'Account is blocked' },
        { status: 403 }
      );
    }

    // Check moderator or admin role
    if (!['moderator', 'admin'].includes(user.role || 'user')) {
      return NextResponse.json(
        { error: 'Forbidden: Moderator access required' },
        { status: 403 }
      );
    }

    (req as AdminAuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
    };

    return handler(req as AdminAuthenticatedRequest);
  };
}

/**
 * Helper to check if user can perform action on another user
 * Admins can moderate everyone except other admins
 * Moderators can only moderate regular users
 */
export function canModerateUser(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === 'admin') {
    return targetRole !== 'admin'; // Admins can't moderate other admins
  }
  if (actorRole === 'moderator') {
    return targetRole === 'user'; // Moderators can only moderate regular users
  }
  return false;
}
