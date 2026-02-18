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
