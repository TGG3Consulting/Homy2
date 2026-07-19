import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/db/prisma';
import jwtService from '@/lib/services/jwtService';
import {
  checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse,
  isAccountLocked, recordLoginFailure, clearLoginFailures, accountLockResponse,
} from '@/lib/rateLimiter';
import { setAuthCookies } from '@/lib/cookies';
import { loginSchema } from '@/lib/validations/schemas/auth';
import { validateBody } from '@/lib/validations/validate';

// Fixed dummy bcrypt hash (cost 12) for constant-time compare when the account
// does not exist (VULN-009). Value is a hash of a random throwaway string; it
// never matches any real password.
const DUMMY_BCRYPT_HASH = '$2b$12$QpHCtLS7Xf..6zYc3wh2bugQmszXF57uC.KfkyuIC.SHrfEVD5wtq';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimitResult = checkRateLimit(`login:${clientIP}`, RATE_LIMITS.login);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Schema validation (VULN-022): types, bounds, unknown keys rejected.
    const validation = validateBody(loginSchema, await req.json());
    if (!validation.success) return validation.error;
    const { email, password } = validation.data; // email already lowercased by schema

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      // Constant-time defence against email enumeration (VULN-009): a missing
      // account would otherwise return instantly while a real one pays ~100ms of
      // bcrypt, letting an attacker distinguish registered emails by timing.
      // Burn an equivalent bcrypt comparison against a fixed dummy hash.
      await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Account lockout (VULN-033): 5 failed attempts / 15 min locks the ACCOUNT,
    // regardless of source IP — defeats distributed credential stuffing that the
    // per-IP limiter above cannot see. Checked before bcrypt so a locked account
    // costs the attacker nothing to probe and we don't burn CPU on hashes.
    const lock = isAccountLocked(user.id);
    if (lock.locked) {
      return accountLockResponse(lock);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      recordLoginFailure(user.id);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Correct password — reset the account's failure counter.
    clearLoginFailures(user.id);

    // Check email verification
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email first', code: 'EMAIL_NOT_VERIFIED' },
        { status: 403 }
      );
    }

    // Blocked users cannot obtain tokens.
    if (user.is_blocked) {
      return NextResponse.json(
        { error: 'Account is blocked', code: 'ACCOUNT_BLOCKED' },
        { status: 403 }
      );
    }

    // Generate tokens carrying the user's current token_version (revocable).
    const accessToken = jwtService.generateAccessToken(user.id, user.email, user.token_version);
    const refreshToken = jwtService.generateRefreshToken(user.id, user.token_version);

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
