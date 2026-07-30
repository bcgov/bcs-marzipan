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
import analytics from '@/lib/analytics';
import { hasAnyKnownParam } from '@/lib/reportsTablePreferencesParams';
import { getSavedFilterAutoApplyDecision } from '@/lib/savedFilterAutoApplyDecision';
import { sanitizeSavedFilterPayload } from '@/lib/savedFilterSanitize';

export function useReportsSavedFilters(options: {
  reportName: string;
  preferences: ActivityTablePreferences;
  setPreferences: (partial: Partial<ActivityTablePreferences>) => void;
  canSeeDeleted: boolean;
}) {
  const { reportName, preferences, setPreferences, canSeeDeleted } = options;
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
        categoryOptions: lookups.categoryOptions,
        tagOptions: lookups.tagOptions,
        ministryOptions: lookups.ministryOptions,
        organizationOptions: lookups.organizationOptions,
        commsContactOptions: lookups.commsContactOptions,
        eventPlannerOptions: lookups.eventPlannerOptions,
        teamOptions: lookups.teamOptions,
        translationStatusOptions: lookups.translationStatusOptions,
        translationOptions: lookups.translationOptions,
      }),
    [
      lookups.statusOptions,
      lookups.categoryOptions,
      lookups.tagOptions,
      lookups.ministryOptions,
      lookups.organizationOptions,
      lookups.commsContactOptions,
      lookups.eventPlannerOptions,
      lookups.teamOptions,
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
      if (reportName) {
        analytics.trackSavedFilterAction({
          report_name: reportName,
          action: 'apply',
          filter_complexity_bucket: analytics.bucketFilterComplexity(
            analytics.countActiveReportFilterCriteria(filterState, reportName)
          ),
        });
      }
    },
    [reportName, setPreferences]
  );

  const estimateCriteriaCount = useCallback(
    (state: Record<string, unknown>) => {
      let count = 0;
      for (const value of Object.values(state)) {
        if (Array.isArray(value)) {
          if (value.length > 0) count += 1;
          continue;
        }
        if (typeof value === 'string') {
          if (value !== '' && value !== 'any') count += 1;
          continue;
        }
        if (typeof value === 'boolean') {
          if (value) count += 1;
          continue;
        }
        if (value && typeof value === 'object') {
          count += 1;
        }
      }
      return count;
    },
    []
  );

  const trackedSavedFiltersHook = useMemo(() => {
    return {
      ...savedFiltersHook,
      createFilter: async (
        ...args: Parameters<typeof savedFiltersHook.createFilter>
      ) => {
        const body = args[0];
        const result = await savedFiltersHook.createFilter(...args);
        if (reportName) {
          analytics.trackSavedFilterAction({
            report_name: reportName,
            action: 'create',
            filter_complexity_bucket: analytics.bucketFilterComplexity(
              estimateCriteriaCount(body.filterState)
            ),
          });
        }
        return result;
      },
      updateFilter: async (
        ...args: Parameters<typeof savedFiltersHook.updateFilter>
      ) => {
        const result = await savedFiltersHook.updateFilter(...args);
        if (reportName) {
          const body = args[0].body;
          const estimatedCount = body.filterState
            ? estimateCriteriaCount(body.filterState)
            : 0;
          analytics.trackSavedFilterAction({
            report_name: reportName,
            action: 'update',
            filter_complexity_bucket:
              analytics.bucketFilterComplexity(estimatedCount),
          });
        }
        return result;
      },
      duplicateFilter: async (
        ...args: Parameters<typeof savedFiltersHook.duplicateFilter>
      ) => {
        const result = await savedFiltersHook.duplicateFilter(...args);
        if (reportName) {
          analytics.trackSavedFilterAction({
            report_name: reportName,
            action: 'duplicate',
            filter_complexity_bucket: analytics.bucketFilterComplexity(0),
          });
        }
        return result;
      },
      deleteFilter: async (
        ...args: Parameters<typeof savedFiltersHook.deleteFilter>
      ) => {
        const toDelete = savedFiltersHook.savedFilters.find(
          (sf) => sf.id === args[0]
        );
        const result = await savedFiltersHook.deleteFilter(...args);
        if (reportName) {
          analytics.trackSavedFilterAction({
            report_name: reportName,
            action: 'delete',
            filter_complexity_bucket: analytics.bucketFilterComplexity(
              toDelete ? estimateCriteriaCount(toDelete.filterState) : 0
            ),
          });
        }
        return result;
      },
      setDefaultFilter: async (
        ...args: Parameters<typeof savedFiltersHook.setDefaultFilter>
      ) => {
        const result = await savedFiltersHook.setDefaultFilter(...args);
        if (reportName) {
          analytics.trackSavedFilterAction({
            report_name: reportName,
            action: args[0] == null ? 'clear_default' : 'set_default',
            filter_complexity_bucket: analytics.bucketFilterComplexity(0),
          });
        }
        return result;
      },
    };
  }, [estimateCriteriaCount, reportName, savedFiltersHook]);

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
    if (reportName) {
      analytics.trackSavedFilterAction({
        report_name: reportName,
        action: 'auto_apply_default',
        filter_complexity_bucket: analytics.bucketFilterComplexity(
          analytics.countActiveReportFilterCriteria(filterState, reportName)
        ),
      });
    }
    if (hadInvalidValues) {
      toast.warning(
        'Some filter values are no longer available and were skipped.'
      );
    }
  }, [
    savedFiltersHook.defaultFilter,
    savedFiltersHook.isLoading,
    searchParams,
    reportName,
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
    savedFiltersHook: trackedSavedFiltersHook,
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
