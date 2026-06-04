import type { ReportActivityRow } from '../../api/types';
import { pacificDayKey } from '../../datetime';
import { createCompareActivitiesForPrint } from '../print/react/rowViewModel';
import type { CalendarMonthSection } from './buildCalendarMonthSections';

const compareActivitiesForMonthSection = createCompareActivitiesForPrint({
  sortByDayKey: true,
});

/**
 * Buckets activities into calendar month sections by Pacific start date.
 * Activities outside a section's clipped date range or without a start date
 * are omitted.
 */
export function groupActivitiesByMonthSection(
  activities: ReportActivityRow[],
  monthSections: CalendarMonthSection[]
): Map<string, ReportActivityRow[]> {
  const buckets = new Map(
    monthSections.map((section) => [section.id, [] as ReportActivityRow[]])
  );
  const rangeById = new Map(
    monthSections.map((section) => [section.id, section.dateRange])
  );

  for (const activity of activities) {
    const dayKey = pacificDayKey(activity.startDate);
    if (!dayKey) continue;
    const monthId = dayKey.slice(0, 7);
    const range = rangeById.get(monthId);
    if (!range) continue;
    if (dayKey < range.start || dayKey > range.end) continue;
    buckets.get(monthId)?.push(activity);
  }

  for (const list of buckets.values()) {
    list.sort(compareActivitiesForMonthSection);
  }

  return buckets;
}
