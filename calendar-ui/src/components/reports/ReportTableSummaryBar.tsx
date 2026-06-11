import { useCallback, useMemo } from 'react';

import { TableSummaryBar } from '@/components/table/TableSummaryBar';
import { useActivityTableFilterLookups } from '@/hooks/useActivityTableFilterLookups';
import { useActivityTableSummaryBarState } from '@/hooks/useActivityTableSummaryBarState';
import type { ActivityTablePreferences } from '@/hooks/useReportsTablePreferences';
import {
  buildReportClearFilterState,
  hasReportClearableFiltersActive,
} from '@/lib/report-filter-state';

export interface ReportTableSummaryBarProps {
  reportName: string;
  preferences: ActivityTablePreferences;
  setPreferences: (partial: Partial<ActivityTablePreferences>) => void;
  canSeeDeleted: boolean;
  activityCount: number;
  appliedSavedFilterName?: string | null;
  onClearSavedFilter?: () => void;
}

export function ReportTableSummaryBar({
  reportName,
  preferences,
  setPreferences,
  canSeeDeleted,
  activityCount,
  appliedSavedFilterName = null,
  onClearSavedFilter,
}: ReportTableSummaryBarProps) {
  const { pitchFieldVisibility } = useActivityTableFilterLookups(canSeeDeleted);

  const getResetFilterState = useCallback(
    () => buildReportClearFilterState(reportName),
    [reportName]
  );

  const hasClearablePanelFilters = useMemo(
    () =>
      hasReportClearableFiltersActive(
        preferences.filterState,
        reportName,
        preferences.searchKeyword,
        pitchFieldVisibility,
        { includeSearchKeyword: true }
      ),
    [
      preferences.filterState,
      preferences.searchKeyword,
      reportName,
      pitchFieldVisibility,
    ]
  );

  const summary = useActivityTableSummaryBarState({
    preferences,
    setPreferences,
    canSeeDeleted,
    getResetFilterState,
    hasClearablePanelFilters,
    onClearSavedFilter,
  });

  return (
    <TableSummaryBar
      count={activityCount}
      singularLabel={summary.singularLabel}
      pluralLabel={summary.pluralLabel}
      filters={summary.filters}
      appliedFilterTypeLabels={summary.appliedFilterTypeLabels}
      filterDetailLines={summary.filterDetailLines}
      onClearFilters={summary.onClearFilters}
      appliedSavedFilterName={appliedSavedFilterName}
    />
  );
}
