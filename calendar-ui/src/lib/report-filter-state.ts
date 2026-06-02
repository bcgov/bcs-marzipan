import {
  DEFAULT_ACTIVITY_FILTER_STATE,
  type ActivityFilterState,
  type DateRangeValue,
} from '@corpcal/shared';
import { hasAnyActivityTableFilterActive } from '@/components/activity/ActivityTable/ActivityTableFilters';
import { buildDefaultFilterDateRangeForReport } from '@/lib/report-preferences-defaults';

/** Filter state after clearing panel filters: non-date criteria reset, baseline date preserved. */
export function buildReportClearFilterState(
  reportName: string
): ActivityFilterState {
  return {
    ...DEFAULT_ACTIVITY_FILTER_STATE,
    dateRange: buildDefaultFilterDateRangeForReport(reportName),
  };
}

export function isReportBaselineDateRange(
  dateRange: DateRangeValue,
  reportName: string
): boolean {
  const baseline = buildDefaultFilterDateRangeForReport(reportName);
  return (
    dateRange.startDate === baseline.startDate &&
    dateRange.endDate === baseline.endDate &&
    dateRange.noStartDate === baseline.noStartDate &&
    dateRange.noEndDate === baseline.noEndDate
  );
}

function hasReportNonDatePanelFiltersActive(
  filterState: ActivityFilterState,
  pitchVisibility?: {
    canViewPitchStatus: boolean;
    canViewPitchDate: boolean;
  }
): boolean {
  const cleared = {
    ...filterState,
    dateRange: {
      startDate: '',
      endDate: '',
      noStartDate: false,
      noEndDate: false,
    },
    dateConfirmedFilter: 'any' as const,
    timeConfirmedFilter: 'any' as const,
  };
  return hasAnyActivityTableFilterActive(cleared, pitchVisibility);
}

/**
 * True when the user has applied filters that "Clear filters" should remove.
 * Baseline report date windows alone do not count as clearable.
 */
export function hasReportClearableFiltersActive(
  filterState: ActivityFilterState,
  reportName: string,
  searchKeyword: string,
  pitchVisibility?: {
    canViewPitchStatus: boolean;
    canViewPitchDate: boolean;
  },
  options?: { includeSearchKeyword?: boolean }
): boolean {
  if (options?.includeSearchKeyword && searchKeyword.trim() !== '') {
    return true;
  }
  if (filterState.dateConfirmedFilter !== 'any') {
    return true;
  }
  if (filterState.timeConfirmedFilter !== 'any') {
    return true;
  }
  if (!isReportBaselineDateRange(filterState.dateRange, reportName)) {
    return true;
  }
  return hasReportNonDatePanelFiltersActive(filterState, pitchVisibility);
}

/** Resets date-related panel filters to the report baseline window. */
export function buildReportBaselineDateFilterPatch(
  reportName: string
): Pick<
  ActivityFilterState,
  'dateRange' | 'dateConfirmedFilter' | 'timeConfirmedFilter'
> {
  return {
    dateRange: buildDefaultFilterDateRangeForReport(reportName),
    dateConfirmedFilter: 'any',
    timeConfirmedFilter: 'any',
  };
}
