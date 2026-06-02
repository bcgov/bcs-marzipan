import type { ActivityFilterState } from '@corpcal/shared';
import {
  resolveReportActivityDateWindow,
  type NormalizedReportDateRange,
} from '@corpcal/shared/reports/reportDateRange';
import type { ReportDataQueryParams } from '@corpcal/shared/schemas';
import type { ReportDataRequestParams } from '@/api/reportsApi';
import { isDateRangeActive } from '@/components/activity/ActivityTable/ScheduledDateRangeFields';

/**
 * Stable string for React Query `queryKey` so refetches track param *values*, not object identity.
 */
export function stableSerializeReportQueryParams(
  params: ReportDataRequestParams
): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
    )
  );
}

function dateRangeQueryBounds(dateRange: ActivityFilterState['dateRange']): {
  startDateFrom?: string;
  startDateTo?: string;
} {
  if (!isDateRangeActive(dateRange)) {
    return {};
  }
  const bounds: { startDateFrom?: string; startDateTo?: string } = {};
  if (!dateRange.noStartDate && dateRange.startDate !== '') {
    bounds.startDateFrom = dateRange.startDate;
  }
  if (!dateRange.noEndDate && dateRange.endDate !== '') {
    bounds.startDateTo = dateRange.endDate;
  }
  return bounds;
}

/** Mirrors server date resolution for warnings and stable query keys. */
export function resolveReportQueryDateRange(
  reportName: string,
  filterState: ActivityFilterState
): NormalizedReportDateRange {
  const bounds = dateRangeQueryBounds(filterState.dateRange);
  return resolveReportActivityDateWindow({
    reportName,
    startDateFrom: bounds.startDateFrom,
    startDateTo: bounds.startDateTo,
  });
}

export type { ReportDataQueryParams };
