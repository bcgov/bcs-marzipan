import type { ReportDataResponse } from '@corpcal/shared/api/types';

/** Rows in the current report payload (same logic as backend `meta.activityCount`). */
export function countReportActivities(
  data: ReportDataResponse | undefined
): number {
  if (!data) return 0;
  return data.sections.reduce((n, s) => n + s.activities.length, 0);
}
