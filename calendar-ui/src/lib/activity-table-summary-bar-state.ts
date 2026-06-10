import type { ActivityFilterState } from '@corpcal/shared';
import { hasAnyActivityTableFilterActive } from '@/components/activity/ActivityTable/ActivityTableFilters';
import type {
  BooleanFilter,
  TableSummaryFilterDetailLine,
} from '@/components/table/TableSummaryBar';
import type {
  ActivityPitchFieldVisibility,
  ActivityStatusArchiveIds,
} from '@/hooks/useActivityTableFilterLookups';
import {
  buildActivityFilterSummaryLinesForDetailPopover,
  getAppliedActivityFilterTypeLabels,
  type ActivityFilterSummaryContext,
} from '@/lib/activity-filter-summary';

export interface EffectiveArchiveFilterVisibility {
  hasStatusFilter: boolean;
  effectiveShowCompleted: boolean;
  effectiveShowDeleted: boolean;
}

export function resolveEffectiveArchiveFilterVisibility(
  filterState: ActivityFilterState,
  statusArchiveIds: ActivityStatusArchiveIds,
  showCompleted: boolean,
  showDeleted: boolean,
  canSeeDeleted: boolean
): EffectiveArchiveFilterVisibility {
  const hasStatusFilter = filterState.activityStatusIds.length > 0;
  const statusFilterIncludesCompleted =
    statusArchiveIds.completedStatusId != null &&
    filterState.activityStatusIds.includes(statusArchiveIds.completedStatusId);
  const statusFilterIncludesDeleted =
    statusArchiveIds.deletedStatusId != null &&
    filterState.activityStatusIds.includes(statusArchiveIds.deletedStatusId);

  return {
    hasStatusFilter,
    effectiveShowCompleted: hasStatusFilter
      ? statusFilterIncludesCompleted
      : showCompleted,
    effectiveShowDeleted: hasStatusFilter
      ? statusFilterIncludesDeleted && canSeeDeleted
      : showDeleted && canSeeDeleted,
  };
}

export function buildActivityTableBooleanFilters(options: {
  hasStatusFilter: boolean;
  effectiveShowCompleted: boolean;
  effectiveShowDeleted: boolean;
  canSeeDeleted: boolean;
  onShowCompletedChange: (checked: boolean) => void;
  onShowDeletedChange: (checked: boolean) => void;
}): BooleanFilter[] {
  const disabledTooltip = options.hasStatusFilter
    ? 'Controlled by status filter'
    : undefined;
  const filters: BooleanFilter[] = [
    {
      id: 'show-completed',
      label: 'Show completed',
      checked: options.effectiveShowCompleted,
      onCheckedChange: options.onShowCompletedChange,
      disabled: options.hasStatusFilter,
      disabledTooltip,
    },
  ];
  if (options.canSeeDeleted) {
    filters.push({
      id: 'show-deleted',
      label: 'Show deleted',
      checked: options.effectiveShowDeleted,
      onCheckedChange: options.onShowDeletedChange,
      disabled: options.hasStatusFilter,
      disabledTooltip,
    });
  }
  return filters;
}

export function buildActivityTableFilterSummaryDetails(options: {
  filterState: ActivityFilterState;
  searchKeyword: string;
  filterSummaryContext: ActivityFilterSummaryContext;
  pitchFieldVisibility: ActivityPitchFieldVisibility;
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
    hasAnyActivityTableFilterActive(
      options.filterState,
      options.pitchFieldVisibility
    ) || options.searchKeyword.trim() !== '';

  const filterDetailLines = hasActiveCriteria
    ? buildActivityFilterSummaryLinesForDetailPopover(
        options.filterState,
        options.searchKeyword,
        options.filterSummaryContext
      )
    : [];

  return {
    appliedFilterTypeLabels,
    filterDetailLines,
    hasActiveCriteria,
  };
}
