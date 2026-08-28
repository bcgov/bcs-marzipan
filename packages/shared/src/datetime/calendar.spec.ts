import { describe, expect, it } from 'vitest';

import {
  addCalendarDays,
  pacificCalendarDateFromInstant,
  pacificCalendarDayEndInstant,
  pacificCalendarDayStartInstant,
  pacificCivilToInstantMs,
  pacificDayKey,
} from './calendar';
import { toCalendarDateString } from './types';

describe('addCalendarDays', () => {
  it('adds positive days across a month boundary', () => {
    expect(addCalendarDays('2026-01-30', 5)).toBe('2026-02-04');
  });

  it('subtracts negative days across a year boundary', () => {
    expect(addCalendarDays('2026-01-02', -3)).toBe('2025-12-30');
  });

  it('handles leap day arithmetic', () => {
    expect(addCalendarDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addCalendarDays('2024-02-29', 1)).toBe('2024-03-01');
  });

  it('accepts a CalendarDateString brand', () => {
    const date = toCalendarDateString('2026-04-27');
    expect(addCalendarDays(date, 1)).toBe('2026-04-28');
  });

  it('throws on a malformed string', () => {
    expect(() => addCalendarDays('not-a-date', 1)).toThrow();
  });
});

describe('pacificCalendarDateFromInstant', () => {
  it('returns the Pacific calendar day for an instant near UTC midnight', () => {
    // 2026-04-27 06:59 UTC == 2026-04-26 23:59 Pacific (UTC-7).
    expect(pacificCalendarDateFromInstant('2026-04-27T06:59:00.000Z')).toBe(
      '2026-04-26'
    );
    // 2026-04-27 07:00 UTC == 2026-04-27 00:00 Pacific.
    expect(pacificCalendarDateFromInstant('2026-04-27T07:00:00.000Z')).toBe(
      '2026-04-27'
    );
  });

  it('accepts UTC ms numbers and Date objects', () => {
    const utcMs = Date.UTC(2026, 3, 27, 15, 30, 0);
    expect(pacificCalendarDateFromInstant(utcMs)).toBe('2026-04-27');
    expect(pacificCalendarDateFromInstant(new Date(utcMs))).toBe('2026-04-27');
  });

  it('returns null for unparseable input', () => {
    expect(pacificCalendarDateFromInstant(null)).toBeNull();
    expect(pacificCalendarDateFromInstant('not a date')).toBeNull();
    expect(pacificCalendarDateFromInstant(NaN)).toBeNull();
    expect(pacificCalendarDateFromInstant(new Date(NaN))).toBeNull();
  });
});

describe('pacificDayKey', () => {
  it('passes through a valid CalendarDateString', () => {
    expect(pacificDayKey('2026-04-27')).toBe('2026-04-27');
  });

  it('formats an instant in Pacific', () => {
    expect(pacificDayKey('2026-04-27T06:59:00.000Z')).toBe('2026-04-26');
  });

  it('returns null for null/empty', () => {
    expect(pacificDayKey(null)).toBeNull();
    expect(pacificDayKey(undefined)).toBeNull();
  });
});

describe('pacificCivilToInstantMs', () => {
  it('combines a calendar date and civil time as Pacific UTC-7', () => {
    // 2026-04-27 09:30 Pacific (UTC-7) == 2026-04-27 16:30 UTC.
    expect(pacificCivilToInstantMs('2026-04-27', '09:30')).toBe(
      Date.UTC(2026, 3, 27, 16, 30)
    );
  });

  it('accepts HH:mm:ss but ignores seconds beyond what the offset implies', () => {
    expect(pacificCivilToInstantMs('2026-04-27', '09:30:00')).toBe(
      Date.UTC(2026, 3, 27, 16, 30)
    );
  });

  it('returns null when either input is missing or invalid', () => {
    expect(pacificCivilToInstantMs(null, '09:30')).toBeNull();
    expect(pacificCivilToInstantMs('2026-04-27', null)).toBeNull();
    expect(pacificCivilToInstantMs('not-a-date', '09:30')).toBeNull();
  });
});

describe('pacificCalendarDayStartInstant', () => {
  it('returns start of Pacific calendar day in UTC', () => {
    expect(pacificCalendarDayStartInstant('2026-08-27')?.toISOString()).toBe(
      '2026-08-27T07:00:00.000Z'
    );
  });
});

describe('pacificCalendarDayEndInstant', () => {
  it('returns end of Pacific calendar day in UTC', () => {
    expect(pacificCalendarDayEndInstant('2026-08-27')?.toISOString()).toBe(
      '2026-08-28T06:59:59.999Z'
    );
  });

  it('includes late-evening Pacific instants on the same calendar day', () => {
    const end = pacificCalendarDayEndInstant('2026-08-27');
    const lateEveningPacific = new Date('2026-08-28T04:45:09.714Z');
    expect(end).not.toBeNull();
    expect(lateEveningPacific.getTime()).toBeLessThanOrEqual(end!.getTime());
  });
});
