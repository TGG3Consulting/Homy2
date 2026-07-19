import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/db/prisma';
import { resetPasswordSchema } from '@/lib/validations/schemas/auth';
import { validateBody } from '@/lib/validations/validate';
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rateLimiter';

const SALT_ROUNDS = 12;

export async function POST(req: NextRequest) {
  try {
    // Rate limit the token-consumption endpoint too (VULN-013), matching the
    // request endpoint. The token is 256-bit/one-time so brute-force is already
    // infeasible; this is defence-in-depth + abuse throttling.
    const rl = checkRateLimit(`passwordReset:${getClientIP(req)}`, RATE_LIMITS.passwordReset);
    if (!rl.success) return rateLimitResponse(rl);

    // Schema validation (VULN-022): token must be exactly 64 hex chars,
    // password length-bounded — junk never reaches the DB lookup.
    const validation = validateBody(resetPasswordSchema, await req.json());
    if (!validation.success) return validation.error;
    const { resetToken, newPassword } = validation.data;

    // Find token
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        token: resetToken,
        used: false,
      },
      include: { user: true },
    });

    if (!tokenRecord || !tokenRecord.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      );
    }

    // Check expiration
    if (tokenRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Reset link has expired' },
        { status: 410 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.userId },
        // Changing the password revokes every previously issued session.
        data: { passwordHash, token_version: { increment: 1 } },
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
