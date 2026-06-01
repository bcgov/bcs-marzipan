import { useCallback, useMemo } from 'react';

import { DEFAULT_ACTIVITY_FILTER_STATE } from '@corpcal/shared';
import type {
  BooleanFilter,
  TableSummaryFilterDetailLine,
} from '@/components/table/TableSummaryBar';
import { useActivityTableFilterLookups } from '@/hooks/useActivityTableFilterLookups';
import type { ActivityTablePreferences } from '@/hooks/useReportsTablePreferences';
import {
  buildActivityTableBooleanFilters,
  buildActivityTableFilterSummaryDetails,
  resolveEffectiveArchiveFilterVisibility,
} from '@/lib/activity-table-summary-bar-state';

export interface UseActivityTableSummaryBarStateOptions {
  preferences: ActivityTablePreferences;
  setPreferences: (partial: Partial<ActivityTablePreferences>) => void;
  canSeeDeleted: boolean;
  /** When set, toggling show completed/deleted clears the saved filter selection. */
  onClearSavedFilter?: () => void;
}

export interface ActivityTableSummaryBarState {
  filters: BooleanFilter[];
  appliedFilterTypeLabels: string[];
  filterDetailLines: TableSummaryFilterDetailLine[];
  onClearFilters: (() => void) | undefined;
  singularLabel: 'entry';
  pluralLabel: 'entries';
}

export function useActivityTableSummaryBarState({
  preferences,
  setPreferences,
  canSeeDeleted,
  onClearSavedFilter,
}: UseActivityTableSummaryBarStateOptions): ActivityTableSummaryBarState {
  const filterState = preferences.filterState;
  const searchKeyword = preferences.searchKeyword;
  const showCompleted = preferences.showCompleted;
  const showDeleted = preferences.showDeleted;

  const { pitchFieldVisibility, statusArchiveIds, filterSummaryContext } =
    useActivityTableFilterLookups(canSeeDeleted);

  const { hasStatusFilter, effectiveShowCompleted, effectiveShowDeleted } =
    resolveEffectiveArchiveFilterVisibility(
      filterState,
      statusArchiveIds,
      showCompleted,
      showDeleted,
      canSeeDeleted
    );

  const clearSavedFilterIfNeeded = useCallback(() => {
    onClearSavedFilter?.();
  }, [onClearSavedFilter]);

  const filters = useMemo(
    (): BooleanFilter[] =>
      buildActivityTableBooleanFilters({
        hasStatusFilter,
        effectiveShowCompleted,
        effectiveShowDeleted,
        canSeeDeleted,
        onShowCompletedChange: (checked) => {
          clearSavedFilterIfNeeded();
          setPreferences({ showCompleted: checked });
        },
        onShowDeletedChange: (checked) => {
          clearSavedFilterIfNeeded();
          setPreferences({ showDeleted: checked });
        },
      }),
    [
      hasStatusFilter,
      effectiveShowCompleted,
      effectiveShowDeleted,
      canSeeDeleted,
      setPreferences,
      clearSavedFilterIfNeeded,
    ]
  );

  const { appliedFilterTypeLabels, filterDetailLines, hasPanelFiltersActive } =
    useMemo(
      () =>
        buildActivityTableFilterSummaryDetails({
          filterState,
          searchKeyword,
          filterSummaryContext,
          pitchFieldVisibility,
        }),
      [filterState, searchKeyword, filterSummaryContext, pitchFieldVisibility]
    );

  const handleClearPanelFilters = useCallback(() => {
    clearSavedFilterIfNeeded();
    setPreferences({ filterState: DEFAULT_ACTIVITY_FILTER_STATE });
  }, [setPreferences, clearSavedFilterIfNeeded]);

  const onClearFilters = hasPanelFiltersActive
    ? handleClearPanelFilters
    : undefined;

  return {
    filters,
    appliedFilterTypeLabels,
    filterDetailLines,
    onClearFilters,
    singularLabel: 'entry',
    pluralLabel: 'entries',
  };
}
