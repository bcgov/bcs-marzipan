import { describe, expect, it } from 'vitest';

import {
  formatCalendarDateCover,
  formatCalendarDateHeading,
  formatCalendarDateLong,
  formatCalendarDateRangeHeading,
  formatCalendarDateShort,
  formatCalendarDateShortNoYear,
  formatCalendarDateShortNullable,
  formatCalendarMonthYear,
  formatCivilOrInstantTime,
  formatCivilTime12h,
  formatInstantInPacific,
  formatInstantPacificDate,
  formatInstantPacificTime,
  formatLookAheadActivityDate,
  formatPacificFooterTimestamp,
} from './format';
import { toCalendarDateString, toCivilTimeString } from './types';

const APR_27 = toCalendarDateString('2026-04-27');

describe('calendar-date formatters', () => {
  it('formatCalendarDateHeading uses uppercase weekday-month-day-year', () => {
    expect(formatCalendarDateHeading(APR_27)).toBe('MONDAY, APRIL 27, 2026');
  });

  it('formatCalendarDateRangeHeading renders same-year inclusive ranges', () => {
    expect(
      formatCalendarDateRangeHeading(
        toCalendarDateString('2026-05-04'),
        toCalendarDateString('2026-05-06')
      )
    ).toBe('MONDAY, MAY 4 – WEDNESDAY, MAY 6, 2026');
  });

  it('formatCalendarDateRangeHeading collapses to a single day heading', () => {
    expect(formatCalendarDateRangeHeading(APR_27, APR_27)).toBe(
      'MONDAY, APRIL 27, 2026'
    );
  });

  it('formatCalendarDateCover renders short weekday, short month, year', () => {
    expect(formatCalendarDateCover(APR_27)).toBe('Mon, Apr 27, 2026');
  });

  it('formatCalendarDateShort renders compact cell label', () => {
    expect(formatCalendarDateShort(APR_27)).toBe('Apr 27, 2026');
  });

  it('formatCalendarDateShortNoYear omits comma and year', () => {
    expect(formatCalendarDateShortNoYear(APR_27)).toBe('Apr 27');
  });

  it('formatCalendarDateLong renders long month without weekday', () => {
    expect(formatCalendarDateLong(APR_27)).toBe('April 27, 2026');
  });

  it('formatCalendarMonthYear renders month and year only', () => {
    expect(formatCalendarMonthYear(APR_27)).toBe('April 2026');
  });

  it('formatCalendarDateShortNullable handles empty/invalid input', () => {
    expect(formatCalendarDateShortNullable(null)).toBe('');
    expect(formatCalendarDateShortNullable('')).toBe('');
    expect(formatCalendarDateShortNullable('garbage')).toBe('');
    expect(formatCalendarDateShortNullable(APR_27)).toBe('Apr 27, 2026');
  });
});

describe('formatCivilTime12h', () => {
  it.each([
    ['00:00', '12:00 am'],
    ['09:30', '9:30 am'],
    ['12:00', '12:00 pm'],
    ['14:30', '2:30 pm'],
    ['23:59', '11:59 pm'],
  ])('%s -> %s', (input, expected) => {
    expect(formatCivilTime12h(toCivilTimeString(input))).toBe(expected);
  });

  it('clamps out-of-range lenient input', () => {
    expect(formatCivilTime12h('25:00')).toBe('11:00 pm');
    expect(formatCivilTime12h('12:99')).toBe('12:59 pm');
  });

  it('returns empty for null/undefined/empty', () => {
    expect(formatCivilTime12h(null)).toBe('');
    expect(formatCivilTime12h(undefined)).toBe('');
    expect(formatCivilTime12h('')).toBe('');
  });
});

describe('instant formatters', () => {
  // 2026-04-27 15:30 UTC == 2026-04-27 08:30 Pacific (UTC-7).
  const INSTANT = '2026-04-27T15:30:00.000Z';

  it('formatInstantInPacific uses the Pacific date and lower-case am/pm', () => {
    expect(formatInstantInPacific(INSTANT)).toBe('Apr 27, 2026 8:30 am');
  });

  it('formatInstantPacificDate returns the Pacific date only', () => {
    expect(formatInstantPacificDate(INSTANT)).toBe('Apr 27, 2026');
  });

  it('formatInstantPacificTime returns the Pacific time only', () => {
    expect(formatInstantPacificTime(INSTANT)).toBe('8:30 am');
  });

  it('formatPacificFooterTimestamp omits the year', () => {
    expect(formatPacificFooterTimestamp(INSTANT)).toBe(
      'Monday Apr 27, 8:30 am'
    );
  });

  it('handles instants near the Pacific day boundary', () => {
    // 2026-04-27 06:59 UTC == 2026-04-26 23:59 Pacific.
    expect(formatInstantPacificDate('2026-04-27T06:59:00.000Z')).toBe(
      'Apr 26, 2026'
    );
  });

  it('returns empty string for unparseable input', () => {
    expect(formatInstantInPacific(null)).toBe('');
    expect(formatInstantInPacific(undefined)).toBe('');
    expect(formatInstantInPacific('garbage')).toBe('');
  });
});

describe('formatCivilOrInstantTime', () => {
  it('prefers the civil time when present', () => {
    expect(formatCivilOrInstantTime('2026-04-27T15:30:00.000Z', '09:30')).toBe(
      '9:30 am'
    );
  });

  it('falls back to the Pacific time of the instant', () => {
    expect(formatCivilOrInstantTime('2026-04-27T15:30:00.000Z', null)).toBe(
      '8:30 am'
    );
  });

  it('returns empty when both are missing', () => {
    expect(formatCivilOrInstantTime(null, null)).toBe('');
  });
});

describe('formatLookAheadActivityDate', () => {
  const REFERENCE = new Date('2026-05-21T12:00:00.000Z');

  it('formats a single date in the reference year without year', () => {
    expect(
      formatLookAheadActivityDate('2026-12-12', null, {
        referenceInstant: REFERENCE,
      })
    ).toBe('Dec 12');
  });

  it('formats a single date in another year with year', () => {
    expect(
      formatLookAheadActivityDate('2027-12-12', null, {
        referenceInstant: REFERENCE,
      })
    ).toBe('Dec 12, 2027');
  });

  it('formats a same-month range in the reference year compactly', () => {
    expect(
      formatLookAheadActivityDate('2026-01-01', '2026-01-31', {
        referenceInstant: REFERENCE,
      })
    ).toBe('Jan 1\u201331');
  });

  it('formats a same-month range in another year with year suffix', () => {
    expect(
      formatLookAheadActivityDate('2027-01-01', '2027-01-31', {
        referenceInstant: REFERENCE,
      })
    ).toBe('Jan 1\u201331, 2027');
  });

  it('formats a cross-month range in the reference year without year', () => {
    expect(
      formatLookAheadActivityDate('2026-01-31', '2026-02-02', {
        referenceInstant: REFERENCE,
      })
    ).toBe('Jan 31 \u2013 Feb 2');
  });

  it('formats a cross-month range in another year with year suffix', () => {
    expect(
      formatLookAheadActivityDate('2027-01-31', '2027-02-02', {
        referenceInstant: REFERENCE,
      })
    ).toBe('Jan 31 \u2013 Feb 2, 2027');
  });

  it('formats a cross-year range with both years', () => {
    expect(
      formatLookAheadActivityDate('2026-12-16', '2027-01-01', {
        referenceInstant: REFERENCE,
      })
    ).toBe('Dec 16, 2026 \u2013 Jan 1, 2027');
  });

  it('returns empty when start date is missing', () => {
    expect(formatLookAheadActivityDate(null, '2026-01-02')).toBe('');
  });
});
