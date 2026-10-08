import { useCallback, useMemo } from 'react';

import {
  TableContentSummary,
  TableFilterSummary,
} from '@/components/table/TableSummaryBar';
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

export function useReportTableSummaryState({
  reportName,
  preferences,
  setPreferences,
  canSeeDeleted,
  onClearSavedFilter,
}: Omit<
  ReportTableSummaryBarProps,
  'activityCount' | 'appliedSavedFilterName'
>) {
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

  return useActivityTableSummaryBarState({
    preferences,
    setPreferences,
    canSeeDeleted,
    getResetFilterState,
    hasClearablePanelFilters,
    onClearSavedFilter,
  });
}

export function ReportTableFilterSummary({
  reportName,
  preferences,
  setPreferences,
  canSeeDeleted,
  appliedSavedFilterName = null,
  onClearSavedFilter,
}: Omit<ReportTableSummaryBarProps, 'activityCount'>) {
  const summary = useReportTableSummaryState({
    reportName,
    preferences,
    setPreferences,
    canSeeDeleted,
    onClearSavedFilter,
  });

  return (
    <TableFilterSummary
      appliedFilterTypeLabels={summary.appliedFilterTypeLabels}
      filterDetailLines={summary.filterDetailLines}
      onClearFilters={summary.onClearFilters}
      appliedSavedFilterName={appliedSavedFilterName}
    />
  );
}

export function ReportTableContentSummary({
  reportName,
  preferences,
  setPreferences,
  canSeeDeleted,
  activityCount,
  onClearSavedFilter,
}: Omit<ReportTableSummaryBarProps, 'appliedSavedFilterName'>) {
  const summary = useReportTableSummaryState({
    reportName,
    preferences,
    setPreferences,
    canSeeDeleted,
    onClearSavedFilter,
  });

  return (
    <TableContentSummary
      count={activityCount}
      singularLabel={summary.singularLabel}
      pluralLabel={summary.pluralLabel}
      filters={summary.filters}
    />
  );
}

/** @deprecated Prefer FilterSection + ReportTableFilterSummary + ContentSection + ReportTableContentSummary */
export function ReportTableSummaryBar(props: ReportTableSummaryBarProps) {
  return (
    <>
      <ReportTableFilterSummary {...props} />
      <ReportTableContentSummary {...props} />
    </>
  );
}
