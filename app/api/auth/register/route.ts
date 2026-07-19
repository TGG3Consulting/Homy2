import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/db/prisma';
import otpService from '@/lib/services/otpService';
import emailService from '@/lib/services/emailService';
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rateLimiter';
import { validateBody, registerSchema, type RegisterInput } from '@/lib/validations';

const SALT_ROUNDS = 12;

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimitResult = checkRateLimit(`register:${clientIP}`, RATE_LIMITS.register);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await req.json();

    // Validate request body using Zod schema
    const validation = validateBody(registerSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    // TypeScript knows: validation.data is RegisterInput
    // Email is already normalized to lowercase by the schema
    const { email, password, first_name, last_name, patronymic }: RegisterInput = validation.data;

    // Anti-enumeration (VULN-006): every branch below returns the SAME generic
    // 200 body, so a caller cannot tell "new", "already registered", or
    // "pending verification" apart from the response. The distinction is driven
    // only by which email the real owner receives.
    const GENERIC_OK = NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
    });

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.emailVerified) {
        // Do NOT reveal the account exists. Email the owner a "log in instead"
        // note (fire-and-forget) and return the identical generic response.
        emailService.sendAccountExistsEmail(email).catch(() => {});
        return GENERIC_OK;
      }
      // Unverified existing account: never overwrite the password (prevents
      // hijack by re-registering someone else's pending email). Resend OTP.
      if (await otpService.checkRateLimit(email)) {
        const otpCode = await otpService.createOtpRecord(email, 'registration');
        await emailService.sendOtpEmail(email, otpCode);
      }
      return GENERIC_OK;
    }

    // Brand-new account.
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        emailVerified: false,
        first_name,
        last_name,
        patronymic,
      },
    });

    if (await otpService.checkRateLimit(email)) {
      const otpCode = await otpService.createOtpRecord(email, 'registration');
      await emailService.sendOtpEmail(email, otpCode);
    }

    return GENERIC_OK;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
