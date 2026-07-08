import { z } from 'zod';
import { passwordSchema, strongPasswordSchema } from './common';

/**
 * User type enum
 */
export const userTypeEnum = z.enum(['buyer', 'renter', 'owner', 'agent', 'consultant']);

/**
 * Language preference enum
 */
export const languageEnum = z.enum(['en', 'ru', 'hy']);

/**
 * Phone validation schema
 * Supports Armenian and international formats
 */
export const phoneSchema = z
  .string()
  .regex(
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,
    'Invalid phone number format'
  )
  .or(z.literal(''))
  .optional();

/**
 * Search preferences object for user profile
 */
export const searchPreferencesSchema = z.object({
  preferred_districts: z.array(z.string()).max(20).default([]),
  budget_min: z.number().positive().nullable().optional(),
  budget_max: z.number().positive().nullable().optional(),
  room_count_min: z.number().int().positive().nullable().optional(),
  room_count_max: z.number().int().positive().nullable().optional(),
}).optional();

/**
 * PATCH /api/users/me - Update user profile
 * All fields are optional for partial updates
 */
export const updateUserSchema = z.object({
  phone: phoneSchema,
  user_type: userTypeEnum.optional(),
  language_preference: languageEnum.optional(),
  notifications_enabled: z.boolean().optional(),
  search_preferences: searchPreferencesSchema,
}).partial();

/**
 * Change password schema
 * Validates current password and enforces strong password for new password
 */
export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password required'),
  new_password: strongPasswordSchema,
}).refine(
  data => data.current_password !== data.new_password,
  { message: 'New password must be different', path: ['new_password'] }
);

/**
 * DELETE /api/users/me - Account deletion confirmation
 * Requires password and explicit confirmation text
 */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password required'),
  confirmation: z.literal('DELETE MY ACCOUNT', {
    errorMap: () => ({ message: 'Please type "DELETE MY ACCOUNT" to confirm' }),
  }),
});

// Type exports
export type UserType = z.infer<typeof userTypeEnum>;
export type Language = z.infer<typeof languageEnum>;
export type SearchPreferences = z.infer<typeof searchPreferencesSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
