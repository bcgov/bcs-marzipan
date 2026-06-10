import type { ReportDataMeta } from '@corpcal/shared/api/types';
import {
  shouldWarnLargeReportRange,
  type NormalizedReportDateRange,
} from '@corpcal/shared/reports/reportDateRange';

export interface ReportRangeWarnings {
  showLargeRangeWarning: boolean;
  wasDateRangeClamped: boolean;
}

/** Derives clamp/large-range warnings from current filters or settled fetch meta. */
export function deriveReportRangeWarnings(options: {
  resolvedReportDateRange: NormalizedReportDateRange | null;
  dataMeta: ReportDataMeta | undefined;
  isPlaceholderData: boolean;
}): ReportRangeWarnings {
  const { resolvedReportDateRange, dataMeta, isPlaceholderData } = options;
  if (!resolvedReportDateRange) {
    return { showLargeRangeWarning: false, wasDateRangeClamped: false };
  }

  if (isPlaceholderData) {
    return {
      showLargeRangeWarning: shouldWarnLargeReportRange({
        spanDays: resolvedReportDateRange.spanDays,
      }),
      wasDateRangeClamped: resolvedReportDateRange.wasClamped ?? false,
    };
  }

  return {
    showLargeRangeWarning:
      dataMeta?.largeResultWarning ??
      shouldWarnLargeReportRange({
        spanDays: resolvedReportDateRange.spanDays,
      }),
    wasDateRangeClamped:
      dataMeta?.wasClamped ?? resolvedReportDateRange.wasClamped ?? false,
  };
}
