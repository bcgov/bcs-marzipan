import { describe, expect, it } from 'vitest';

import {
  addCalendarDaysToIsoDate,
  computeLookAheadResetWindow,
  normalizeLookAheadResetWindowDays,
  pacificCalendarDateFromUtcMs,
} from './look-ahead-reset';

describe('pacificCalendarDateFromUtcMs', () => {
  it('maps UTC instant to Pacific fixed UTC-7 calendar date', () => {
    // 2026-04-18 06:55:00 UTC = 2026-04-17 23:55 Pacific (UTC-7)
    const utcMs = Date.UTC(2026, 3, 18, 6, 55, 0);
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
    const utcMs = Date.UTC(2026, 3, 18, 6, 55, 0);
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
