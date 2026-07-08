import { z } from 'zod';
import { emailSchema, passwordSchema } from './common';

/**
 * POST /api/auth/register
 * Registration schema with email and password validation
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  patronymic: z.string().max(100).optional(),
});

/**
 * POST /api/auth/login
 * Login schema - password only requires presence (validation happens on auth)
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/verify-otp
 * OTP verification schema
 */
export const verifyOtpSchema = z.object({
  email: emailSchema,
  otpCode: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only digits'),
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP schema
 */
export const resendOtpSchema = z.object({
  email: emailSchema,
});

/**
 * POST /api/auth/reset-password-request
 * Password reset request schema
 */
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

/**
 * POST /api/auth/reset-password
 * Password reset schema with token and new password
 */
export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});

// Type exports for use in handlers
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
