import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ActivityFilterState } from '@corpcal/shared';
import type { SavedFilterResponse } from '@corpcal/shared/schemas';
import type { ActivityTableActiveSavedFilter } from '@/components/activity/ActivityTable/ActivityTable';
import { hasAnyActivityTableFilterActive } from '@/components/activity/ActivityTable/ActivityTableFilters';
import { useActivityTableFilterLookups } from '@/hooks/useActivityTableFilterLookups';
import type { ActivityTablePreferences } from '@/hooks/useReportsTablePreferences';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import { buildValidFilterLookupsFromOptions } from '@/lib/activity-filter-lookups';
import { hasAnyKnownParam } from '@/lib/reportsTablePreferencesParams';
import { getSavedFilterAutoApplyDecision } from '@/lib/savedFilterAutoApplyDecision';
import { sanitizeSavedFilterPayload } from '@/lib/savedFilterSanitize';

export function useReportsSavedFilters(options: {
  preferences: ActivityTablePreferences;
  setPreferences: (partial: Partial<ActivityTablePreferences>) => void;
  canSeeDeleted: boolean;
}) {
  const { preferences, setPreferences, canSeeDeleted } = options;
  const [searchParams] = useSearchParams();
  const savedFiltersHook = useSavedFilters();
  const [activeSavedFilter, setActiveSavedFilter] =
    useState<ActivityTableActiveSavedFilter | null>(null);
  const defaultAppliedRef = useRef(false);
  const defaultSuppressedByClearRef = useRef(false);

  const lookups = useActivityTableFilterLookups(canSeeDeleted);

  const validFilterLookups = useMemo(
    () =>
      buildValidFilterLookupsFromOptions({
        statusOptions: lookups.statusOptions,
        tagOptions: lookups.tagOptions,
        ministryOptions: lookups.ministryOptions,
        organizationOptions: lookups.organizationOptions,
        commsContactOptions: lookups.commsContactOptions,
        eventPlannerOptions: lookups.eventPlannerOptions,
        translationStatusOptions: lookups.translationStatusOptions,
        translationOptions: lookups.translationOptions,
      }),
    [
      lookups.statusOptions,
      lookups.tagOptions,
      lookups.ministryOptions,
      lookups.organizationOptions,
      lookups.commsContactOptions,
      lookups.eventPlannerOptions,
      lookups.translationStatusOptions,
      lookups.translationOptions,
    ]
  );

  const parseSavedFilterForDraft = useCallback(
    (sf: SavedFilterResponse) => {
      const { filterState, searchKeyword } = sanitizeSavedFilterPayload(
        sf,
        validFilterLookups
      );
      return { filterState, searchKeyword };
    },
    [validFilterLookups]
  );

  const onApplySavedFilter = useCallback(
    (
      filterState: ActivityFilterState,
      searchKeyword: string,
      appliedFrom: { id: number; name: string }
    ) => {
      setPreferences({ filterState, searchKeyword });
      setActiveSavedFilter(appliedFrom);
    },
    [setPreferences]
  );

  const clearActiveSavedFilter = useCallback(() => {
    setActiveSavedFilter(null);
  }, []);

  const setPreferencesAndClearSaved = useCallback(
    (partial: Partial<ActivityTablePreferences>) => {
      setActiveSavedFilter(null);
      setPreferences(partial);
    },
    [setPreferences]
  );

  const savedFilterDefaultLookupsReady =
    lookups.hasActivityStatuses && !savedFiltersHook.isLoading;

  useEffect(() => {
    const decision = getSavedFilterAutoApplyDecision({
      lookupsReady: savedFilterDefaultLookupsReady,
      defaultAlreadyApplied: defaultAppliedRef.current,
      suppressedByClear: defaultSuppressedByClearRef.current,
      hasKnownUrlParams: hasAnyKnownParam(searchParams),
      hasRestoredActivePreferences:
        hasAnyActivityTableFilterActive(
          preferences.filterState,
          lookups.pitchFieldVisibility
        ) || preferences.searchKeyword.trim().length > 0,
      hasDefaultFilter: savedFiltersHook.defaultFilter != null,
    });

    if (decision.shouldMarkContextApplied) {
      defaultAppliedRef.current = true;
    }
    if (decision.shouldClearActiveSavedFilter) {
      setActiveSavedFilter(null);
    }
    if (!decision.shouldApplyDefault) return;

    const defaultFilter = savedFiltersHook.defaultFilter;
    if (!defaultFilter) return;

    const { filterState, searchKeyword, hadInvalidValues } =
      sanitizeSavedFilterPayload(defaultFilter, validFilterLookups);
    setPreferences({ filterState, searchKeyword });
    setActiveSavedFilter({ id: defaultFilter.id, name: defaultFilter.name });
    if (hadInvalidValues) {
      toast.warning(
        'Some filter values are no longer available and were skipped.'
      );
    }
  }, [
    savedFiltersHook.defaultFilter,
    savedFiltersHook.isLoading,
    searchParams,
    preferences.filterState,
    preferences.searchKeyword,
    setPreferences,
    validFilterLookups,
    savedFilterDefaultLookupsReady,
    lookups.pitchFieldVisibility,
  ]);

  const handleClearPanelFilters = useCallback(() => {
    defaultSuppressedByClearRef.current = true;
    clearActiveSavedFilter();
  }, [clearActiveSavedFilter]);

  return {
    savedFiltersHook,
    activeSavedFilter,
    onApplySavedFilter,
    clearActiveSavedFilter,
    setPreferencesAndClearSaved,
    handleClearPanelFilters,
    parseSavedFilterForDraft,
    validFilterLookups,
    filterSummaryContext: lookups.filterSummaryContext,
    appliedSavedFilterName: activeSavedFilter?.name ?? null,
  };
}
