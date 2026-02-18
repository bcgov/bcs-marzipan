import { createZodDto } from 'nestjs-zod';

import {
  draftResponseSchema,
  draftsListResponseSchema,
  saveDraftBodySchema,
} from './draft.schema';

/**
 * DTO for creating or updating a form draft (POST /drafts/save).
 * Generated from saveDraftBodySchema using nestjs-zod.
 */
export class SaveDraftDto extends createZodDto(saveDraftBodySchema) {}

/**
 * DTO for a single draft response.
 * Generated from draftResponseSchema using nestjs-zod.
 */
export class DraftResponseDto extends createZodDto(draftResponseSchema) {}

/**
 * DTO for list of drafts response (GET /drafts/list).
 * Generated from draftsListResponseSchema using nestjs-zod.
 */
export class DraftsListResponseDto extends createZodDto(
  draftsListResponseSchema
) {}
