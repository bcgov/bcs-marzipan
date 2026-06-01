import { useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { mergeActivityTablePreferences } from '@/lib/report-preferences-defaults';
import {
  getInitialBundle,
  getPreferencesForReport,
  preferencesToParams,
  SEARCH_SYNC_DEBOUNCE_MS,
  STORAGE_KEY,
  type ActivityTablePreferences,
  type ReportsPreferencesBundle,
} from '@/lib/reportsTablePreferencesParams';

export type { ActivityTablePreferences } from '@/lib/reportsTablePreferencesParams';
export { getStoredReportsSearch } from '@/lib/reportsTablePreferencesParams';

/**
 * Persists reports filters per report tab using URL search params and sessionStorage
 * (`reportsTablePreferences` per-tab bundle), independent of the Activity List.
 */
export function useReportsTablePreferences(
  canSeeDeleted: boolean,
  activeReportName: string
): {
  preferences: ActivityTablePreferences;
  setPreferences: (partial: Partial<ActivityTablePreferences>) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bundle, setBundle] = useState<ReportsPreferencesBundle>(() =>
    getInitialBundle(searchParams, canSeeDeleted)
  );
  const hasUserChangedRef = useRef(false);
  const lastUrlSyncRef = useRef<ActivityTablePreferences | null>(null);
  const searchSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const prevActiveReportRef = useRef(activeReportName);

  const preferences = useMemo(
    () => getPreferencesForReport(bundle, activeReportName, canSeeDeleted),
    [bundle, activeReportName, canSeeDeleted]
  );

  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;

  const setPreferences = useCallback(
    (partial: Partial<ActivityTablePreferences>) => {
      if (!activeReportName) return;
      hasUserChangedRef.current = true;
      setBundle((prev) => {
        const current = getPreferencesForReport(
          prev,
          activeReportName,
          canSeeDeleted
        );
        const next = mergeActivityTablePreferences(
          current,
          partial,
          canSeeDeleted
        );
        return {
          byReport: { ...prev.byReport, [activeReportName]: next },
        };
      });
    },
    [activeReportName, canSeeDeleted]
  );

  const syncToUrl = useCallback(
    (prefs: ActivityTablePreferences, reportName: string) => {
      if (!reportName) return;
      lastUrlSyncRef.current = prefs;
      setSearchParams(preferencesToParams(prefs, reportName), {
        replace: true,
      });
    },
    [setSearchParams]
  );

  // When the active report tab changes, sync URL to that tab's filters.
  useEffect(() => {
    if (!activeReportName) return;
    if (prevActiveReportRef.current === activeReportName) return;
    prevActiveReportRef.current = activeReportName;

    if (searchSyncTimeoutRef.current != null) {
      clearTimeout(searchSyncTimeoutRef.current);
      searchSyncTimeoutRef.current = null;
    }

    const prefs = getPreferencesForReport(
      bundle,
      activeReportName,
      canSeeDeleted
    );
    lastUrlSyncRef.current = prefs;
    setSearchParams(preferencesToParams(prefs, activeReportName), {
      replace: true,
    });
  }, [activeReportName, canSeeDeleted, setSearchParams]);

  useEffect(() => {
    if (!hasUserChangedRef.current || !activeReportName) return;

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
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
        syncToUrl(preferencesRef.current, activeReportName);
      }, SEARCH_SYNC_DEBOUNCE_MS);
    } else {
      if (searchSyncTimeoutRef.current != null) {
        clearTimeout(searchSyncTimeoutRef.current);
        searchSyncTimeoutRef.current = null;
      }
      syncToUrl(preferences, activeReportName);
    }

    return () => {
      if (searchSyncTimeoutRef.current != null) {
        clearTimeout(searchSyncTimeoutRef.current);
        searchSyncTimeoutRef.current = null;
      }
    };
  }, [bundle, preferences, activeReportName, syncToUrl]);

  return { preferences, setPreferences };
}
