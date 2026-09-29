import { describe, expect, it } from 'vitest';

import type { ActivityListItem } from '../../../schemas/activity-list-item.schema';
import { toPrintRowViewModel } from './rowViewModel';

function createActivity(
  overrides: Partial<ActivityListItem> = {}
): ActivityListItem {
  return {
    id: 1,
    title: 'Test activity',
    startDate: '2026-04-16',
    endDate: null,
    isAllDay: false,
    startTime: null,
    ...overrides,
  } as ActivityListItem;
}

describe('toPrintRowViewModel', () => {
  it('does not derive a time from a date-only start date', () => {
    const row = toPrintRowViewModel(createActivity(), {
      activityBaseUrl: 'https://calendar.example.test',
    });

    expect(row.dateTime.startTime).toBe('');
  });

  it('formats an explicitly supplied civil start time', () => {
    const row = toPrintRowViewModel(createActivity({ startTime: '17:00' }), {
      activityBaseUrl: 'https://calendar.example.test',
    });

    expect(row.dateTime.startTime).toBe('5:00 pm');
  });
});
