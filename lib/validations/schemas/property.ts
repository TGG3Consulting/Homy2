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
 * POST /api/properties/list - Create property listing
 * Full property creation schema with all required fields
 */
export const createPropertyListingSchema = z.object({
  property_type: propertyTypeEnum,
  location: z
    .string()
    .min(1, 'Location is required')
    .max(500, 'Location too long'),
  price: z
    .number()
    .positive('Price must be positive')
    .max(1000000000, 'Price exceeds maximum'),
  currency: currencyEnum.default('USD'),
  area: z
    .number()
    .positive('Area must be positive')
    .max(100000, 'Area exceeds maximum'),
  rooms: z
    .number()
    .int('Rooms must be a whole number')
    .min(1, 'At least 1 room required')
    .max(100, 'Rooms exceeds maximum'),
  contact: z
    .string()
    .min(1, 'Contact is required')
    .max(200, 'Contact info too long'),
  description: z
    .string()
    .max(5000, 'Description too long')
    .optional(),
  photos: z
    .array(z.string().url('Invalid photo URL'))
    .max(20, 'Maximum 20 photos allowed')
    .optional(),
});

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
