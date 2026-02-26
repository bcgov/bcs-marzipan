import { useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'activityTablePreferences';

const URL_PARAM_SORT = 'sort';
const URL_PARAM_DIR = 'dir';
const URL_PARAM_COMPLETED = 'completed';
const URL_PARAM_DELETED = 'deleted';
const URL_PARAM_PAGE_SIZE = 'pageSize';

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
}

const DEFAULT_PREFERENCES: ActivityTablePreferences = {
  sortKey: DEFAULT_SORT_KEY,
  sortDirection: DEFAULT_SORT_DIRECTION,
  showCompleted: false,
  showDeleted: false,
  pageSize: DEFAULT_PAGE_SIZE,
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

    return {
      sortKey,
      sortDirection,
      showCompleted,
      showDeleted,
      pageSize,
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
    searchParams.has(URL_PARAM_PAGE_SIZE)
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
  return {
    [URL_PARAM_SORT]: prefs.sortKey,
    [URL_PARAM_DIR]: prefs.sortDirection,
    [URL_PARAM_COMPLETED]: String(prefs.showCompleted),
    [URL_PARAM_DELETED]: String(prefs.showDeleted),
    [URL_PARAM_PAGE_SIZE]: String(prefs.pageSize),
  };
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
        };
        return next;
      });
    },
    [canSeeDeleted]
  );

  useEffect(() => {
    if (!hasUserChangedRef.current) return;
    setSearchParams(preferencesToParams(preferences), { replace: true });
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch {
        // ignore storage errors
      }
    }
  }, [preferences, setSearchParams]);

  return { preferences, setPreferences };
}
