import {
  activityFilterStateIsDefault,
  coerceActivityFilterStateFromRecord,
  hasDisallowedActivityFilterStateKeys,
} from '../activity-filter-state';

/**
 * Whether a saved-filter payload has no criteria (equivalent to the activity
 * table's default empty filter state and no search text).
 */
export const SAVED_FILTER_EMPTY_PAYLOAD_MESSAGE =
  'Saved filter must include at least one filter criterion or a search keyword.';

function isNonEmptyTrimmedSearch(searchKeyword: unknown): boolean {
  return typeof searchKeyword === 'string' && searchKeyword.trim().length > 0;
}

/**
 * @param filterState - Serialized ActivityFilterState (may be partial/unknown).
 * @param searchKeyword - Raw search string from API or UI.
 */
export function savedFilterPayloadIsEmpty(
  filterState: Record<string, unknown> | undefined,
  searchKeyword: unknown
): boolean {
  if (isNonEmptyTrimmedSearch(searchKeyword)) return false;

  if (filterState == null || typeof filterState !== 'object') return true;
  if (Array.isArray(filterState)) return true;

  if (hasDisallowedActivityFilterStateKeys(filterState)) return false;

  const coerced = coerceActivityFilterStateFromRecord(filterState);
  return activityFilterStateIsDefault(coerced);
}
