/**
 * Timezone health check.
 *
 * Pins a small set of fixed instants and calendar boundaries to known Pacific
 * outputs. Guards against accidental regressions if `Intl` data, the
 * `Etc/GMT+7` interpretation, or our shared offset constant ever drifts.
 */

import { describe, expect, it } from 'vitest';

import {
  addCalendarDays,
  pacificCalendarDateFromInstant,
  pacificCivilToInstantMs,
} from './calendar';
import { CORP_PACIFIC_OFFSET_MS, CORP_PACIFIC_TIME_ZONE } from './constants';
import {
  formatCalendarDateShort,
  formatInstantInPacific,
  formatPacificFooterTimestamp,
} from './format';
import { toCalendarDateString } from './types';

describe('corp Pacific timezone health check', () => {
  it('CORP_PACIFIC_TIME_ZONE is the inverted-sign IANA Etc zone', () => {
    expect(CORP_PACIFIC_TIME_ZONE).toBe('Etc/GMT+7');
  });

  it('CORP_PACIFIC_OFFSET_MS represents a 7-hour negative offset', () => {
    expect(CORP_PACIFIC_OFFSET_MS).toBe(7 * 60 * 60 * 1000);
  });

  it('summer noon UTC formats as 5:00 am Pacific (no DST)', () => {
    expect(formatInstantInPacific('2026-07-01T12:00:00.000Z')).toBe(
      'Jul 1, 2026 5:00 am'
    );
  });

  it('winter noon UTC formats as 5:00 am Pacific (no DST shift)', () => {
    expect(formatInstantInPacific('2026-12-15T12:00:00.000Z')).toBe(
      'Dec 15, 2026 5:00 am'
    );
  });

  it('07:00 UTC is the exact Pacific day boundary', () => {
    expect(pacificCalendarDateFromInstant('2026-04-27T06:59:59.999Z')).toBe(
      '2026-04-26'
    );
    expect(pacificCalendarDateFromInstant('2026-04-27T07:00:00.000Z')).toBe(
      '2026-04-27'
    );
  });

  it('formatCalendarDateShort labels match the input calendar day exactly', () => {
    expect(formatCalendarDateShort(toCalendarDateString('2026-01-01'))).toBe(
      'Jan 1, 2026'
    );
    expect(formatCalendarDateShort(toCalendarDateString('2026-12-31'))).toBe(
      'Dec 31, 2026'
    );
  });

  it('addCalendarDays handles year boundaries', () => {
    expect(addCalendarDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addCalendarDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('round-trips civil time through Pacific to UTC', () => {
    const utcMs = pacificCivilToInstantMs('2026-04-27', '08:30');
    expect(utcMs).toBe(Date.UTC(2026, 3, 27, 15, 30));
    expect(formatPacificFooterTimestamp(utcMs ?? 0)).toBe(
      'Monday Apr 27, 8:30 am'
    );
  });
});
