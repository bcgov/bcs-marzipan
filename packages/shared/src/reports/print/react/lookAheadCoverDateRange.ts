import type { ReportDataResponse } from '../../../api/report-data';
import { formatCoverDate } from './dateFormatters';

/**
 * Cover/PDF overlay date span from the resolved report query window.
 */
export function buildLookAheadCoverDateRangeLine(
  data: ReportDataResponse
): string {
  const range = data.meta?.resolvedDateRange;
  if (range?.start && range?.end) {
    return `${formatCoverDate(range.start)} to ${formatCoverDate(range.end)}`;
  }
  return '';
}
