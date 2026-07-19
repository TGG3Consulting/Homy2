import { z } from 'zod';
import { emailSchema, textSchema, uuidSchema } from './common';

/**
 * CRM domain schemas (VULN-022): agent leads & deals + admin lead reassign.
 *
 * Enum values mirror what the routes/FE actually use:
 * - Lead stage:  new | warm | cold           (agent/leads routes, BrokerCabinet chips)
 * - Deal stage:  negotiation | offer | contract | closed | lost (STAGES in deals routes)
 * - Deal status: open | won | lost           (STATUSES in deals routes)
 *
 * Money fields (budget, value, commission) were previously unbounded
 * Number()/Math.round(Number()) — now capped at 100 billion.
 */

export const leadStageSchema = z.enum(['new', 'warm', 'cold']);
export const dealStageSchema = z.enum(['negotiation', 'offer', 'contract', 'closed', 'lost']);
export const dealStatusSchema = z.enum(['open', 'won', 'lost']);

/**
 * Bounded money amount (AMD). Route logic still applies Math.round().
 * Cap = Postgres int4 max: Lead.budget / Deal.value / Deal.commission are Int
 * in Prisma — anything larger would 500 at the DB layer instead of 422 here.
 */
export const moneySchema = z.coerce.number().min(0).max(2_147_483_647);

/** FE may send '' for an empty email input (AddLeadModal spreads raw form state). */
const emailOrEmpty = z.union([emailSchema, z.literal('')]);

/**
 * POST /api/agent/leads
 * FE (BrokerCabinet AddLeadModal) sends: clientName, clientPhone, clientEmail,
 * interest ('' when empty), budget (number|null). propertyId/stage are
 * API-supported extras, kept optional.
 */
export const createLeadSchema = z
  .object({
    clientName: textSchema(200).nullish(),
    clientEmail: emailOrEmpty.nullish(),
    clientPhone: textSchema(50).nullish(),
    propertyId: uuidSchema.nullish(),
    interest: textSchema(500).nullish(),
    budget: moneySchema.nullish(),
    stage: leadStageSchema.optional(),
  })
  .strict();

/**
 * PATCH /api/agent/leads/[id]
 * FE sends: { stage }. notes/interest/budget/touch are API-supported extras.
 */
export const updateLeadSchema = z
  .object({
    stage: leadStageSchema.optional(),
    notes: textSchema(2000).nullish(),
    interest: textSchema(500).nullish(),
    budget: moneySchema.nullish(),
    touch: z.boolean().nullish(),
  })
  .strict();

/**
 * POST /api/agent/deals
 * FE sends either { leadId, title, value } (from a lead) or
 * { title, clientName, value } (NewDealModal). Other fields are API extras.
 */
export const createDealSchema = z
  .object({
    title: textSchema(255).nullish(),
    clientName: textSchema(200).nullish(),
    propertyId: uuidSchema.nullish(),
    leadId: uuidSchema.nullish(),
    clientId: uuidSchema.nullish(),
    value: moneySchema.nullish(),
    commission: moneySchema.nullish(),
    stage: dealStageSchema.optional(),
  })
  .strict();

/**
 * PATCH /api/agent/deals/[id]
 * FE sends: { stage } | { status:'won', stage:'closed' } | { status:'lost' }.
 */
export const updateDealSchema = z
  .object({
    stage: dealStageSchema.optional(),
    status: dealStatusSchema.optional(),
    value: moneySchema.nullish(),
    commission: moneySchema.nullish(),
    title: textSchema(255).nullish(),
    notes: textSchema(2000).nullish(),
  })
  .strict();

/**
 * PATCH /api/admin/leads — reassign a lead to another agent.
 * FE (app/admin/crm) sends exactly { lead_id, action:'reassign', agent_id }.
 */
export const adminLeadReassignSchema = z
  .object({
    lead_id: uuidSchema,
    action: z.enum(['reassign']),
    agent_id: uuidSchema,
  })
  .strict();

/** DELETE /api/admin/leads — query params (?lead_id=...). Extra params are stripped. */
export const adminLeadDeleteQuerySchema = z.object({
  lead_id: uuidSchema,
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type AdminLeadReassignInput = z.infer<typeof adminLeadReassignSchema>;
