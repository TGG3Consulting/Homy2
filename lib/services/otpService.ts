import crypto from 'crypto';
import prisma from '../db/prisma';

const OTP_EXPIRY_MINUTES = 10;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MINUTES = 10;

export const otpService = {
  /**
   * Generate random 6-digit OTP code
   */
  generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  },

  /**
   * Create OTP record in database
   */
  async createOtpRecord(email: string, type: 'registration' | 'login' = 'registration'): Promise<string> {
    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate previous OTPs for this email
    await this.invalidateOtps(email);

    await prisma.otpCode.create({
      data: {
        email,
        code,
        type,
        expiresAt,
        used: false,
      },
    });

    return code;
  },

  /**
   * Verify OTP code.
   *
   * Fetches the NEWEST live OTP for the email and compares the code in-app
   * (constant-time), rather than matching on (email, code). This bounds
   * guessing to the single active code and lets the caller distinguish
   * "no pending verification" (hadPendingOtp:false) from "wrong code"
   * (hadPendingOtp:true) — so the account-lockout in the route only counts
   * failures against emails that actually have a pending OTP, never against
   * attacker-supplied random emails (avoids lock-store DoS). VULN-002.
   */
  async verifyOtp(
    email: string,
    code: string
  ): Promise<{ valid: boolean; error?: string; hadPendingOtp: boolean }> {
    const otpRecord = await prisma.otpCode.findFirst({
      where: { email, used: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return { valid: false, error: 'Invalid verification code', hadPendingOtp: false };
    }

    if (otpRecord.expiresAt < new Date()) {
      return { valid: false, error: 'Code expired', hadPendingOtp: true };
    }

    // Constant-time compare (both are 6-digit numeric strings of equal length).
    const a = Buffer.from(otpRecord.code);
    const b = Buffer.from(code);
    const matches = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!matches) {
      return { valid: false, error: 'Invalid verification code', hadPendingOtp: true };
    }

    // Mark as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    return { valid: true, hadPendingOtp: true };
  },

  /**
   * Invalidate all OTPs for email
   */
  async invalidateOtps(email: string): Promise<void> {
    await prisma.otpCode.updateMany({
      where: { email, used: false },
      data: { used: true },
    });
  },

  /**
   * Check rate limit for OTP requests
   */
  async checkRateLimit(email: string): Promise<boolean> {
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

    const recentCount = await prisma.otpCode.count({
      where: {
        email,
        createdAt: { gte: windowStart },
      },
    });

    return recentCount < RATE_LIMIT_MAX;
  },
};

export default otpService;
