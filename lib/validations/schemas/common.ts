import { z } from 'zod';

/**
 * Reusable email schema with normalization
 * - Validates email format
 * - Enforces length constraints
 * - Transforms to lowercase for consistency
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(254, 'Email too long')
  .transform(email => email.toLowerCase());

/**
 * Standard password schema
 * - Minimum 8 characters
 * - Maximum 100 characters
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long');

/**
 * Strong password schema with complexity requirements
 * - Minimum 8 characters
 * - Must contain uppercase letter
 * - Must contain a number
 * - Must contain special character
 */
export const strongPasswordSchema = passwordSchema
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain special character');

/**
 * UUID validation schema
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid ID format');

/**
 * CUID validation schema (PropertyListing ids use @default(cuid()))
 */
export const cuidSchema = z
  .string()
  .regex(/^c[a-z0-9]{20,32}$/, 'Invalid ID format');

/**
 * Entity ID: UUID (most models) or CUID (PropertyListing).
 * Use where a route may legitimately receive either.
 */
export const idSchema = z.union([uuidSchema, cuidSchema]);

/**
 * Bounded free-text helper: trims and caps length.
 * Use for every client-supplied string that gets stored or displayed.
 */
export const textSchema = (max: number, min = 0) =>
  z.string().trim().min(min).max(max, `Must be at most ${max} characters`);

/**
 * Pagination schema with defaults
 * - Page: positive integer, default 1
 * - Limit: 1-100, default 20
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * ISO 8601 datetime string validation
 */
export const dateTimeSchema = z
  .string()
  .datetime({ message: 'Invalid datetime format. Use ISO 8601.' });

/**
 * Future datetime validation (for scheduling)
 */
export const futureDateTimeSchema = dateTimeSchema
  .refine(
    (dt) => new Date(dt) > new Date(),
    'Date must be in the future'
  );

// Type exports
export type PaginationInput = z.infer<typeof paginationSchema>;
