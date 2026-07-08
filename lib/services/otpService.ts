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
   * Verify OTP code
   */
  async verifyOtp(email: string, code: string): Promise<{ valid: boolean; error?: string }> {
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email,
        code,
        used: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      return { valid: false, error: 'Invalid verification code' };
    }

    if (otpRecord.expiresAt < new Date()) {
      return { valid: false, error: 'Code expired' };
    }

    // Mark as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    return { valid: true };
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
