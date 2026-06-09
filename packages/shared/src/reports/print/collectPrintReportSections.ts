import type { ReportDataResponse } from '../../api/report-data';
import type { ReportActivityRow } from '../../api/types';
import { activityReportDisplayDayKey } from '../../filters/activity-filter-date';
import { resolveLookAheadSectionRows } from '../look-ahead';
import type { ReportDateRange } from '../normalizeReportActivityDateRange';
import { compareActivitiesForPrint } from './react/rowViewModel';

/** Default when section config omits `printPerDayColumnHeaderRepeat`. */
export const DEFAULT_SHOW_PER_DAY_PRINT_CHROME = false;

export interface PrintReportSortedSection {
  id: string;
  name: string;
  printHeadingLabel: string;
  legendColor: string | null;
  showPerDayPrintChrome: boolean;
  omitReleaseColumn: boolean;
  activitiesByKey: Map<string, ReportActivityRow[]>;
}

function indexActivitiesByDay(
  activities: ReportActivityRow[],
  resolvedDateRange: ReportDateRange | null | undefined
): Map<string, ReportActivityRow[]> {
  const sorted = [...activities].sort(compareActivitiesForPrint);
  const byKey = new Map<string, ReportActivityRow[]>();
  for (const activity of sorted) {
    const key = activityReportDisplayDayKey(
      activity.startDate,
      activity.endDate,
      resolvedDateRange ?? undefined
    );
    if (!key) continue;
    const bucket = byKey.get(key);
    if (bucket) {
      bucket.push(activity);
    } else {
      byKey.set(key, [activity]);
    }
  }
  return byKey;
}

export function collectPrintReportSections(
  data: ReportDataResponse
): PrintReportSortedSection[] {
  const resolvedDateRange = data.meta?.resolvedDateRange;
  const legendColorById = new Map<string, string | null>();
  const printHeadingById = new Map<string, string>();
  const showPerDayChromeById = new Map<string, boolean>();
  const omitReleaseColumnById = new Map<string, boolean>();
  if (data.report?.config) {
    for (const row of resolveLookAheadSectionRows(data.report.config)) {
      legendColorById.set(row.sectionId, row.legendColor);
      printHeadingById.set(row.sectionId, row.reportLegendLabel);
      showPerDayChromeById.set(
        row.sectionId,
        row.printPerDayColumnHeaderRepeat ?? DEFAULT_SHOW_PER_DAY_PRINT_CHROME
      );
      omitReleaseColumnById.set(
        row.sectionId,
        row.printOmitReleaseColumn === true
      );
    }
  }
  return [...data.sections]
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      id: section.id,
      name: section.name,
      printHeadingLabel: printHeadingById.get(section.id) ?? section.name,
      legendColor: legendColorById.get(section.id) ?? null,
      showPerDayPrintChrome:
        showPerDayChromeById.get(section.id) ??
        DEFAULT_SHOW_PER_DAY_PRINT_CHROME,
      omitReleaseColumn: omitReleaseColumnById.get(section.id) ?? false,
      activitiesByKey: indexActivitiesByDay(
        section.activities,
        resolvedDateRange
      ),
    }));
}

export function printReportHasAnyActivities(
  sections: PrintReportSortedSection[]
): boolean {
  for (const section of sections) {
    if (section.activitiesByKey.size > 0) return true;
  }
  return false;
}
