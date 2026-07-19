import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import otpService from '@/lib/services/otpService';
import jwtService from '@/lib/services/jwtService';
import {
  checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse,
  isAccountLocked, recordLoginFailure, clearLoginFailures, accountLockResponse,
} from '@/lib/rateLimiter';
import { setAuthCookies } from '@/lib/cookies';
import { verifyOtpSchema } from '@/lib/validations/schemas/auth';
import { validateBody } from '@/lib/validations/validate';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimitResult = checkRateLimit(`otpVerify:${clientIP}`, RATE_LIMITS.otpVerify);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Schema validation (VULN-022): email shape + strictly 6-digit numeric code.
    const validation = validateBody(verifyOtpSchema, await req.json());
    if (!validation.success) return validation.error;
    const { email: normalizedEmail, otpCode } = validation.data; // lowercased by schema

    // Per-account brute-force lockout (VULN-002): the per-IP limiter above is
    // bypassable with rotating IPs; this caps failed code guesses per email
    // (5 / 15 min, same policy as login) regardless of source IP.
    const lockKey = `otp:${normalizedEmail}`;
    const lock = isAccountLocked(lockKey);
    if (lock.locked) {
      return accountLockResponse(lock);
    }

    // Verify OTP
    const verification = await otpService.verifyOtp(normalizedEmail, otpCode);
    if (!verification.valid) {
      // Only count failures when a pending OTP actually exists for this email,
      // so attacker-supplied random emails can't fill the lockout store.
      if (verification.hadPendingOtp) {
        recordLoginFailure(lockKey);
      }
      const status = verification.error === 'Code expired' ? 410 : 400;
      return NextResponse.json(
        { error: verification.error },
        { status }
      );
    }

    // Correct code — reset the failure counter for this email.
    clearLoginFailures(lockKey);

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

    // Generate tokens carrying the user's current token_version (revocable) —
    // defaulting to 0 here broke OTP login for users whose version was bumped
    // by a password change / force-reset.
    const accessToken = jwtService.generateAccessToken(user.id, user.email, user.token_version);
    const refreshToken = jwtService.generateRefreshToken(user.id, user.token_version);

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
