import { z } from 'zod';
import { uuidSchema, emailSchema, textSchema } from './common';

/**
 * Chat / support domain schemas (VULN-022).
 *
 * Conversation / Property / User ids are Postgres UUIDs (see prisma/schema.prisma),
 * so uuidSchema is used rather than the wider idSchema union.
 */

/**
 * POST /api/chats — start a conversation.
 * FE (components/Chat/ChatWidget.tsx) sends { type } or { type, property_id }.
 * `subject` is accepted by the route (falls back to a default) but is not
 * currently sent by any FE caller — kept optional so the API contract holds.
 * The "property_id required when type=property" rule stays in the route
 * (conditional business check, not input shape).
 */
export const createConversationSchema = z
  .object({
    type: z.enum(['property', 'support']),
    property_id: uuidSchema.optional(),
    subject: textSchema(300).optional(),
  })
  .strict();

/**
 * PATCH /api/chats/[id] — update conversation status.
 * Whitelist matches the route's previous manual validStatuses check.
 * (No FE caller today; consultant-only resolve/close stays in the route.)
 */
export const updateConversationSchema = z
  .object({
    status: z.enum(['open', 'assigned', 'resolved', 'closed']),
  })
  .strict();

/**
 * POST /api/chats/[id]/messages — send a message (REST fallback).
 * FE (ChatWidget/ChatPanel/BrokerCabinet) sends only { content }.
 * Formalizes the previous manual gate: non-empty after trim, cap 5000.
 */
export const sendChatMessageSchema = z
  .object({
    content: textSchema(5000, 1),
  })
  .strict();

/**
 * POST /api/support/status — consultant online toggle.
 * FE (components/dashboard/SupportInbox.tsx) sends { is_online: boolean }.
 */
export const supportStatusSchema = z
  .object({
    is_online: z.boolean(),
  })
  .strict();

// ============================================
// Misc: reviews + waitlist (same VULN-022 batch)
// ============================================

/**
 * Shared rating: integer 1..5 (was parseInt + range check in routes).
 */
const ratingSchema = z.number().int().min(1).max(5);

/**
 * POST /api/agents/[id]/reviews — leave a review about a broker.
 * FE (components/homy/PropertyDetailView.tsx) sends { rating, comment? }
 * (comment omitted when empty). Business checks (broker-only target,
 * real viewing interaction, one review per author) stay in the route.
 */
export const createAgentReviewSchema = z
  .object({
    rating: ratingSchema,
    comment: textSchema(2000).nullish(),
  })
  .strict();

/**
 * PATCH /api/reviews/[id] — update own review.
 * FE (components/ReviewSection.tsx) sends { rating, comment? } (comment
 * omitted when empty). Both fields optional: absent field keeps the old value,
 * empty/null comment clears it (route maps '' → null).
 */
export const updateReviewSchema = z
  .object({
    rating: ratingSchema.optional(),
    comment: textSchema(2000).nullish(),
  })
  .strict();

/**
 * POST /api/waitlist — coming-soon signup.
 * FE (app/coming-soon/page.tsx) sends { email } (pre-trimmed).
 * emailSchema also lowercases, matching the route's previous normalization.
 */
export const waitlistSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

// Type exports
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
export type SupportStatusInput = z.infer<typeof supportStatusSchema>;
export type CreateAgentReviewInput = z.infer<typeof createAgentReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type WaitlistInput = z.infer<typeof waitlistSchema>;
