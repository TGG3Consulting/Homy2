import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import jwtService from '@/lib/services/jwtService';
import { getAccessToken } from '@/lib/cookies';

export async function GET() {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify access token
    const payload = jwtService.verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        phone: true,
        user_type: true,
        language_preference: true,
        notifications_enabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.emailVerified,
        phone: user.phone,
        user_type: user.user_type,
        language_preference: user.language_preference,
        notifications_enabled: user.notifications_enabled,
        created_at: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
