import { useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DEFAULT_ACTIVITY_FILTER_STATE,
  type ActivityFilterState,
} from '@/components/ActivityTable/activityFilterState';

const STORAGE_KEY = 'activityTablePreferences';

const URL_PARAM_SORT = 'sort';
const URL_PARAM_DIR = 'dir';
const URL_PARAM_COMPLETED = 'completed';
const URL_PARAM_DELETED = 'deleted';
const URL_PARAM_PAGE_SIZE = 'pageSize';
const URL_PARAM_SEARCH = 'search';
const URL_PARAM_DATE_FROM = 'dateFrom';
const URL_PARAM_DATE_TO = 'dateTo';
const URL_PARAM_NO_START = 'noStart';
const URL_PARAM_NO_END = 'noEnd';
const URL_PARAM_CATEGORY = 'category';
const URL_PARAM_STATUS = 'status';
const URL_PARAM_PITCH_STATUS = 'pitchStatus';
const URL_PARAM_PITCH_DATE_KIND = 'pitchDateKind';
const URL_PARAM_PITCH_DATE_FROM = 'pitchDateFrom';
const URL_PARAM_PITCH_DATE_TO = 'pitchDateTo';
const URL_PARAM_PITCH_NO_START = 'pitchNoStart';
const URL_PARAM_PITCH_NO_END = 'pitchNoEnd';
const URL_PARAM_LOOK_AHEAD_STATUS = 'lookAheadStatus';
const URL_PARAM_LOOK_AHEAD_SECTION = 'lookAheadSection';
const URL_PARAM_DATE_CONFIRMED = 'dateConfirmed';
const URL_PARAM_TIME_CONFIRMED = 'timeConfirmed';
const URL_PARAM_TAG = 'tag';

/** Delay before syncing search keyword to URL so the input keeps focus while typing. */
const SEARCH_SYNC_DEBOUNCE_MS = 400;

const VALID_SORT_KEYS = new Set([
  'activityId',
  'activityStatus',
  'lookAheadStatus',
  'startDate',
  'lastUpdated',
  'createdDateTime',
]);

const DEFAULT_SORT_KEY = 'startDate';
const DEFAULT_SORT_DIRECTION = 'desc' as const;
const DEFAULT_PAGE_SIZE = 10;
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 100;

export interface ActivityTablePreferences {
  sortKey: string;
  sortDirection: 'asc' | 'desc';
  showCompleted: boolean;
  showDeleted: boolean;
  pageSize: number;
  searchKeyword: string;
  filterState: ActivityFilterState;
}

const DEFAULT_PREFERENCES: ActivityTablePreferences = {
  sortKey: DEFAULT_SORT_KEY,
  sortDirection: DEFAULT_SORT_DIRECTION,
  showCompleted: false,
  showDeleted: false,
  pageSize: DEFAULT_PAGE_SIZE,
  searchKeyword: '',
  filterState: DEFAULT_ACTIVITY_FILTER_STATE,
};

function parseBool(value: string | null): boolean | null {
  if (value === null || value === '') return null;
  const lower = value.toLowerCase();
  if (lower === 'true' || lower === '1') return true;
  if (lower === 'false' || lower === '0') return false;
  return null;
}

function parsePageSize(value: string | null): number | null {
  if (value === null || value === '') return null;
  const n = parseInt(value, 10);
  if (!Number.isFinite(n) || n < MIN_PAGE_SIZE || n > MAX_PAGE_SIZE)
    return null;
  return n;
}

function parseFromSearchParams(
  searchParams: URLSearchParams,
  canSeeDeleted: boolean
): ActivityTablePreferences {
  const sort = searchParams.get(URL_PARAM_SORT)?.trim() || null;
  const dir = searchParams.get(URL_PARAM_DIR)?.toLowerCase() || null;
  const completed = parseBool(searchParams.get(URL_PARAM_COMPLETED));
  const deleted = parseBool(searchParams.get(URL_PARAM_DELETED));
  const pageSize = parsePageSize(searchParams.get(URL_PARAM_PAGE_SIZE));
  const searchParam = searchParams.get(URL_PARAM_SEARCH);
  const searchKeyword =
    typeof searchParam === 'string' ? searchParam.trim() : '';

  const dateFrom = searchParams.get(URL_PARAM_DATE_FROM)?.trim() ?? '';
  const dateTo = searchParams.get(URL_PARAM_DATE_TO)?.trim() ?? '';
  const noStart = parseBool(searchParams.get(URL_PARAM_NO_START));
  const noEnd = parseBool(searchParams.get(URL_PARAM_NO_END));
  const categoryParam = searchParams.get(URL_PARAM_CATEGORY);
  const categoryNames =
    typeof categoryParam === 'string' && categoryParam.trim()
      ? categoryParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  const statusParam = searchParams.get(URL_PARAM_STATUS);
  const activityStatusIds =
    typeof statusParam === 'string' && statusParam.trim()
      ? statusParam
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => Number.isFinite(n))
      : [];

  const pitchStatusParam = searchParams.get(URL_PARAM_PITCH_STATUS);
  const pitchRequiredStatusNames =
    typeof pitchStatusParam === 'string' && pitchStatusParam.trim()
      ? pitchStatusParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const pitchDateKindParam = searchParams
    .get(URL_PARAM_PITCH_DATE_KIND)
    ?.trim();
  const pitchDateFrom =
    searchParams.get(URL_PARAM_PITCH_DATE_FROM)?.trim() ?? '';
  const pitchDateTo = searchParams.get(URL_PARAM_PITCH_DATE_TO)?.trim() ?? '';
  const pitchNoStart = parseBool(searchParams.get(URL_PARAM_PITCH_NO_START));
  const pitchNoEnd = parseBool(searchParams.get(URL_PARAM_PITCH_NO_END));

  let pitchDateFilter: ActivityFilterState['pitchDateFilter'] = {
    kind: 'any',
  };
  if (pitchDateKindParam === 'not_scheduled') {
    pitchDateFilter = { kind: 'not_scheduled' };
  } else if (pitchDateKindParam === 'scheduled') {
    pitchDateFilter = {
      kind: 'scheduled',
      dateRange: {
        startDate: pitchDateFrom,
        endDate: pitchDateTo,
        noStartDate: pitchNoStart === true,
        noEndDate: pitchNoEnd === true,
      },
    };
  }

  const lookAheadStatusParam = searchParams.get(URL_PARAM_LOOK_AHEAD_STATUS);
  const lookAheadStatusValues =
    typeof lookAheadStatusParam === 'string' && lookAheadStatusParam.trim()
      ? lookAheadStatusParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  const lookAheadSectionParam = searchParams.get(URL_PARAM_LOOK_AHEAD_SECTION);
  const lookAheadSectionValues =
    typeof lookAheadSectionParam === 'string' && lookAheadSectionParam.trim()
      ? lookAheadSectionParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const dateConfirmedParam = searchParams.get(URL_PARAM_DATE_CONFIRMED)?.trim();
  const dateConfirmedFilter: ActivityFilterState['dateConfirmedFilter'] =
    dateConfirmedParam === 'confirmed' || dateConfirmedParam === 'not_confirmed'
      ? dateConfirmedParam
      : 'any';
  const timeConfirmedParam = searchParams.get(URL_PARAM_TIME_CONFIRMED)?.trim();
  const timeConfirmedFilter: ActivityFilterState['timeConfirmedFilter'] =
    timeConfirmedParam === 'confirmed' || timeConfirmedParam === 'not_confirmed'
      ? timeConfirmedParam
      : 'any';

  const tagParam = searchParams.get(URL_PARAM_TAG);
  const tagIds =
    typeof tagParam === 'string' && tagParam.trim()
      ? tagParam
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => Number.isFinite(n))
      : [];

  const filterState: ActivityFilterState = {
    dateRange: {
      startDate: dateFrom,
      endDate: dateTo,
      noStartDate: noStart === true,
      noEndDate: noEnd === true,
    },
    categoryNames,
    activityStatusIds,
    pitchRequiredStatusNames,
    pitchDateFilter,
    lookAheadStatusValues,
    lookAheadSectionValues,
    dateConfirmedFilter,
    timeConfirmedFilter,
    tagIds,
  };

  return {
    sortKey:
      sort && VALID_SORT_KEYS.has(sort) ? sort : DEFAULT_PREFERENCES.sortKey,
    sortDirection:
      dir === 'asc' || dir === 'desc' ? dir : DEFAULT_PREFERENCES.sortDirection,
    showCompleted:
      completed !== null ? completed : DEFAULT_PREFERENCES.showCompleted,
    showDeleted: !canSeeDeleted
      ? false
      : deleted !== null
        ? deleted
        : DEFAULT_PREFERENCES.showDeleted,
    pageSize: pageSize ?? DEFAULT_PREFERENCES.pageSize,
    searchKeyword,
    filterState,
  };
}

function parseFromStorage(
  canSeeDeleted: boolean
): ActivityTablePreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return null;

    const sortKey =
      typeof parsed.sortKey === 'string' && VALID_SORT_KEYS.has(parsed.sortKey)
        ? parsed.sortKey
        : DEFAULT_PREFERENCES.sortKey;
    const sortDirection =
      parsed.sortDirection === 'asc' || parsed.sortDirection === 'desc'
        ? parsed.sortDirection
        : DEFAULT_PREFERENCES.sortDirection;
    const showCompleted =
      typeof parsed.showCompleted === 'boolean'
        ? parsed.showCompleted
        : DEFAULT_PREFERENCES.showCompleted;
    const showDeleted = !canSeeDeleted
      ? false
      : typeof parsed.showDeleted === 'boolean'
        ? parsed.showDeleted
        : DEFAULT_PREFERENCES.showDeleted;
    const pageSize =
      typeof parsed.pageSize === 'number' &&
      Number.isFinite(parsed.pageSize) &&
      parsed.pageSize >= MIN_PAGE_SIZE &&
      parsed.pageSize <= MAX_PAGE_SIZE
        ? parsed.pageSize
        : DEFAULT_PREFERENCES.pageSize;
    const searchKeyword =
      typeof parsed.searchKeyword === 'string'
        ? parsed.searchKeyword.trim()
        : DEFAULT_PREFERENCES.searchKeyword;

    const rawFilter = parsed.filterState as Record<string, unknown> | undefined;
    let filterState: ActivityFilterState = DEFAULT_ACTIVITY_FILTER_STATE;
    if (rawFilter && typeof rawFilter === 'object') {
      const dr = rawFilter.dateRange as Record<string, unknown> | undefined;
      if (dr && typeof dr === 'object') {
        const pitchRequiredStatusNames = Array.isArray(
          rawFilter.pitchRequiredStatusNames
        )
          ? (rawFilter.pitchRequiredStatusNames as string[]).filter(
              (s): s is string => typeof s === 'string'
            )
          : [];
        const pdf = rawFilter.pitchDateFilter as
          | { kind: string; dateRange?: Record<string, unknown> }
          | undefined;
        let pitchDateFilter: ActivityFilterState['pitchDateFilter'] = {
          kind: 'any',
        };
        if (pdf && typeof pdf === 'object' && pdf.kind === 'not_scheduled') {
          pitchDateFilter = { kind: 'not_scheduled' };
        } else if (
          pdf &&
          typeof pdf === 'object' &&
          pdf.kind === 'scheduled' &&
          pdf.dateRange &&
          typeof pdf.dateRange === 'object'
        ) {
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
        const lookAheadStatusValues = Array.isArray(
          rawFilter.lookAheadStatusValues
        )
          ? (rawFilter.lookAheadStatusValues as string[]).filter(
              (s): s is string => typeof s === 'string'
            )
          : [];
        const lookAheadSectionValues = Array.isArray(
          rawFilter.lookAheadSectionValues
        )
          ? (rawFilter.lookAheadSectionValues as string[]).filter(
              (s): s is string => typeof s === 'string'
            )
          : [];
        const dateConfirmedFilterValue = rawFilter.dateConfirmedFilter;
        const dateConfirmedFilter: ActivityFilterState['dateConfirmedFilter'] =
          dateConfirmedFilterValue === 'confirmed' ||
          dateConfirmedFilterValue === 'not_confirmed'
            ? dateConfirmedFilterValue
            : 'any';
        const timeConfirmedFilterValue = rawFilter.timeConfirmedFilter;
        const timeConfirmedFilter: ActivityFilterState['timeConfirmedFilter'] =
          timeConfirmedFilterValue === 'confirmed' ||
          timeConfirmedFilterValue === 'not_confirmed'
            ? timeConfirmedFilterValue
            : 'any';
        const tagIds = Array.isArray(rawFilter.tagIds)
          ? (rawFilter.tagIds as number[]).filter(
              (n): n is number => typeof n === 'number' && Number.isFinite(n)
            )
          : [];
        filterState = {
          dateRange: {
            startDate: typeof dr.startDate === 'string' ? dr.startDate : '',
            endDate: typeof dr.endDate === 'string' ? dr.endDate : '',
            noStartDate: dr.noStartDate === true,
            noEndDate: dr.noEndDate === true,
          },
          categoryNames: Array.isArray(rawFilter.categoryNames)
            ? (rawFilter.categoryNames as string[]).filter(
                (s): s is string => typeof s === 'string'
              )
            : [],
          activityStatusIds: Array.isArray(rawFilter.activityStatusIds)
            ? (rawFilter.activityStatusIds as number[]).filter(
                (n): n is number => typeof n === 'number' && Number.isFinite(n)
              )
            : [],
          pitchRequiredStatusNames,
          pitchDateFilter,
          lookAheadStatusValues,
          lookAheadSectionValues,
          dateConfirmedFilter,
          timeConfirmedFilter,
          tagIds,
        };
      }
    }

    return {
      sortKey,
      sortDirection,
      showCompleted,
      showDeleted,
      pageSize,
      searchKeyword,
      filterState,
    };
  } catch {
    return null;
  }
}

function hasAnyKnownParam(searchParams: URLSearchParams): boolean {
  return (
    searchParams.has(URL_PARAM_SORT) ||
    searchParams.has(URL_PARAM_DIR) ||
    searchParams.has(URL_PARAM_COMPLETED) ||
    searchParams.has(URL_PARAM_DELETED) ||
    searchParams.has(URL_PARAM_PAGE_SIZE) ||
    searchParams.has(URL_PARAM_SEARCH) ||
    searchParams.has(URL_PARAM_DATE_FROM) ||
    searchParams.has(URL_PARAM_DATE_TO) ||
    searchParams.has(URL_PARAM_NO_START) ||
    searchParams.has(URL_PARAM_NO_END) ||
    searchParams.has(URL_PARAM_CATEGORY) ||
    searchParams.has(URL_PARAM_STATUS) ||
    searchParams.has(URL_PARAM_PITCH_STATUS) ||
    searchParams.has(URL_PARAM_PITCH_DATE_KIND) ||
    searchParams.has(URL_PARAM_PITCH_DATE_FROM) ||
    searchParams.has(URL_PARAM_PITCH_DATE_TO) ||
    searchParams.has(URL_PARAM_PITCH_NO_START) ||
    searchParams.has(URL_PARAM_PITCH_NO_END) ||
    searchParams.has(URL_PARAM_LOOK_AHEAD_STATUS) ||
    searchParams.has(URL_PARAM_LOOK_AHEAD_SECTION) ||
    searchParams.has(URL_PARAM_DATE_CONFIRMED) ||
    searchParams.has(URL_PARAM_TIME_CONFIRMED) ||
    searchParams.has(URL_PARAM_TAG)
  );
}

function getInitialPreferences(
  searchParams: URLSearchParams,
  canSeeDeleted: boolean
): ActivityTablePreferences {
  if (hasAnyKnownParam(searchParams)) {
    return parseFromSearchParams(searchParams, canSeeDeleted);
  }
  const fromStorage = parseFromStorage(canSeeDeleted);
  return (
    fromStorage ?? {
      ...DEFAULT_PREFERENCES,
      showDeleted: canSeeDeleted ? DEFAULT_PREFERENCES.showDeleted : false,
    }
  );
}

function preferencesToParams(
  prefs: ActivityTablePreferences
): Record<string, string> {
  const f = prefs.filterState;
  const out: Record<string, string> = {
    [URL_PARAM_SORT]: prefs.sortKey,
    [URL_PARAM_DIR]: prefs.sortDirection,
    [URL_PARAM_COMPLETED]: String(prefs.showCompleted),
    [URL_PARAM_DELETED]: String(prefs.showDeleted),
    [URL_PARAM_PAGE_SIZE]: String(prefs.pageSize),
    [URL_PARAM_SEARCH]: prefs.searchKeyword,
    [URL_PARAM_DATE_FROM]: f.dateRange.startDate,
    [URL_PARAM_DATE_TO]: f.dateRange.endDate,
    [URL_PARAM_NO_START]: String(f.dateRange.noStartDate),
    [URL_PARAM_NO_END]: String(f.dateRange.noEndDate),
    [URL_PARAM_CATEGORY]: f.categoryNames.join(','),
    [URL_PARAM_STATUS]: f.activityStatusIds.join(','),
    [URL_PARAM_PITCH_STATUS]: f.pitchRequiredStatusNames.join(','),
    [URL_PARAM_PITCH_DATE_KIND]: f.pitchDateFilter.kind,
    [URL_PARAM_LOOK_AHEAD_STATUS]: f.lookAheadStatusValues.join(','),
    [URL_PARAM_LOOK_AHEAD_SECTION]: f.lookAheadSectionValues.join(','),
    [URL_PARAM_DATE_CONFIRMED]:
      f.dateConfirmedFilter === 'any' ? '' : f.dateConfirmedFilter,
    [URL_PARAM_TIME_CONFIRMED]:
      f.timeConfirmedFilter === 'any' ? '' : f.timeConfirmedFilter,
    [URL_PARAM_TAG]: f.tagIds.join(','),
  };
  if (f.pitchDateFilter.kind === 'scheduled') {
    const dr = f.pitchDateFilter.dateRange;
    out[URL_PARAM_PITCH_DATE_FROM] = dr.startDate;
    out[URL_PARAM_PITCH_DATE_TO] = dr.endDate;
    out[URL_PARAM_PITCH_NO_START] = String(dr.noStartDate);
    out[URL_PARAM_PITCH_NO_END] = String(dr.noEndDate);
  }
  return out;
}

/**
 * Returns the activity list URL search string from sessionStorage (e.g. "?sort=lastUpdated&dir=desc")
 * for use in breadcrumb or other links back to the list. Returns "" if no valid stored preferences.
 */
export function getStoredActivityListSearch(canSeeDeleted: boolean): string {
  const prefs = parseFromStorage(canSeeDeleted);
  if (!prefs) return '';
  const params = new URLSearchParams(preferencesToParams(prefs));
  const search = params.toString();
  return search ? `?${search}` : '';
}

/**
 * Persists activity table sort and filters using URL search params and sessionStorage.
 * URL is source of truth when params are present (shareable links); when the user
 * lands on the page with no params, state is restored from sessionStorage.
 */
export function useActivityTablePreferences(canSeeDeleted: boolean): {
  preferences: ActivityTablePreferences;
  setPreferences: (partial: Partial<ActivityTablePreferences>) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();
  const [preferences, setPreferencesState] = useState<ActivityTablePreferences>(
    () => getInitialPreferences(searchParams, canSeeDeleted)
  );
  const hasUserChangedRef = useRef(false);
  const lastUrlSyncRef = useRef<ActivityTablePreferences | null>(null);
  const searchSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;

  const setPreferences = useCallback(
    (partial: Partial<ActivityTablePreferences>) => {
      hasUserChangedRef.current = true;
      setPreferencesState((prev) => {
        const next: ActivityTablePreferences = {
          ...prev,
          ...partial,
          showDeleted:
            partial.showDeleted !== undefined
              ? canSeeDeleted
                ? partial.showDeleted
                : false
              : prev.showDeleted,
          filterState:
            partial.filterState !== undefined
              ? partial.filterState
              : prev.filterState,
        };
        return next;
      });
    },
    [canSeeDeleted]
  );

  const syncToUrl = useCallback(
    (prefs: ActivityTablePreferences) => {
      lastUrlSyncRef.current = prefs;
      setSearchParams(preferencesToParams(prefs), { replace: true });
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (!hasUserChangedRef.current) return;

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch {
        // ignore
      }
    }

    const prev = lastUrlSyncRef.current;
    const onlySearchChanged =
      prev !== null &&
      prev.sortKey === preferences.sortKey &&
      prev.sortDirection === preferences.sortDirection &&
      prev.showCompleted === preferences.showCompleted &&
      prev.showDeleted === preferences.showDeleted &&
      prev.pageSize === preferences.pageSize &&
      JSON.stringify(prev.filterState) ===
        JSON.stringify(preferences.filterState) &&
      prev.searchKeyword !== preferences.searchKeyword;

    if (onlySearchChanged) {
      if (searchSyncTimeoutRef.current != null) {
        clearTimeout(searchSyncTimeoutRef.current);
      }
      searchSyncTimeoutRef.current = setTimeout(() => {
        searchSyncTimeoutRef.current = null;
        syncToUrl(preferencesRef.current);
      }, SEARCH_SYNC_DEBOUNCE_MS);
    } else {
      if (searchSyncTimeoutRef.current != null) {
        clearTimeout(searchSyncTimeoutRef.current);
        searchSyncTimeoutRef.current = null;
      }
      syncToUrl(preferences);
    }

    return () => {
      if (searchSyncTimeoutRef.current != null) {
        clearTimeout(searchSyncTimeoutRef.current);
        searchSyncTimeoutRef.current = null;
      }
    };
  }, [preferences, syncToUrl]);

  return { preferences, setPreferences };
}
