import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import otpService from '@/lib/services/otpService';
import emailService from '@/lib/services/emailService';
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting (IP-based, in addition to email-based OTP rate limiting)
    const clientIP = getClientIP(req);
    const rateLimitResult = checkRateLimit(`otpVerify:${clientIP}`, RATE_LIMITS.otpVerify);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ success: true });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Check rate limit
    const canSend = await otpService.checkRateLimit(normalizedEmail);
    if (!canSend) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait 10 minutes.' },
        { status: 429 }
      );
    }

    // Generate and send new OTP
    const otpCode = await otpService.createOtpRecord(normalizedEmail, 'registration');
    await emailService.sendOtpEmail(normalizedEmail, otpCode);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
