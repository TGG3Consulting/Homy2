import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import jwtService from '@/lib/services/jwtService';
import { getRefreshToken, setAuthCookies, clearAuthCookies } from '@/lib/cookies';

export async function POST() {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    // Verify refresh token
    const payload = jwtService.verifyRefreshToken(refreshToken);
    if (!payload) {
      const response = NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
      return clearAuthCookies(response);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      const response = NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
      return clearAuthCookies(response);
    }

    // Generate new tokens
    const newAccessToken = jwtService.generateAccessToken(user.id, user.email);
    const newRefreshToken = jwtService.generateRefreshToken(user.id);

    // Set new tokens in cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.emailVerified,
      },
    });

    return setAuthCookies(response, newAccessToken, newRefreshToken);
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
