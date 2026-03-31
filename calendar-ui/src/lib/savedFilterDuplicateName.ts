import { ApiError } from '@/api/errors';

/** Must match `ConflictException` detail from saved-filters `assertNameUnique`. */
export const SAVED_FILTER_DUPLICATE_NAME_DETAIL_SNIPPET =
  'A saved filter with this name already exists';

/** Inline field copy (matches Activity-style short message). */
export const SAVED_FILTER_DUPLICATE_NAME_INLINE =
  'A filter with that name already exists.';

export function isSavedFilterDuplicateNameConflict(
  error: unknown
): error is ApiError {
  return (
    error instanceof ApiError &&
    error.status === 409 &&
    error.detail.includes(SAVED_FILTER_DUPLICATE_NAME_DETAIL_SNIPPET)
  );
}
