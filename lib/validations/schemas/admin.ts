import { z } from 'zod';
import { textSchema, uuidSchema } from './common';

/**
 * Admin domain input gates (VULN-022).
 * Types/bounds/enums/unknown-keys only — business rules (canModerateUser,
 * admin-only promotion, action logging, atomic updates) stay in the routes.
 * Enum values mirror exactly what each route's switch/if actually handles.
 */

/** Roles the admin users route accepts (see ALLOWED_ROLES / change_role). */
export const adminRoleEnum = z.enum(['user', 'moderator', 'admin']);

/** Product personas the admin users route accepts (see ALLOWED_USER_TYPES). */
export const adminUserTypeEnum = z.enum(['buyer', 'renter', 'owner', 'agent', 'consultant']);

/**
 * PATCH /api/admin/users — discriminated by `action`.
 * FE senders: app/admin/users/page.tsx (block/unblock + reason, set_user_type,
 * update_profile with first_name/last_name/phone, verify_email, force_reset)
 * and components/homy/AdminPanel.tsx (block/unblock, change_role + new_role).
 */
export const adminUpdateUserSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('block'),
    user_id: uuidSchema,
    reason: textSchema(500).optional(),
  }).strict(),
  z.object({
    action: z.literal('unblock'),
    user_id: uuidSchema,
    reason: textSchema(500).optional(), // FE sends leftover reason ('' usually)
  }).strict(),
  z.object({
    action: z.literal('change_role'),
    user_id: uuidSchema,
    new_role: adminRoleEnum,
  }).strict(),
  z.object({
    action: z.literal('set_user_type'),
    user_id: uuidSchema,
    user_type: adminUserTypeEnum,
  }).strict(),
  z.object({
    action: z.literal('update_profile'),
    user_id: uuidSchema,
    first_name: textSchema(100).optional(),
    last_name: textSchema(100).optional(),
    phone: textSchema(30).optional(),
  }).strict(),
  z.object({
    action: z.literal('verify_email'),
    user_id: uuidSchema,
  }).strict(),
  z.object({
    action: z.literal('force_reset'),
    user_id: uuidSchema,
  }).strict(),
]);

/**
 * POST /api/admin/users — admin-provisioned account (no password; reset link).
 * FE: createForm { email, first_name, last_name, phone, user_type, role }.
 */
export const adminCreateUserSchema = z.object({
  email: z.string()
    .min(1, 'Укажите email')
    .max(254, 'Email слишком длинный')
    .email('Некорректный email')
    .transform((e) => e.toLowerCase()),
  first_name: z.string().trim().max(100, 'Имя — до 100 символов').optional(),
  last_name: z.string().trim().max(100, 'Фамилия — до 100 символов').optional(),
  phone: z.string().trim().max(30, 'Телефон — до 30 символов').optional(),
  user_type: adminUserTypeEnum.default('buyer'),
  role: adminRoleEnum.default('user'),
}).strict();

/** DELETE /api/admin/users?user_id=... (query, not body). */
export const adminDeleteUserQuerySchema = z.object({
  user_id: uuidSchema,
}).strict();

/** Broadcast audiences the notifications route accepts (TARGETS list). */
export const adminBroadcastTargetEnum = z.enum(['all', 'buyer', 'renter', 'owner', 'agent', 'consultant']);

/**
 * POST /api/admin/notifications — broadcast to every user (or one persona).
 * FE: app/admin/notifications/page.tsx sends { title, body, target }.
 */
export const adminBroadcastSchema = z.object({
  // Admin UI is Russian — keep the pre-VULN-022 UX texts.
  title: z.string().trim()
    .min(1, 'Укажите заголовок')
    .max(200, 'Заголовок — до 200 символов'),
  body: z.string().trim()
    .min(1, 'Укажите текст уведомления')
    .max(2000, 'Текст — до 2000 символов'),
  target: adminBroadcastTargetEnum.default('all'),
}).strict();

/**
 * DELETE /api/admin/reviews — moderation removal.
 * FE: app/admin/reviews/page.tsx sends { review_id } only.
 */
export const adminDeleteReviewSchema = z.object({
  review_id: uuidSchema,
}).strict();

/**
 * PATCH /api/admin/support — assign/reassign/unassign a support conversation.
 * FE: app/admin/support/page.tsx sends { conversation_id, consultant_id | null }.
 */
export const adminAssignSupportSchema = z.object({
  conversation_id: uuidSchema,
  consultant_id: uuidSchema.nullable().optional(),
}).strict();

/**
 * PATCH /api/admin/viewings — moderator completes or cancels a viewing.
 * FE: app/admin/viewings/page.tsx sends { viewing_id, action }.
 */
export const adminViewingActionSchema = z.object({
  viewing_id: uuidSchema,
  action: z.enum(['complete', 'cancel']),
}).strict();

// Type exports
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminBroadcastInput = z.infer<typeof adminBroadcastSchema>;
