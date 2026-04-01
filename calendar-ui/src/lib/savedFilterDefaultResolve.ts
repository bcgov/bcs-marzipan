import type { SavedFilterResponse } from '@corpcal/shared/schemas';

/**
 * Resolves which saved filter id is the effective default for auto-apply:
 * API `defaultSavedFilterId` when that filter is still present in the visible list.
 */
export function resolveEffectiveDefaultSavedFilterId(
  savedFilters: SavedFilterResponse[],
  defaultSavedFilterId: number | null
): number | null {
  if (defaultSavedFilterId == null) return null;
  return savedFilters.some((f) => f.id === defaultSavedFilterId)
    ? defaultSavedFilterId
    : null;
}
