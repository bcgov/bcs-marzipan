import type { ReportDataResponse } from '../../../api/report-data';
import type { ActivityResponse } from '../../../schemas/activity-response.schema';
import {
  dateKeyLocal,
  formatCoverDate,
  parseKeyToDate,
} from './dateFormatters';
import { compareActivitiesForPrint } from './rowViewModel';

interface SortedSection {
  id: string;
  name: string;
  activitiesByKey: Map<string, ActivityResponse[]>;
}

function indexActivitiesByDay(
  activities: ActivityResponse[]
): Map<string, ActivityResponse[]> {
  const sorted = [...activities].sort(compareActivitiesForPrint);
  const byKey = new Map<string, ActivityResponse[]>();
  for (const activity of sorted) {
    const key = dateKeyLocal(activity.startDate);
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

function collectSortedSections(data: ReportDataResponse): SortedSection[] {
  return [...data.sections]
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      id: section.id,
      name: section.name,
      activitiesByKey: indexActivitiesByDay(section.activities),
    }));
}

function collectDateKeys(sections: SortedSection[]): string[] {
  const keys = new Set<string>();
  for (const section of sections) {
    for (const key of section.activitiesByKey.keys()) {
      keys.add(key);
    }
  }
  return [...keys].sort();
}

/**
 * Same date span as {@link PrintReportDocument} header range, for PDF cover overlay.
 */
export function buildLookAheadCoverDateRangeLine(
  data: ReportDataResponse
): string {
  const sections = collectSortedSections(data);
  const dateKeys = collectDateKeys(sections);
  if (dateKeys.length === 0) {
    return '';
  }
  return `${formatCoverDate(parseKeyToDate(dateKeys[0]))} to ${formatCoverDate(
    parseKeyToDate(dateKeys[dateKeys.length - 1])
  )}`;
}
