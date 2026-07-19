import { z } from 'zod';

/**
 * Virtual tour authoring (VULN-022).
 * Panorama URLs come from /api/upload as relative paths (/uploads/...) or
 * absolute http(s) — same rule as listing photos.
 */
const panoramaPathSchema = z.string().trim().min(1, 'URL панорамы обязателен').max(2048).refine(
  (s) => s.startsWith('/') || s.startsWith('http://') || s.startsWith('https://'),
  'Invalid panorama path'
);

const roomNameSchema = z.string().trim().max(120);

/** Hotspot: link to another room at (x, y) in 0..1 (route clamps regardless). */
export const hotspotSchema = z.object({
  target_room_id: z.string().min(1).max(100),
  x: z.coerce.number(),
  y: z.coerce.number(),
}).strict();

/** POST /api/properties/[id]/virtual-tour — create a room */
export const createTourRoomSchema = z.object({
  name: roomNameSchema.optional(),
  name_ru: roomNameSchema.optional(),
  name_en: roomNameSchema.optional(),
  name_hy: roomNameSchema.optional(),
  panorama_url: panoramaPathSchema,
  hotspots: z.array(hotspotSchema).max(50).optional(),
}).strict().refine(
  (b) => Boolean((b.name_ru || b.name || '').trim()),
  { message: 'Название комнаты обязательно', path: ['name_ru'] }
);

/** PATCH /api/properties/[id]/virtual-tour/[roomId] — partial room update */
export const updateTourRoomSchema = z.object({
  name_ru: roomNameSchema.optional(),
  name_en: roomNameSchema.optional(),
  name_hy: roomNameSchema.optional(),
  panorama_url: panoramaPathSchema.optional(),
  order_index: z.coerce.number().int().min(0).max(500).optional(),
  hotspots: z.array(hotspotSchema).max(50).optional(),
}).strict();

export type CreateTourRoomInput = z.infer<typeof createTourRoomSchema>;
export type UpdateTourRoomInput = z.infer<typeof updateTourRoomSchema>;
