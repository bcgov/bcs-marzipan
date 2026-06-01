import { TableSummaryBar } from '@/components/table/TableSummaryBar';
import { useActivityTableSummaryBarState } from '@/hooks/useActivityTableSummaryBarState';
import type { ActivityTablePreferences } from '@/hooks/useReportsTablePreferences';

export interface ReportTableSummaryBarProps {
  preferences: ActivityTablePreferences;
  setPreferences: (partial: Partial<ActivityTablePreferences>) => void;
  canSeeDeleted: boolean;
  activityCount: number;
}

export function ReportTableSummaryBar({
  preferences,
  setPreferences,
  canSeeDeleted,
  activityCount,
}: ReportTableSummaryBarProps) {
  const summary = useActivityTableSummaryBarState({
    preferences,
    setPreferences,
    canSeeDeleted,
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
    />
  );
}
