import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  formatActivityEndDateTimeLabel,
  formatDateRange,
  formatExactDate,
  formatLongDate,
  formatRelativeTime,
  formatTime,
  formatTime12h,
  isSameDay,
} from './datetime-utils';

describe('formatRelativeTime', () => {
  const fixedNow = new Date('2026-01-15T12:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for date within last 60 seconds', () => {
    expect(formatRelativeTime(new Date('2026-01-15T11:59:30.000Z'))).toBe(
      'just now'
    );
  });

  it('returns "just now" for future date within 60 seconds', () => {
    expect(formatRelativeTime(new Date('2026-01-15T12:00:30.000Z'))).toBe(
      'just now'
    );
  });

  it('returns past minutes correctly', () => {
    expect(formatRelativeTime(new Date('2026-01-15T11:55:00.000Z'))).toBe(
      '5 minutes ago'
    );
    expect(formatRelativeTime(new Date('2026-01-15T11:59:00.000Z'))).toBe(
      '1 minute ago'
    );
  });

  it('returns future minutes with "in" prefix', () => {
    expect(formatRelativeTime(new Date('2026-01-15T12:05:00.000Z'))).toBe(
      'in 5 minutes'
    );
  });

  it('returns past hours correctly', () => {
    expect(formatRelativeTime(new Date('2026-01-15T10:00:00.000Z'))).toBe(
      '2 hours ago'
    );
    expect(formatRelativeTime(new Date('2026-01-15T11:00:00.000Z'))).toBe(
      '1 hour ago'
    );
  });

  it('returns future hours with "in" prefix', () => {
    expect(formatRelativeTime(new Date('2026-01-15T14:00:00.000Z'))).toBe(
      'in 2 hours'
    );
  });

  it('returns short form when options.short is true', () => {
    expect(
      formatRelativeTime(new Date('2026-01-15T11:55:00.000Z'), { short: true })
    ).toBe('5m ago');
    expect(
      formatRelativeTime(new Date('2026-01-15T12:05:00.000Z'), { short: true })
    ).toBe('in 5m');
    expect(
      formatRelativeTime(new Date('2026-01-15T10:00:00.000Z'), { short: true })
    ).toBe('2h ago');
  });
});

describe('formatLongDate', () => {
  it('formats date with long month and full year', () => {
    expect(formatLongDate(new Date(2026, 0, 23))).toBe('January 23, 2026');
  });

  it('formats another date correctly', () => {
    expect(formatLongDate(new Date(2025, 11, 1))).toBe('December 1, 2025');
  });
});

describe('formatTime', () => {
  it('formats time in 12h style', () => {
    const d = new Date(2026, 0, 15, 14, 30, 0);
    expect(formatTime(d)).toMatch(/2:30\s*PM/i);
  });

  it('formats noon as 12', () => {
    const d = new Date(2026, 0, 15, 12, 0, 0);
    expect(formatTime(d)).toMatch(/12:00\s*PM/i);
  });

  it('formats midnight as 12', () => {
    const d = new Date(2026, 0, 15, 0, 0, 0);
    expect(formatTime(d)).toMatch(/12:00\s*AM/i);
  });
});

describe('formatExactDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('includes year by default (auto), including current year', () => {
    expect(formatExactDate(new Date(2026, 0, 23))).toBe('Jan 23, 2026');
  });

  it('includes year for other years (auto)', () => {
    expect(formatExactDate(new Date(2025, 0, 23))).toBe('Jan 23, 2025');
  });

  it('includes year when includeYear is true', () => {
    expect(formatExactDate(new Date(2026, 0, 23), { includeYear: true })).toBe(
      'Jan 23, 2026'
    );
  });

  it('omits year when includeYear is false', () => {
    expect(formatExactDate(new Date(2025, 0, 23), { includeYear: false })).toBe(
      'Jan 23'
    );
  });

  it('appends time when includeTime is true', () => {
    const d = new Date(2026, 0, 23, 14, 30, 0);
    const result = formatExactDate(d, { includeTime: true, includeYear: true });
    expect(result).toMatch(/^Jan 23, 2026 at \d{1,2}:\d{2}\s*[AP]M$/i);
  });
});

describe('formatActivityEndDateTimeLabel', () => {
  it('returns null when endDate is missing', () => {
    expect(formatActivityEndDateTimeLabel(null, '14:30', false)).toBeNull();
    expect(formatActivityEndDateTimeLabel('', '14:30', false)).toBeNull();
  });

  it('formats all-day end as date only', () => {
    expect(formatActivityEndDateTimeLabel('2026-04-10', null, true)).toBe(
      'Apr 10, 2026'
    );
  });

  it('formats timed end with date and time', () => {
    const s = formatActivityEndDateTimeLabel('2026-04-10', '14:30', false);
    expect(s).toMatch(/^Apr 10, 2026 at \d{1,2}:\d{2}\s*[AP]M$/i);
  });

  it('uses date only when isAllDay is false but endTime is empty', () => {
    expect(formatActivityEndDateTimeLabel('2026-04-10', null, false)).toBe(
      'Apr 10, 2026'
    );
  });
});

describe('formatDateRange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows year once at end when same year and not current year', () => {
    expect(formatDateRange(new Date(2027, 0, 23), new Date(2027, 1, 1))).toBe(
      'Jan 23 – Feb 1, 2027'
    );
  });

  it('shows year after end date when same year (including current year)', () => {
    expect(formatDateRange(new Date(2026, 0, 23), new Date(2026, 1, 1))).toBe(
      'Jan 23 – Feb 1, 2026'
    );
  });

  it('shows both years when range spans different years', () => {
    expect(formatDateRange(new Date(2025, 11, 31), new Date(2026, 0, 1))).toBe(
      'Dec 31, 2025 – Jan 1, 2026'
    );
  });

  it('accepts ISO date strings', () => {
    expect(formatDateRange('2027-01-23', '2027-02-01')).toBe(
      'Jan 23 – Feb 1, 2027'
    );
  });
});

describe('isSameDay', () => {
  it('returns true for same calendar day', () => {
    const a = new Date(2026, 0, 23, 9, 0, 0);
    const b = new Date(2026, 0, 23, 18, 30, 0);
    expect(isSameDay(a, b)).toBe(true);
  });

  it('returns false for different days', () => {
    const a = new Date(2026, 0, 23);
    const b = new Date(2026, 0, 24);
    expect(isSameDay(a, b)).toBe(false);
  });

  it('returns false for different months', () => {
    const a = new Date(2026, 0, 31);
    const b = new Date(2026, 1, 1);
    expect(isSameDay(a, b)).toBe(false);
  });

  it('returns false for different years', () => {
    const a = new Date(2025, 11, 31);
    const b = new Date(2026, 0, 1);
    expect(isSameDay(a, b)).toBe(false);
  });
});

describe('formatTime12h', () => {
  it('returns empty string for null', () => {
    expect(formatTime12h(null)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(formatTime12h('')).toBe('');
  });

  it('formats midnight as 12:00 am', () => {
    expect(formatTime12h('00:00')).toBe('12:00 am');
  });

  it('formats noon as 12:00 pm', () => {
    expect(formatTime12h('12:00')).toBe('12:00 pm');
  });

  it('formats morning without leading zero on hour', () => {
    expect(formatTime12h('09:00')).toBe('9:00 am');
    expect(formatTime12h('01:30')).toBe('1:30 am');
  });

  it('formats afternoon times correctly', () => {
    expect(formatTime12h('14:30')).toBe('2:30 pm');
    expect(formatTime12h('13:00')).toBe('1:00 pm');
  });

  it('formats end of day', () => {
    expect(formatTime12h('23:59')).toBe('11:59 pm');
  });

  it('pads minutes to two digits', () => {
    expect(formatTime12h('09:05')).toBe('9:05 am');
    expect(formatTime12h('12:5')).toBe('12:05 pm');
  });

  it('handles single-digit hour input (e.g. 9:00)', () => {
    expect(formatTime12h('9:00')).toBe('9:00 am');
  });

  it('clamps out-of-range hour to 0-23', () => {
    expect(formatTime12h('25:00')).toBe('11:00 pm');
    expect(formatTime12h('24:00')).toBe('11:00 pm');
  });

  it('clamps out-of-range minute to 0-59', () => {
    expect(formatTime12h('12:60')).toBe('12:59 pm');
    expect(formatTime12h('12:99')).toBe('12:59 pm');
  });

  it('handles negative hour by clamping to 0', () => {
    expect(formatTime12h('-1:30')).toBe('12:30 am');
  });

  it('handles negative minute by clamping to 0', () => {
    expect(formatTime12h('14:-15')).toBe('2:00 pm');
  });

  it('handles NaN from non-numeric parts by clamping to 0', () => {
    expect(formatTime12h('ab:00')).toBe('12:00 am');
    expect(formatTime12h('12:xx')).toBe('12:00 pm');
  });
});
