import { defaultLookAheadDateRange } from './look-ahead/lookAheadDateRange';
import {
  normalizeReportActivityDateRange,
  type NormalizedReportDateRange,
  type ReportDateRange,
} from './normalizeReportActivityDateRange';
import { defaultThirtySixtyNinetyDateRange } from './thirty-sixty-ninety/buildCalendarMonthSections';

/** Default bounded date window when a report type has no user or section dates. */
export function defaultReportDateRange(
  reportName: string,
  now: Date = new Date()
): ReportDateRange {
  const name = reportName.trim().toLowerCase();
  if (name === 'look-ahead' || name === 'exec') {
    return defaultLookAheadDateRange(now);
  }
  return defaultThirtySixtyNinetyDateRange(3, now);
}

export interface ResolveReportActivityDateWindowInput {
  reportName: string;
  startDateFrom?: string;
  startDateTo?: string;
  /** When set, section config dates take precedence over user query dates. */
  pinnedDateRange?: { start: string; end: string } | null;
  now?: Date;
}

/**
 * Resolves report activity query bounds with report-type defaults and the global
 * 2-year normalization policy.
 */
export function resolveReportActivityDateWindow(
  input: ResolveReportActivityDateWindowInput
): NormalizedReportDateRange {
  if (input.pinnedDateRange) {
    return normalizeReportActivityDateRange({
      startDateFrom: input.pinnedDateRange.start,
      startDateTo: input.pinnedDateRange.end,
    });
  }

  const fromRaw = input.startDateFrom?.trim();
  const toRaw = input.startDateTo?.trim();

  return normalizeReportActivityDateRange({
    startDateFrom: fromRaw || undefined,
    startDateTo: toRaw || undefined,
    defaultRange:
      fromRaw || toRaw
        ? undefined
        : defaultReportDateRange(input.reportName, input.now ?? new Date()),
  });
}
