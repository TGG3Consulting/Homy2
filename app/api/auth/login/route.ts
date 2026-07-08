import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/db/prisma';
import jwtService from '@/lib/services/jwtService';
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rateLimiter';
import { setAuthCookies } from '@/lib/cookies';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimitResult = checkRateLimit(`login:${clientIP}`, RATE_LIMITS.login);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check email verification
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email first', code: 'EMAIL_NOT_VERIFIED' },
        { status: 403 }
      );
    }

    // Generate tokens
    const accessToken = jwtService.generateAccessToken(user.id, user.email);
    const refreshToken = jwtService.generateRefreshToken(user.id);

    // Set tokens in HttpOnly cookies (secure against XSS)
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.emailVerified,
      },
    });

    return setAuthCookies(response, accessToken, refreshToken);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
