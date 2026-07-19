import { z } from 'zod';
import {
  uuidSchema,
  emailSchema,
  textSchema,
  futureDateTimeSchema,
} from './common';

/**
 * Viewing domain schemas (VULN-022).
 *
 * Viewing / Property / User ids are all Postgres UUIDs (see prisma/schema.prisma),
 * so uuidSchema is used rather than the wider idSchema union.
 */

/**
 * POST /api/viewings — create a viewing request.
 * - Client flow: { propertyId, scheduledAt, message? }
 * - Owner/agent flow additionally sends client identification:
 *   clientEmail and/or clientId (ViewingCreateForm was aligned to send
 *   `clientId`; the legacy `clientUserId` alias is gone).
 * - `message` may be an explicit null (FE sends `message: message || null`).
 * - The route already required a future date, so futureDateTimeSchema is correct.
 */
export const createViewingSchema = z
  .object({
    propertyId: uuidSchema,
    scheduledAt: futureDateTimeSchema,
    message: textSchema(2000).nullish(),
    clientEmail: emailSchema.optional(),
    clientId: uuidSchema.optional(),
  })
  .strict();

/**
 * PATCH/POST /api/viewings/[id]/propose — counter-propose a new time.
 * FE (components/homy/ViewingsTab.tsx) sends { scheduledAt, comment }.
 * The route already required a future date.
 */
export const proposeViewingSchema = z
  .object({
    scheduledAt: futureDateTimeSchema,
    comment: textSchema(2000).nullish(),
  })
  .strict();

/**
 * PATCH/POST /api/viewings/[id]/cancel — cancel a viewing.
 * Body is optional (FE sends no body at all); when present, only `reason`.
 */
export const cancelViewingSchema = z
  .object({
    reason: textSchema(500).nullish(),
  })
  .strict();

// Type exports
export type CreateViewingInput = z.infer<typeof createViewingSchema>;
export type ProposeViewingInput = z.infer<typeof proposeViewingSchema>;
export type CancelViewingInput = z.infer<typeof cancelViewingSchema>;
