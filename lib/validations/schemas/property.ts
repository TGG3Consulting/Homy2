import { z } from 'zod';
import { uuidSchema, paginationSchema } from './common';

/**
 * Property types enum
 */
export const propertyTypeEnum = z.enum([
  'apartment',
  'house',
  'studio',
  'villa',
  'penthouse',
  'commercial',
]);

/**
 * Currency enum
 */
export const currencyEnum = z.enum(['USD', 'AMD', 'EUR', 'RUB']);

/**
 * Deal type enum (matches BrokerCabinet select options)
 */
export const dealTypeEnum = z.enum(['long_term_rental', 'sale']);

/** Form fields arrive as '' when empty — normalize to null before parsing. */
const emptyToNull = <T extends z.ZodTypeAny>(schema: T): z.ZodType<z.infer<T> | null> =>
  z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    schema.nullable()
  ) as unknown as z.ZodType<z.infer<T> | null>;

/**
 * Photo paths come from /api/upload as RELATIVE paths (/uploads/...) —
 * z.string().url() would reject them. Allow relative or absolute http(s).
 */
const photoPathSchema = z.string().max(2048).refine(
  (s) => s.startsWith('/') || s.startsWith('http://') || s.startsWith('https://'),
  'Invalid photo path'
);

/**
 * POST /api/properties/list — owner/agent submits a listing for moderation.
 * Matches the real BrokerCabinet contract (VULN-022): coerced numbers with
 * the same bounds the route enforced manually (VULN-002), enum deal/property
 * types, capped text, rental fields.
 */
export const createPropertyListingSchema = z.object({
  property_type: propertyTypeEnum,
  deal_type: dealTypeEnum.nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  price: z.coerce.number().positive('Price must be positive').max(100_000_000_000),
  currency: currencyEnum.default('AMD'),
  area: z.coerce.number().positive('Area must be positive').max(100_000),
  rooms: z.coerce.number().int().min(0).max(100),
  floor: emptyToNull(z.coerce.number().int().min(-5).max(300)).optional(),
  contact: z.string().max(200).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  photos: z.array(photoPathSchema).max(30).nullable().optional(),
  title: z.string().max(200).nullable().optional(),
  province: z.string().max(100).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  district: z.string().max(100).nullable().optional(),
  neighborhood: z.string().max(100).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  deposit_months: emptyToNull(z.coerce.number().int().min(0).max(24)).optional(),
  utilities_estimate: emptyToNull(z.coerce.number().min(0).max(10_000_000)).optional(),
  minimum_lease_months: emptyToNull(z.coerce.number().int().min(0).max(120)).optional(),
}).strict();

/**
 * PATCH /api/properties/[id] — owner/admin edit of a LIVE catalogue object.
 * Same field whitelist the route maintained manually, now with bounds/enums
 * (VULN-022). title/neighborhood may arrive as localized objects — the route
 * JSON.stringify's them.
 */
const localizedOrString = z.union([
  z.string().max(500),
  z.record(z.string().max(500)),
]);

export const updatePropertySchema = z.object({
  title: localizedOrString.nullable().optional(),
  neighborhood: localizedOrString.nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  province: z.string().max(100).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  district: z.string().max(100).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  imageUrl: z.string().max(2048).nullable().optional(),
  dealType: dealTypeEnum.nullable().optional(),
  propertyType: propertyTypeEnum.nullable().optional(),
  price: z.coerce.number().positive().max(100_000_000_000).nullable().optional(),
  rooms: z.coerce.number().int().min(0).max(100).nullable().optional(),
  bedrooms: z.coerce.number().int().min(0).max(100).nullable().optional(),
  area: z.coerce.number().positive().max(100_000).nullable().optional(),
  sizeSqm: z.coerce.number().positive().max(100_000).nullable().optional(),
  floor: z.coerce.number().int().min(-5).max(300).nullable().optional(),
  totalFloors: z.coerce.number().int().min(1).max(300).nullable().optional(),
  images: z.array(photoPathSchema).max(30).optional(),
  available: z.boolean().optional(),
  virtual_tour_enabled: z.boolean().optional(),
  depositMonths: emptyToNull(z.coerce.number().int().min(0).max(24)).optional(),
  utilitiesEstimate: emptyToNull(z.coerce.number().min(0).max(10_000_000)).optional(),
  minimumLeaseMonths: emptyToNull(z.coerce.number().int().min(0).max(120)).optional(),
}).strict();

export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

/**
 * PATCH /api/properties/listings/[id] — owner/moderator edits a PENDING
 * submission before approval. Same rules as create (VULN-022); rooms may be 0
 * (studio), matching the create route and the approve re-validation.
 */
export const updateListingSchema = z.object({
  property_type: z.enum(['apartment', 'house', 'studio']).optional(),
  location: z.string().trim().min(1, 'Location is required').max(500).optional(),
  province: z.string().max(100).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  district: z.string().max(100).nullable().optional(),
  price: z.number().positive('Price must be positive').max(100_000_000_000).optional(),
  currency: currencyEnum.optional(),
  area: z.number().positive('Area must be positive').max(100_000).optional(),
  rooms: z.number().int().min(0).max(100).optional(),
  description: z.string().max(5000).nullable().optional(),
  photos: z.array(photoPathSchema).max(30).optional(),
  contact: z.string().trim().min(1, 'Contact is required').max(200).optional(),
  deposit_months: emptyToNull(z.coerce.number().int().min(0).max(24)).optional(),
  utilities_estimate: emptyToNull(z.coerce.number().min(0).max(10_000_000)).optional(),
  minimum_lease_months: emptyToNull(z.coerce.number().int().min(0).max(120)).optional(),
}).strict();

export type UpdateListingInput = z.infer<typeof updateListingSchema>;

/**
 * GET /api/properties - Search/filter properties
 * Extends pagination with property-specific filters
 */
export const searchPropertiesSchema = paginationSchema.extend({
  property_type: propertyTypeEnum.optional(),
  price_min: z.coerce.number().positive().optional(),
  price_max: z.coerce.number().positive().optional(),
  rooms_min: z.coerce.number().int().positive().optional(),
  rooms_max: z.coerce.number().int().positive().optional(),
  district: z.string().max(100).optional(),
  sort_by: z.enum(['price', 'area', 'created_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Property ID param validation
 */
export const propertyIdSchema = z.object({
  id: uuidSchema,
});

// Type exports
export type PropertyType = z.infer<typeof propertyTypeEnum>;
export type Currency = z.infer<typeof currencyEnum>;
export type CreatePropertyListingInput = z.infer<typeof createPropertyListingSchema>;
export type SearchPropertiesInput = z.infer<typeof searchPropertiesSchema>;
export type PropertyIdInput = z.infer<typeof propertyIdSchema>;
