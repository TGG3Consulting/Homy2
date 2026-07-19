import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db/prisma';
import emailService from '@/lib/services/emailService';
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rateLimiter';
import { resetPasswordRequestSchema } from '@/lib/validations/schemas/auth';
import { validateBody } from '@/lib/validations/validate';

const TOKEN_EXPIRY_HOURS = 1;

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimitResult = checkRateLimit(`passwordReset:${clientIP}`, RATE_LIMITS.passwordReset);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Schema validation (VULN-022)
    const validation = validateBody(resetPasswordRequestSchema, await req.json());
    if (!validation.success) return validation.error;
    const { email: normalizedEmail } = validation.data; // lowercased by schema

    // Find user (but always return success for security)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      // Generate secure token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      // Invalidate old tokens
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      });

      // Create new token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt,
          used: false,
        },
      });

      // Send email
      await emailService.sendPasswordResetEmail(normalizedEmail, resetToken);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If the email exists, a reset link has been sent',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
