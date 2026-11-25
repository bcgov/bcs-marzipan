import { useCallback, useMemo } from 'react';

import {
  DEFAULT_ACTIVITY_FILTER_STATE,
  type ActivityFilterState,
} from '@corpcal/shared';
import type { TableSummaryFilterDetailLine } from '@/components/table/TableSummaryBar';
import { useActivityTableFilterLookups } from '@/hooks/useActivityTableFilterLookups';
import { buildActivityTableFilterSummaryDetails } from '@/lib/activity-table-summary-bar-state';
import type { ActivityTablePreferences } from '@/lib/activityTablePreferencesParams';

export interface UseActivityTableSummaryBarStateOptions {
  preferences: ActivityTablePreferences;
  setPreferences: (partial: Partial<ActivityTablePreferences>) => void;
  canViewDeleted: boolean;
  /** When set, panel clear resets to this state instead of {@link DEFAULT_ACTIVITY_FILTER_STATE}. */
  getResetFilterState?: () => ActivityFilterState;
  /** When set, overrides default panel-active detection for showing "Clear filters". */
  hasClearablePanelFilters?: boolean;
}

export interface ActivityTableSummaryBarState {
  filters: [];
  appliedFilterTypeLabels: string[];
  filterDetailLines: TableSummaryFilterDetailLine[];
  onClearFilters: (() => void) | undefined;
  singularLabel: 'activity';
  pluralLabel: 'activities';
}

export function useActivityTableSummaryBarState({
  preferences,
  setPreferences,
  canViewDeleted,
  getResetFilterState,
  hasClearablePanelFilters,
}: UseActivityTableSummaryBarStateOptions): ActivityTableSummaryBarState {
  const filterState = preferences.filterState;
  const searchKeyword = preferences.searchKeyword;

  const { statusArchiveIds, filterSummaryContext } =
    useActivityTableFilterLookups(canViewDeleted);

  const { appliedFilterTypeLabels, filterDetailLines, hasActiveCriteria } =
    useMemo(
      () =>
        buildActivityTableFilterSummaryDetails({
          filterState,
          searchKeyword,
          filterSummaryContext,
          statusArchiveIds,
        }),
      [filterState, searchKeyword, filterSummaryContext, statusArchiveIds]
    );

  const handleClearPanelFilters = useCallback(() => {
    setPreferences({
      filterState: getResetFilterState?.() ?? DEFAULT_ACTIVITY_FILTER_STATE,
      searchKeyword: '',
    });
  }, [setPreferences, getResetFilterState]);

  const showClearFilters = hasClearablePanelFilters ?? hasActiveCriteria;
  const onClearFilters = showClearFilters ? handleClearPanelFilters : undefined;

  return {
    filters: [],
    appliedFilterTypeLabels,
    filterDetailLines,
    onClearFilters,
    singularLabel: 'activity',
    pluralLabel: 'activities',
  };
}
