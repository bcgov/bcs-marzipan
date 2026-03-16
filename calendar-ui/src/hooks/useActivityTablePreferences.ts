import { useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getInitialPreferences,
  preferencesToParams,
  SEARCH_SYNC_DEBOUNCE_MS,
  STORAGE_KEY,
  type ActivityTablePreferences,
} from '@/lib/activityTablePreferencesParams';

export type { ActivityTablePreferences } from '@/lib/activityTablePreferencesParams';
export { getStoredActivityListSearch } from '@/lib/activityTablePreferencesParams';

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
