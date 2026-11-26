import {
  isImplicitCompletedWidenActive,
  type ActivityFilterState,
  type ActivityStatusArchiveIds,
} from '@corpcal/shared';
import { hasAnyActivityTableFilterActive } from '@/components/activity/ActivityTable/ActivityTableFilters';
import type { TableSummaryFilterDetailLine } from '@/components/table/TableSummaryBar';
import {
  buildActivityFilterSummaryLinesForDetailPopover,
  getAppliedActivityFilterTypeLabels,
  type ActivityFilterSummaryContext,
} from '@/lib/activity-filter-summary';

export function buildActivityTableFilterSummaryDetails(options: {
  filterState: ActivityFilterState;
  searchKeyword: string;
  filterSummaryContext: ActivityFilterSummaryContext;
  statusArchiveIds?: ActivityStatusArchiveIds;
}): {
  appliedFilterTypeLabels: string[];
  filterDetailLines: TableSummaryFilterDetailLine[];
  hasActiveCriteria: boolean;
} {
  const appliedFilterTypeLabels = getAppliedActivityFilterTypeLabels(
    options.filterState,
    options.searchKeyword,
    options.filterSummaryContext
  );

  const hasActiveCriteria =
    hasAnyActivityTableFilterActive(options.filterState) ||
    options.searchKeyword.trim() !== '';

  const filterDetailLines = hasActiveCriteria
    ? buildActivityFilterSummaryLinesForDetailPopover(
        options.filterState,
        options.searchKeyword,
        options.filterSummaryContext
      )
    : [];

  if (
    options.statusArchiveIds != null &&
    isImplicitCompletedWidenActive(
      options.filterState,
      options.statusArchiveIds
    )
  ) {
    filterDetailLines.push({
      label: 'Completed',
      value: 'Included for this date range',
    });
  }

  return {
    appliedFilterTypeLabels,
    filterDetailLines,
    hasActiveCriteria,
  };
}
