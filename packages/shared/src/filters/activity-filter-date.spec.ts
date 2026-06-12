import { describe, expect, it } from 'vitest';

import type { DateRangeValue } from '../activity-filter-state';
import { toCalendarDateString } from '../datetime/types';
import {
  activityDateSpanOverlapsRange,
  activityReportDisplayDayKey,
  activityReportDisplayMonthKey,
  activityScheduledRangeOverlaps,
} from './activity-filter-date';

function range(overrides: Partial<DateRangeValue> = {}): DateRangeValue {
  return {
    startDate: '2025-06-16',
    endDate: '2025-06-24',
    noStartDate: false,
    noEndDate: false,
    ...overrides,
  };
}

describe('activityDateSpanOverlapsRange', () => {
  it('includes a span that fully contains the window', () => {
    expect(
      activityDateSpanOverlapsRange('2025-06-01', '2025-06-30', range())
    ).toBe(true);
  });

  it('includes a span fully inside the window', () => {
    expect(
      activityDateSpanOverlapsRange('2025-06-18', '2025-06-20', range())
    ).toBe(true);
  });

  it('excludes a span that ends before the window', () => {
    expect(
      activityDateSpanOverlapsRange('2025-06-01', '2025-06-15', range())
    ).toBe(false);
  });

  it('excludes a span that starts after the window', () => {
    expect(
      activityDateSpanOverlapsRange('2025-06-25', '2025-06-30', range())
    ).toBe(false);
  });

  it('treats a missing activity end as single-day', () => {
    expect(activityDateSpanOverlapsRange('2025-06-20', null, range())).toBe(
      true
    );
    expect(activityDateSpanOverlapsRange('2025-06-01', null, range())).toBe(
      false
    );
  });

  it('excludes when activity start is missing', () => {
    expect(activityDateSpanOverlapsRange(null, '2025-06-20', range())).toBe(
      false
    );
  });

  it('honors open lower bound', () => {
    expect(
      activityDateSpanOverlapsRange(
        '2025-01-15',
        '2025-02-05',
        range({
          startDate: '',
          endDate: '2025-01-31',
          noStartDate: true,
          noEndDate: false,
        })
      )
    ).toBe(true);
  });

  it('honors open upper bound', () => {
    expect(
      activityDateSpanOverlapsRange(
        '2025-06-20',
        '2025-07-10',
        range({
          startDate: '2025-06-16',
          endDate: '',
          noStartDate: false,
          noEndDate: true,
        })
      )
    ).toBe(true);
  });
});

describe('activityScheduledRangeOverlaps', () => {
  it('requires both activity dates to be set', () => {
    expect(activityScheduledRangeOverlaps(null, '2025-06-20', range())).toBe(
      false
    );
    expect(activityScheduledRangeOverlaps('2025-06-20', null, range())).toBe(
      false
    );
  });

  it('matches overlap when both dates are set', () => {
    expect(
      activityScheduledRangeOverlaps('2025-06-01', '2025-06-30', range())
    ).toBe(true);
  });
});

describe('activityReportDisplayDayKey', () => {
  const reportRange = {
    start: toCalendarDateString('2025-06-16'),
    end: toCalendarDateString('2025-06-24'),
  };

  it('returns the first in-range day for a spanning activity', () => {
    expect(
      activityReportDisplayDayKey('2025-06-01', '2025-06-30', reportRange)
    ).toBe('2025-06-16');
  });

  it('returns activity start when it is already inside the window', () => {
    expect(
      activityReportDisplayDayKey('2025-06-18', '2025-06-20', reportRange)
    ).toBe('2025-06-18');
  });

  it('returns null when there is no overlap', () => {
    expect(
      activityReportDisplayDayKey('2025-05-01', '2025-05-31', reportRange)
    ).toBeNull();
  });

  it('returns null when report range is missing', () => {
    expect(
      activityReportDisplayDayKey('2025-06-01', '2025-06-30', null)
    ).toBeNull();
  });

  it('normalizes UTC instants to Pacific calendar dates', () => {
    expect(
      activityReportDisplayDayKey(
        '2026-04-27T06:59:00.000Z',
        '2026-04-27T06:59:00.000Z',
        {
          start: toCalendarDateString('2026-04-26'),
          end: toCalendarDateString('2026-04-28'),
        }
      )
    ).toBe('2026-04-26');
  });
});

describe('activityReportDisplayMonthKey', () => {
  it('returns the month of the first overlapping day', () => {
    expect(
      activityReportDisplayMonthKey('2025-05-24', '2025-07-15', {
        start: toCalendarDateString('2025-06-01'),
        end: toCalendarDateString('2025-06-30'),
      })
    ).toBe('2025-06');
  });
});
