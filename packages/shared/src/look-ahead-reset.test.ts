import { describe, expect, it } from 'vitest';

import {
  addCalendarDaysToIsoDate,
  computeLookAheadResetWindow,
  computeManualLookAheadClearWindow,
  deriveLookAheadResetCronMode,
  invalidStoredLookAheadResetWindowDays,
  normalizeLookAheadResetWindowDays,
  pacificCalendarDateFromUtcMs,
  parseLookAheadResetCronEnabled,
} from './look-ahead-reset';

describe('pacificCalendarDateFromUtcMs', () => {
  it('maps UTC instant to Pacific fixed UTC-7 calendar date', () => {
    // 2026-04-18 06:45:00 UTC = 2026-04-17 23:45 Pacific (UTC-7); aligns with LOOK_AHEAD_RESET_CRON_UTC
    const utcMs = Date.UTC(2026, 3, 18, 6, 45, 0);
    expect(pacificCalendarDateFromUtcMs(utcMs)).toBe('2026-04-17');
  });
});

describe('addCalendarDaysToIsoDate', () => {
  it('adds days across month boundary', () => {
    expect(addCalendarDaysToIsoDate('2026-04-17', 7)).toBe('2026-04-24');
  });

  it('supports n=0', () => {
    expect(addCalendarDaysToIsoDate('2026-04-17', 0)).toBe('2026-04-17');
  });
});

describe('computeLookAheadResetWindow', () => {
  it('returns today through today+n for default-style n=7', () => {
    const utcMs = Date.UTC(2026, 3, 18, 6, 45, 0);
    expect(computeLookAheadResetWindow(utcMs, 7)).toEqual({
      rangeStart: '2026-04-17',
      rangeEnd: '2026-04-24',
    });
  });
});

describe('normalizeLookAheadResetWindowDays', () => {
  it('returns default for invalid', () => {
    expect(normalizeLookAheadResetWindowDays('abc')).toBe(7);
    expect(normalizeLookAheadResetWindowDays('-1')).toBe(7);
    expect(normalizeLookAheadResetWindowDays('999')).toBe(7);
  });

  it('returns parsed int in range', () => {
    expect(normalizeLookAheadResetWindowDays('0')).toBe(0);
    expect(normalizeLookAheadResetWindowDays('364')).toBe(364);
  });
});

describe('invalidStoredLookAheadResetWindowDays', () => {
  it('is false for empty or undefined', () => {
    expect(invalidStoredLookAheadResetWindowDays(undefined)).toBe(false);
    expect(invalidStoredLookAheadResetWindowDays('')).toBe(false);
  });

  it('is true when stored value is not a valid in-range integer', () => {
    expect(invalidStoredLookAheadResetWindowDays('abc')).toBe(true);
    expect(invalidStoredLookAheadResetWindowDays('-1')).toBe(true);
    expect(invalidStoredLookAheadResetWindowDays('999')).toBe(true);
  });

  it('is false for valid stored values', () => {
    expect(invalidStoredLookAheadResetWindowDays('0')).toBe(false);
    expect(invalidStoredLookAheadResetWindowDays('7')).toBe(false);
    expect(invalidStoredLookAheadResetWindowDays('364')).toBe(false);
  });
});

describe('computeManualLookAheadClearWindow', () => {
  const utcMs = Date.UTC(2026, 3, 18, 6, 45, 0);

  it('returns bounded window for scope window', () => {
    expect(
      computeManualLookAheadClearWindow(utcMs, { scope: 'window', days: 7 })
    ).toEqual({
      rangeStart: '2026-04-17',
      rangeEnd: '2026-04-24',
    });
  });

  it('returns today+ unbounded for all_future without includePast', () => {
    expect(
      computeManualLookAheadClearWindow(utcMs, { scope: 'all_future' })
    ).toEqual({
      rangeStart: '2026-04-17',
    });
  });

  it('returns null for all_future with includePast', () => {
    expect(
      computeManualLookAheadClearWindow(utcMs, {
        scope: 'all_future',
        includePast: true,
      })
    ).toBeNull();
  });
});

describe('deriveLookAheadResetCronMode', () => {
  const utcMs = Date.UTC(2026, 3, 18, 6, 45, 0);

  it('returns stopped when cron disabled', () => {
    expect(
      deriveLookAheadResetCronMode(
        { cronEnabled: false, pausedForDate: null },
        utcMs
      )
    ).toBe('stopped');
  });

  it('returns paused_today when paused date matches today Pacific', () => {
    expect(
      deriveLookAheadResetCronMode(
        { cronEnabled: true, pausedForDate: '2026-04-17' },
        utcMs
      )
    ).toBe('paused_today');
  });

  it('returns running when paused date is in the past', () => {
    expect(
      deriveLookAheadResetCronMode(
        { cronEnabled: true, pausedForDate: '2026-04-16' },
        utcMs
      )
    ).toBe('running');
  });
});

describe('parseLookAheadResetCronEnabled', () => {
  it('defaults to true', () => {
    expect(parseLookAheadResetCronEnabled(undefined)).toBe(true);
    expect(parseLookAheadResetCronEnabled('')).toBe(true);
  });

  it('returns false only for explicit false', () => {
    expect(parseLookAheadResetCronEnabled('false')).toBe(false);
    expect(parseLookAheadResetCronEnabled('true')).toBe(true);
  });
});
