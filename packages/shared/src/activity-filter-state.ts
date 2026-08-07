import { isDeepEqual } from './utils/isDeepEqual';

/** Scheduled / pitch panel date range bounds (ISO date strings or empty). */
export interface DateRangeValue {
  startDate: string;
  endDate: string;
  noStartDate: boolean;
  noEndDate: boolean;
}

/** Pitch date filter: any (no filter), not_scheduled, or scheduled with optional date range. */
export type PitchDateFilter =
  | { kind: 'any' }
  | { kind: 'not_scheduled' }
  | { kind: 'scheduled'; dateRange: DateRangeValue };

export interface ActivityFilterState {
  dateRange: DateRangeValue;
  categoryIds: number[];
  activityStatusIds: number[];
  pitchRequiredStatusNames: string[];
  pitchDateFilter: PitchDateFilter;
  lookAheadStatusValues: string[];
  lookAheadSectionValues: string[];
  dateConfirmedFilter: 'any' | 'confirmed' | 'not_confirmed';
  timeConfirmedFilter: 'any' | 'confirmed' | 'not_confirmed';
  tagIds: number[];
  leadMinistryIds: number[];
  leadOrgIds: number[];
  commsContactLeadUserIds: number[];
  eventPlannerLeadIds: number[];
  translationRequiredStatusIds: number[];
  translationLanguageIds: number[];
}

export type ConfirmedFilterValue = ActivityFilterState['dateConfirmedFilter'];

/** Canonical keys for `ActivityFilterState` (used to reject unknown JSON keys). */
export const ACTIVITY_FILTER_STATE_KEYS = [
  'dateRange',
  'categoryIds',
  'activityStatusIds',
  'pitchRequiredStatusNames',
  'pitchDateFilter',
  'lookAheadStatusValues',
  'lookAheadSectionValues',
  'dateConfirmedFilter',
  'timeConfirmedFilter',
  'tagIds',
  'leadMinistryIds',
  'leadOrgIds',
  'commsContactLeadUserIds',
  'eventPlannerLeadIds',
  'translationRequiredStatusIds',
  'translationLanguageIds',
] as const satisfies readonly (keyof ActivityFilterState)[];

/** Keys of {@link ActivityFilterState} whose values are multi-select arrays. */
export type ActivityFilterArrayStateKey = {
  [K in keyof ActivityFilterState]: ActivityFilterState[K] extends readonly unknown[]
    ? K
    : never;
}[keyof ActivityFilterState];

const NON_ARRAY_ACTIVITY_FILTER_STATE_KEYS = new Set<keyof ActivityFilterState>(
  ['dateRange', 'pitchDateFilter', 'dateConfirmedFilter', 'timeConfirmedFilter']
);

/** Array-valued filter keys derived from {@link ACTIVITY_FILTER_STATE_KEYS}. */
export const ACTIVITY_FILTER_ARRAY_STATE_KEYS =
  ACTIVITY_FILTER_STATE_KEYS.filter(
    (key): key is ActivityFilterArrayStateKey =>
      !NON_ARRAY_ACTIVITY_FILTER_STATE_KEYS.has(key)
  );

const ALLOWED_FILTER_STATE_KEY_SET = new Set<string>(
  ACTIVITY_FILTER_STATE_KEYS
);

export const DEFAULT_PITCH_DATE_RANGE: DateRangeValue = {
  startDate: '',
  endDate: '',
  noStartDate: false,
  noEndDate: false,
};

export const DEFAULT_ACTIVITY_FILTER_STATE: ActivityFilterState = {
  dateRange: {
    startDate: '',
    endDate: '',
    noStartDate: false,
    noEndDate: false,
  },
  categoryIds: [],
  activityStatusIds: [],
  pitchRequiredStatusNames: [],
  pitchDateFilter: { kind: 'any' },
  lookAheadStatusValues: [],
  lookAheadSectionValues: [],
  dateConfirmedFilter: 'any',
  timeConfirmedFilter: 'any',
  tagIds: [],
  leadMinistryIds: [],
  leadOrgIds: [],
  commsContactLeadUserIds: [],
  eventPlannerLeadIds: [],
  translationRequiredStatusIds: [],
  translationLanguageIds: [],
};

/**
 * True when `state` matches the default activity table filter (no criteria).
 */
export function activityFilterStateIsDefault(
  state: ActivityFilterState
): boolean {
  return isDeepEqual(state, DEFAULT_ACTIVITY_FILTER_STATE);
}

/**
 * True when `raw` is a non-array object containing a property outside
 * `ACTIVITY_FILTER_STATE_KEYS` (fail-safe for forward compatibility).
 */
export function hasDisallowedActivityFilterStateKeys(raw: unknown): boolean {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return false;
  }
  for (const k of Object.keys(raw)) {
    if (!ALLOWED_FILTER_STATE_KEY_SET.has(k)) return true;
  }
  return false;
}

function sanitizeIdArrayNoLookup(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).filter(
    (n): n is number => typeof n === 'number' && Number.isFinite(n)
  );
}

function sanitizeStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).filter(
    (s): s is string => typeof s === 'string' && s.length > 0
  );
}

/**
 * Coerces persisted or API JSON into `ActivityFilterState` using the same
 * structural rules as calendar-ui `sanitizeSavedFilterPayload` when no lookup
 * validation is applied.
 */
export function coerceActivityFilterStateFromRecord(
  raw: Record<string, unknown>
): ActivityFilterState {
  const dr = raw.dateRange as Record<string, unknown> | undefined;
  const dateRange: DateRangeValue = {
    startDate: dr && typeof dr.startDate === 'string' ? dr.startDate : '',
    endDate: dr && typeof dr.endDate === 'string' ? dr.endDate : '',
    noStartDate: dr?.noStartDate === true,
    noEndDate: dr?.noEndDate === true,
  };

  const categoryIds = sanitizeIdArrayNoLookup(raw.categoryIds);
  const activityStatusIds = sanitizeIdArrayNoLookup(raw.activityStatusIds);
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

  return {
    dateRange,
    categoryIds,
    activityStatusIds,
    pitchRequiredStatusNames,
    pitchDateFilter,
    lookAheadStatusValues,
    lookAheadSectionValues,
    dateConfirmedFilter,
    timeConfirmedFilter,
    tagIds: sanitizeIdArrayNoLookup(raw.tagIds),
    leadMinistryIds: sanitizeIdArrayNoLookup(raw.leadMinistryIds),
    leadOrgIds: sanitizeIdArrayNoLookup(raw.leadOrgIds),
    commsContactLeadUserIds: sanitizeIdArrayNoLookup(
      raw.commsContactLeadUserIds
    ),
    eventPlannerLeadIds: sanitizeIdArrayNoLookup(raw.eventPlannerLeadIds),
    translationRequiredStatusIds: sanitizeIdArrayNoLookup(
      raw.translationRequiredStatusIds
    ),
    translationLanguageIds: sanitizeIdArrayNoLookup(raw.translationLanguageIds),
  };
}
