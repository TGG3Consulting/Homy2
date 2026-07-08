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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }
      // SECURITY FIX: Don't update password for unverified users
      // This prevents account hijacking where attacker could register
      // with someone else's email and set their own password
      // Instead, just resend OTP to the original email
      const canSend = await otpService.checkRateLimit(email);
      if (!canSend) {
        return NextResponse.json(
          { error: 'Too many attempts. Please wait before trying again.' },
          { status: 429 }
        );
      }

      const otpCode = await otpService.createOtpRecord(email, 'registration');
      await emailService.sendOtpEmail(email, otpCode);

      return NextResponse.json({
        success: true,
        message: 'Verification code sent to your email',
        code: 'PENDING_VERIFICATION'
      });
    } else {
      // Create new user
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
    }

    // Check rate limit
    const canSend = await otpService.checkRateLimit(email);
    if (!canSend) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait before trying again.' },
        { status: 429 }
      );
    }

    // Generate and send OTP
    const otpCode = await otpService.createOtpRecord(email, 'registration');
    await emailService.sendOtpEmail(email, otpCode);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
