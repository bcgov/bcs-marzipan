import { z } from 'zod';

/**
 * Zod schemas for draft API (calendar-service local).
 * Used for validation and OpenAPI via createZodDto.
 */

/**
 * POST /drafts/save - Request body.
 */
export const saveDraftBodySchema = z.object({
  formType: z.string().min(1),
  entityId: z.number().int().optional(),
  draftData: z.record(z.string(), z.unknown()),
});

export type SaveDraftBody = z.infer<typeof saveDraftBodySchema>;

const optionalDraftEntityIdSchema = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.coerce.number().int().optional()
);

/** GET /drafts and DELETE /drafts/by-form query params. */
export const draftLookupQuerySchema = z.object({
  formType: z.string().min(1).describe('Type of form (e.g., activity, event)'),
  entityId: optionalDraftEntityIdSchema.describe(
    'Entity ID being edited (omit for new items)'
  ),
});

export type DraftLookupQuery = z.infer<typeof draftLookupQuerySchema>;

/**
 * Single draft as returned by the API (id, userId, formType, entityId, draftData, createdAt, updatedAt, expiresAt).
 */
export const draftResponseSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  formType: z.string(),
  entityId: z.number().int().nullable(),
  draftData: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
});

export type DraftResponse = z.infer<typeof draftResponseSchema>;

/**
 * GET /drafts/list - Response body shape.
 */
export const draftsListResponseSchema = z.object({
  drafts: z.array(draftResponseSchema),
  count: z.number().int(),
});

export type DraftsListResponse = z.infer<typeof draftsListResponseSchema>;
