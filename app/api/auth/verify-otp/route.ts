import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import otpService from '@/lib/services/otpService';
import jwtService from '@/lib/services/jwtService';
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rateLimiter';
import { setAuthCookies } from '@/lib/cookies';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimitResult = checkRateLimit(`otpVerify:${clientIP}`, RATE_LIMITS.otpVerify);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const { email, otpCode } = await req.json();

    // Validate input
    if (!email || !otpCode) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    if (otpCode.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid verification code format' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Verify OTP
    const verification = await otpService.verifyOtp(normalizedEmail, otpCode);
    if (!verification.valid) {
      const status = verification.error === 'Code expired' ? 410 : 400;
      return NextResponse.json(
        { error: verification.error },
        { status }
      );
    }

    // Find and update user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // Generate tokens
    const accessToken = jwtService.generateAccessToken(user.id, user.email);
    const refreshToken = jwtService.generateRefreshToken(user.id);

    // Set tokens in HttpOnly cookies (secure against XSS)
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        email_verified: true,
      },
    });

    return setAuthCookies(response, accessToken, refreshToken);
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
