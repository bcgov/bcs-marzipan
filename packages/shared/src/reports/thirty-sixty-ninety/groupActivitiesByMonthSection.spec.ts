import { describe, expect, it } from 'vitest';

import type { ActivityResponse } from '../../api/types';
import { buildCalendarMonthSections } from './buildCalendarMonthSections';
import { groupActivitiesByMonthSection } from './groupActivitiesByMonthSection';

function createActivity(
  id: number,
  startDate: string,
  startTime?: string
): ActivityResponse {
  return {
    id,
    displayId: `ACT-${id}`,
    title: `Activity ${id}`,
    startDate,
    startTime: startTime ?? null,
  } as ActivityResponse;
}

describe('groupActivitiesByMonthSection', () => {
  it('sorts activities within a month by start date, then time, then title', () => {
    const monthSections = buildCalendarMonthSections({
      startDate: '2026-05-01',
      endDate: '2026-05-31',
    });
    const activities = [
      createActivity(3, '2026-05-28', '09:00'),
      createActivity(1, '2026-05-01', '10:00'),
      createActivity(2, '2026-05-01', '08:00'),
    ];

    const grouped = groupActivitiesByMonthSection(activities, monthSections);
    const may = grouped.get('2026-05') ?? [];

    expect(may.map((activity) => activity.id)).toEqual([2, 1, 3]);
  });
});
