import { describe, expect, it } from 'vitest';

import type { DateRangeValue } from '@corpcal/shared';

import { dateRangeReachesPast } from './legacy-date-gate';

const TODAY = '2026-11-23';

function range(overrides: Partial<DateRangeValue>): DateRangeValue {
  return {
    startDate: '',
    endDate: '',
    noStartDate: false,
    noEndDate: false,
    ...overrides,
  };
}

describe('dateRangeReachesPast', () => {
  it('is false when no date range is set', () => {
    expect(dateRangeReachesPast(range({}), TODAY)).toBe(false);
  });

  it('is true when the range starts before today', () => {
    expect(
      dateRangeReachesPast(
        range({ startDate: '2020-01-01', endDate: '2020-12-31' }),
        TODAY
      )
    ).toBe(true);
  });

  it('is true when a past start runs into the future', () => {
    expect(
      dateRangeReachesPast(
        range({ startDate: '2026-01-01', endDate: '2027-01-01' }),
        TODAY
      )
    ).toBe(true);
  });

  it('is false when the range starts today or later', () => {
    expect(
      dateRangeReachesPast(
        range({ startDate: TODAY, endDate: '2027-01-01' }),
        TODAY
      )
    ).toBe(false);
  });

  it('is true when only an end date is set', () => {
    expect(dateRangeReachesPast(range({ endDate: '2020-12-31' }), TODAY)).toBe(
      true
    );
  });

  it('is true when the lower bound is open', () => {
    expect(
      dateRangeReachesPast(
        range({ noStartDate: true, endDate: '2027-01-01' }),
        TODAY
      )
    ).toBe(true);
  });
});
