import type { ActivityResponse } from '../../api/types';
import { pacificDayKey } from '../../datetime';
import type { CalendarMonthSection } from './buildCalendarMonthSections';

function compareActivitiesForMonthSection(
  a: ActivityResponse,
  b: ActivityResponse
): number {
  const dayA = pacificDayKey(a.startDate) ?? '';
  const dayB = pacificDayKey(b.startDate) ?? '';
  if (dayA !== dayB) return dayA.localeCompare(dayB);
  const ta = a.startTime ?? '';
  const tb = b.startTime ?? '';
  if (ta !== tb) return ta.localeCompare(tb);
  return (a.title ?? '').localeCompare(b.title ?? '');
}

/**
 * Buckets activities into calendar month sections by Pacific start date.
 * Activities outside a section's clipped date range or without a start date
 * are omitted.
 */
export function groupActivitiesByMonthSection(
  activities: ActivityResponse[],
  monthSections: CalendarMonthSection[]
): Map<string, ActivityResponse[]> {
  const buckets = new Map(
    monthSections.map((section) => [section.id, [] as ActivityResponse[]])
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
