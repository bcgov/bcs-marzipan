import {
  coerceActivityFilterStateFromRecord,
  DEFAULT_ACTIVITY_FILTER_STATE,
  hasDisallowedActivityFilterStateKeys,
  type ActivityFilterState,
} from '@corpcal/shared';

export interface SavedFilterPayload {
  filterState: Record<string, unknown>;
  searchKeyword: string;
}

export interface SanitizedFilterResult {
  filterState: ActivityFilterState;
  searchKeyword: string;
  hadInvalidValues: boolean;
}

/**
 * Validates a numeric ID array from a saved filter against a set of currently
 * valid IDs. Returns only the valid subset and flags whether any were removed.
 */
function sanitizeIdArray(
  raw: unknown,
  validIds?: ReadonlySet<number>
): { ids: number[]; removed: boolean } {
  if (!Array.isArray(raw)) return { ids: [], removed: false };
  const nums = (raw as unknown[]).filter(
    (n): n is number => typeof n === 'number' && Number.isFinite(n)
  );
  if (!validIds) return { ids: nums, removed: false };
  const filtered = nums.filter((id) => validIds.has(id));
  return { ids: filtered, removed: filtered.length < nums.length };
}

/**
 * Valid lookup ID sets that can be provided for sanitization.
 * If a set is undefined, no validation is performed for that field.
 */
export interface ValidFilterLookups {
  statusIds?: ReadonlySet<number>;
  categoryIds?: ReadonlySet<number>;
  tagIds?: ReadonlySet<number>;
  ministryIds?: ReadonlySet<number>;
  orgIds?: ReadonlySet<number>;
  commsContactUserIds?: ReadonlySet<number>;
  eventPlannerIds?: ReadonlySet<number>;
  translationStatusIds?: ReadonlySet<number>;
  translationLanguageIds?: ReadonlySet<number>;
}

/**
 * Parses and sanitizes a saved filter payload into a valid ActivityFilterState.
 * Gracefully handles missing/invalid fields by falling back to defaults.
 * Reports whether any values were dropped so the caller can notify the user.
 */
export function sanitizeSavedFilterPayload(
  payload: SavedFilterPayload,
  lookups?: ValidFilterLookups
): SanitizedFilterResult {
  const raw = payload.filterState;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      filterState: DEFAULT_ACTIVITY_FILTER_STATE,
      searchKeyword: payload.searchKeyword ?? '',
      hadInvalidValues: Object.keys(raw ?? {}).length > 0,
    };
  }

  const record = raw;
  let hadInvalid = hasDisallowedActivityFilterStateKeys(record);

  const base = coerceActivityFilterStateFromRecord(record);

  const statusResult = sanitizeIdArray(
    record.activityStatusIds,
    lookups?.statusIds
  );
  if (statusResult.removed) hadInvalid = true;

  const tagResult = sanitizeIdArray(record.tagIds, lookups?.tagIds);
  if (tagResult.removed) hadInvalid = true;

  const categoryResult = sanitizeIdArray(
    record.categoryIds,
    lookups?.categoryIds
  );
  if (categoryResult.removed) hadInvalid = true;

  const ministryResult = sanitizeIdArray(
    record.leadMinistryIds,
    lookups?.ministryIds
  );
  if (ministryResult.removed) hadInvalid = true;

  const orgResult = sanitizeIdArray(record.leadOrgIds, lookups?.orgIds);
  if (orgResult.removed) hadInvalid = true;

  const commsResult = sanitizeIdArray(
    record.commsContactLeadUserIds,
    lookups?.commsContactUserIds
  );
  if (commsResult.removed) hadInvalid = true;

  const plannerResult = sanitizeIdArray(
    record.eventPlannerLeadIds,
    lookups?.eventPlannerIds
  );
  if (plannerResult.removed) hadInvalid = true;

  const translationStatusResult = sanitizeIdArray(
    record.translationRequiredStatusIds,
    lookups?.translationStatusIds
  );
  if (translationStatusResult.removed) hadInvalid = true;

  const translationLangResult = sanitizeIdArray(
    record.translationLanguageIds,
    lookups?.translationLanguageIds
  );
  if (translationLangResult.removed) hadInvalid = true;

  return {
    filterState: {
      ...base,
      activityStatusIds: statusResult.ids,
      categoryIds: categoryResult.ids,
      tagIds: tagResult.ids,
      leadMinistryIds: ministryResult.ids,
      leadOrgIds: orgResult.ids,
      commsContactLeadUserIds: commsResult.ids,
      eventPlannerLeadIds: plannerResult.ids,
      translationRequiredStatusIds: translationStatusResult.ids,
      translationLanguageIds: translationLangResult.ids,
    },
    searchKeyword: payload.searchKeyword ?? '',
    hadInvalidValues: hadInvalid,
  };
}
