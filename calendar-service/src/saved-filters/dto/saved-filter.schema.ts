/**
 * Zod schemas for the saved-filters API (calendar-service local).
 * The shared package defines the canonical shapes; these are re-exported
 * for local validation pipe usage and may contain service-only schemas.
 */

export {
  createSavedFilterBodySchema,
  duplicateSavedFilterBodySchema,
  savedFilterListResponseSchema,
  savedFilterResponseSchema,
  setMyDefaultSavedFilterBodySchema,
  updateSavedFilterBodySchema,
} from '@corpcal/shared/schemas';

export type {
  CreateSavedFilterBody,
  DuplicateSavedFilterBody,
  SavedFilterListResponse,
  SavedFilterResponse,
  SetMyDefaultSavedFilterBody,
  UpdateSavedFilterBody,
} from '@corpcal/shared/schemas';
