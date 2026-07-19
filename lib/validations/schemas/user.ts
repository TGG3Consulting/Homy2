import { z } from 'zod';
import { passwordSchema, strongPasswordSchema, uuidSchema } from './common';

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
 * Search preferences object for user profile.
 * .strict() + bounds: this JSON is persisted verbatim — without limits it was
 * an unbounded client-controlled blob in the users table (VULN-022).
 */
export const searchPreferencesSchema = z.object({
  preferred_districts: z.array(z.string().max(100)).max(20).default([]),
  budget_min: z.number().positive().max(100_000_000_000).nullable().optional(),
  budget_max: z.number().positive().max(100_000_000_000).nullable().optional(),
  room_count_min: z.number().int().positive().max(100).nullable().optional(),
  room_count_max: z.number().int().positive().max(100).nullable().optional(),
}).strict();

/**
 * PATCH /api/users/me - single input gate (profile fields AND password change,
 * the route accepts both shapes). Types/bounds/unknown-keys only; business
 * rules (self-assignable user_type, current-password check, skip-empty names)
 * stay in the route handler.
 */
export const updateMeSchema = z.object({
  phone: z.string().max(30).nullable().optional(),
  first_name: z.string().max(100).nullable().optional(),
  last_name: z.string().max(100).nullable().optional(),
  patronymic: z.string().max(100).nullable().optional(),
  user_type: z.string().max(30).optional(),
  language_preference: languageEnum.optional(),
  notifications_enabled: z.boolean().optional(),
  search_preferences: searchPreferencesSchema.nullable().optional(),
  current_password: z.string().min(1).max(200).optional(),
  new_password: z.string().min(1).max(200).optional(),
}).strict();

/**
 * PATCH /api/users/me - Update user profile
 * All fields are optional for partial updates
 */
export const updateUserSchema = z.object({
  phone: phoneSchema,
  user_type: userTypeEnum.optional(),
  language_preference: languageEnum.optional(),
  notifications_enabled: z.boolean().optional(),
  search_preferences: searchPreferencesSchema.optional(),
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
  // Optional at schema level: accounts without a passwordHash (OAuth) delete
  // without a password — the route enforces it when a hash exists.
  password: z.string().max(200).optional(),
  confirmation: z.literal('DELETE MY ACCOUNT', {
    errorMap: () => ({ message: 'Please type "DELETE MY ACCOUNT" to confirm' }),
  }),
}).strict();

/**
 * POST /api/users/me/favorites — add favorite
 */
export const addFavoriteSchema = z.object({
  propertyId: uuidSchema,
}).strict();

/**
 * DELETE /api/users/me/favorites — remove by propertyId or favoriteId
 */
export const removeFavoriteSchema = z.object({
  propertyId: uuidSchema.optional(),
  favoriteId: uuidSchema.optional(),
}).strict().refine(
  (d) => d.propertyId || d.favoriteId,
  { message: 'Property ID or Favorite ID is required' }
);

/**
 * Saved searches: bodies carry large JSON snapshots (chat, result set, chips).
 * Bound both element counts and serialized size — without caps this was an
 * unbounded client-controlled blob store (VULN-022).
 */
const jsonSizeCap = (maxBytes: number) => (v: unknown) =>
  JSON.stringify(v ?? null).length <= maxBytes;

const savedSearchName = z.string().max(200).nullable().optional();
const savedSearchComment = z.string().max(2000).nullable().optional();
const chatMessagesBlob = z.array(z.unknown()).max(200)
  .refine(jsonSizeCap(300_000), 'chatMessages too large');
const propertiesBlob = z.array(z.unknown()).max(100)
  .refine(jsonSizeCap(500_000), 'properties too large');
// Prisma model stores criteriaChips as string[] — enforce that shape.
const criteriaChipsBlob = z.array(z.string().max(200)).max(50);
const insightsBlob = z.unknown()
  .refine(jsonSizeCap(100_000), 'insights too large');

/** POST /api/users/me/saved-searches */
export const createSavedSearchSchema = z.object({
  name: savedSearchName,
  comment: savedSearchComment,
  query: z.string().min(1, 'Query is required').max(2000),
  chatMessages: chatMessagesBlob,
  properties: propertiesBlob,
  criteriaChips: criteriaChipsBlob,
  insights: insightsBlob.nullable().optional(),
  topChoiceId: z.string().max(100).nullable().optional(),
}).strict();

/** PUT /api/users/me/saved-searches/[id] — partial overwrite */
export const updateSavedSearchSchema = z.object({
  name: savedSearchName,
  comment: savedSearchComment,
  chatMessages: chatMessagesBlob.optional(),
  properties: propertiesBlob.optional(),
  criteriaChips: criteriaChipsBlob.optional(),
  insights: insightsBlob.nullable().optional(),
  topChoiceId: z.string().max(100).nullable().optional(),
}).strict();

/** PATCH /api/users/me/saved-searches/[id] — notification toggles */
export const patchSavedSearchSchema = z.object({
  notify: z.boolean().optional(),
  markSeen: z.boolean().optional(),
}).strict();

// Type exports
export type UserType = z.infer<typeof userTypeEnum>;
export type Language = z.infer<typeof languageEnum>;
export type SearchPreferences = z.infer<typeof searchPreferencesSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
