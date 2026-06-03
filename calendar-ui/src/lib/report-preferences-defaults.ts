import {
  DEFAULT_ACTIVITY_FILTER_STATE,
  type DateRangeValue,
} from '@corpcal/shared';
import { defaultLookAheadDateRange } from '@corpcal/shared/reports/look-ahead';
import { getReportTypeConfigByReportName } from '@corpcal/shared/reports/reportTypeConfig';
import { defaultThirtySixtyNinetyDateRange } from '@corpcal/shared/reports/thirty-sixty-ninety';
import type { ActivityTablePreferences } from '@/lib/reportsTablePreferencesParams';

const DEFAULT_SORT_KEY = 'startDate';
const DEFAULT_SORT_DIRECTION = 'desc' as const;
const DEFAULT_PAGE_SIZE = 10;

export function buildDefaultLookAheadFilterDateRange(): DateRangeValue {
  const preset = defaultLookAheadDateRange();
  return {
    startDate: preset.start,
    endDate: preset.end,
    noStartDate: false,
    noEndDate: false,
  };
}

export function buildDefaultReportMonthFilterDateRange(): DateRangeValue {
  const preset = defaultThirtySixtyNinetyDateRange(3);
  return {
    startDate: preset.start,
    endDate: preset.end,
    noStartDate: false,
    noEndDate: false,
  };
}

export function buildDefaultFilterDateRangeForReport(
  reportName: string
): DateRangeValue {
  switch (reportName) {
    case 'look-ahead':
    case 'exec':
      return buildDefaultLookAheadFilterDateRange();
    default:
      return buildDefaultReportMonthFilterDateRange();
  }
}

/**
 * Report-type default filters for a tab the user has not customized yet.
 */
export function buildDefaultPreferencesForReport(
  reportName: string,
  _canSeeDeleted: boolean
): ActivityTablePreferences {
  const configDefaults = getReportTypeConfigByReportName(reportName)?.defaults;
  const dateRange: DateRangeValue =
    configDefaults && (configDefaults.startDate || configDefaults.endDate)
      ? {
          startDate: configDefaults.startDate ?? '',
          endDate: configDefaults.endDate ?? '',
          noStartDate: false,
          noEndDate: false,
        }
      : buildDefaultFilterDateRangeForReport(reportName);

  return {
    sortKey: DEFAULT_SORT_KEY,
    sortDirection: DEFAULT_SORT_DIRECTION,
    showCompleted: false,
    showDeleted: false,
    pageSize: DEFAULT_PAGE_SIZE,
    searchKeyword: '',
    filterState: {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      dateRange,
    },
  };
}

export function mergeActivityTablePreferences(
  prev: ActivityTablePreferences,
  partial: Partial<ActivityTablePreferences>,
  canSeeDeleted: boolean
): ActivityTablePreferences {
  return {
    ...prev,
    ...partial,
    showDeleted:
      partial.showDeleted !== undefined
        ? canSeeDeleted
          ? partial.showDeleted
          : false
        : prev.showDeleted,
    filterState:
      partial.filterState !== undefined
        ? partial.filterState
        : prev.filterState,
  };
}
