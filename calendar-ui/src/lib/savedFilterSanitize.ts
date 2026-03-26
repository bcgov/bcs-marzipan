import {
  DEFAULT_ACTIVITY_FILTER_STATE,
  type ActivityFilterState,
  type PitchDateFilter,
} from '@/components/activity/ActivityTable/activityFilterState';

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

function sanitizeStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).filter(
    (s): s is string => typeof s === 'string' && s.length > 0
  );
}

/**
 * Valid lookup ID sets that can be provided for sanitization.
 * If a set is undefined, no validation is performed for that field.
 */
export interface ValidFilterLookups {
  statusIds?: ReadonlySet<number>;
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
  if (!raw || typeof raw !== 'object') {
    return {
      filterState: DEFAULT_ACTIVITY_FILTER_STATE,
      searchKeyword: payload.searchKeyword ?? '',
      hadInvalidValues: Object.keys(raw ?? {}).length > 0,
    };
  }

  let hadInvalid = false;

  const dr = raw.dateRange as Record<string, unknown> | undefined;
  const dateRange = {
    startDate: dr && typeof dr.startDate === 'string' ? dr.startDate : '',
    endDate: dr && typeof dr.endDate === 'string' ? dr.endDate : '',
    noStartDate: dr?.noStartDate === true,
    noEndDate: dr?.noEndDate === true,
  };

  const categoryNames = sanitizeStringArray(raw.categoryNames);

  const statusResult = sanitizeIdArray(
    raw.activityStatusIds,
    lookups?.statusIds
  );
  if (statusResult.removed) hadInvalid = true;

  const pitchRequiredStatusNames = sanitizeStringArray(
    raw.pitchRequiredStatusNames
  );

  let pitchDateFilter: PitchDateFilter = { kind: 'any' };
  const pdf = raw.pitchDateFilter as
    | { kind?: string; dateRange?: Record<string, unknown> }
    | undefined;
  if (pdf && typeof pdf === 'object') {
    if (pdf.kind === 'not_scheduled') {
      pitchDateFilter = { kind: 'not_scheduled' };
    } else if (pdf.kind === 'scheduled' && pdf.dateRange) {
      const pr = pdf.dateRange;
      pitchDateFilter = {
        kind: 'scheduled',
        dateRange: {
          startDate: typeof pr.startDate === 'string' ? pr.startDate : '',
          endDate: typeof pr.endDate === 'string' ? pr.endDate : '',
          noStartDate: pr.noStartDate === true,
          noEndDate: pr.noEndDate === true,
        },
      };
    }
  }

  const lookAheadStatusValues = sanitizeStringArray(raw.lookAheadStatusValues);
  const lookAheadSectionValues = sanitizeStringArray(
    raw.lookAheadSectionValues
  );

  const rawDateConfirmed = raw.dateConfirmedFilter;
  const dateConfirmedFilter: ActivityFilterState['dateConfirmedFilter'] =
    rawDateConfirmed === 'confirmed' || rawDateConfirmed === 'not_confirmed'
      ? rawDateConfirmed
      : 'any';

  const rawTimeConfirmed = raw.timeConfirmedFilter;
  const timeConfirmedFilter: ActivityFilterState['timeConfirmedFilter'] =
    rawTimeConfirmed === 'confirmed' || rawTimeConfirmed === 'not_confirmed'
      ? rawTimeConfirmed
      : 'any';

  const tagResult = sanitizeIdArray(raw.tagIds, lookups?.tagIds);
  if (tagResult.removed) hadInvalid = true;

  const ministryResult = sanitizeIdArray(
    raw.leadMinistryIds,
    lookups?.ministryIds
  );
  if (ministryResult.removed) hadInvalid = true;

  const orgResult = sanitizeIdArray(raw.leadOrgIds, lookups?.orgIds);
  if (orgResult.removed) hadInvalid = true;

  const commsResult = sanitizeIdArray(
    raw.commsContactLeadUserIds,
    lookups?.commsContactUserIds
  );
  if (commsResult.removed) hadInvalid = true;

  const plannerResult = sanitizeIdArray(
    raw.eventPlannerLeadIds,
    lookups?.eventPlannerIds
  );
  if (plannerResult.removed) hadInvalid = true;

  const translationStatusResult = sanitizeIdArray(
    raw.translationRequiredStatusIds,
    lookups?.translationStatusIds
  );
  if (translationStatusResult.removed) hadInvalid = true;

  const translationLangResult = sanitizeIdArray(
    raw.translationLanguageIds,
    lookups?.translationLanguageIds
  );
  if (translationLangResult.removed) hadInvalid = true;

  return {
    filterState: {
      dateRange,
      categoryNames,
      activityStatusIds: statusResult.ids,
      pitchRequiredStatusNames,
      pitchDateFilter,
      lookAheadStatusValues,
      lookAheadSectionValues,
      dateConfirmedFilter,
      timeConfirmedFilter,
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
