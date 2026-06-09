import type { ReportActivityRow } from '../../api/types';
import { activityReportDisplayDayKey } from '../../filters/activity-filter-date';
import { createCompareActivitiesForPrint } from '../print/react/rowViewModel';
import type { CalendarMonthSection } from './buildCalendarMonthSections';

const compareActivitiesForMonthSection = createCompareActivitiesForPrint({
  sortByDayKey: true,
});

function queryRangeFromMonthSections(monthSections: CalendarMonthSection[]): {
  start: CalendarMonthSection['dateRange']['start'];
  end: CalendarMonthSection['dateRange']['end'];
} | null {
  if (monthSections.length === 0) return null;
  let start = monthSections[0].dateRange.start;
  let end = monthSections[0].dateRange.end;
  for (const section of monthSections.slice(1)) {
    if (section.dateRange.start < start) start = section.dateRange.start;
    if (section.dateRange.end > end) end = section.dateRange.end;
  }
  return { start, end };
}

/**
 * Buckets activities into calendar month sections by the first overlapping day
 * within the report query range (legacy parity: spanning events land in the
 * first month the report contains, not the activity start month when earlier).
 */
export function groupActivitiesByMonthSection(
  activities: ReportActivityRow[],
  monthSections: CalendarMonthSection[]
): Map<string, ReportActivityRow[]> {
  const buckets = new Map(
    monthSections.map((section) => [section.id, [] as ReportActivityRow[]])
  );
  const queryRange = queryRangeFromMonthSections(monthSections);
  if (queryRange == null) return buckets;

  for (const activity of activities) {
    const dayKey = activityReportDisplayDayKey(
      activity.startDate,
      activity.endDate,
      queryRange
    );
    if (!dayKey) continue;
    const monthId = dayKey.slice(0, 7);
    buckets.get(monthId)?.push(activity);
  }

  for (const list of buckets.values()) {
    list.sort(compareActivitiesForMonthSection);
  }

  return buckets;
}
