import { REPORT_LARGE_RANGE_WARNING_DAYS } from './reportDateRangePolicy';

export interface LargeReportRangeWarningInput {
  spanDays: number;
}

export function shouldWarnLargeReportRange(
  input: LargeReportRangeWarningInput
): boolean {
  return input.spanDays > REPORT_LARGE_RANGE_WARNING_DAYS;
}
