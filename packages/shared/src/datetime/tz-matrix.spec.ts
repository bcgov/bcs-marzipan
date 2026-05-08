/**
 * Cross-timezone invariance smoke test.
 *
 * Confirms that the corp Pacific helpers produce the same output regardless
 * of `process.env.TZ` by re-running a fixed set of assertions under several
 * Node TZ values. This catches accidental regressions where someone calls
 * `toLocale*` without an explicit `timeZone`, or builds a `Date` from
 * `YYYY-MM-DD` and reads host-local getters.
 *
 * Note: changing `process.env.TZ` after Node startup does not affect the
 * default ICU timezone - V8 reads `TZ` once at boot. We pin every formatter
 * to `Etc/GMT+7` explicitly and drive invariance via the fact that the
 * helpers do not consult host TZ at all (no naked `toLocale*`, no
 * `getFullYear`/`getMonth`/`getDate`). The matrix here therefore exercises
 * each helper twice with different `TZ` values set on `process.env` - if a
 * future change starts honouring `TZ` implicitly, this test will fail.
 */

import { afterAll, describe, expect, it } from 'vitest';

import {
  addCalendarDays,
  pacificCalendarDateFromInstant,
  pacificCivilToInstantMs,
  pacificDayKey,
} from './calendar';
import {
  formatCalendarDateCover,
  formatCalendarDateHeading,
  formatCalendarDateLong,
  formatCalendarDateShort,
  formatCivilOrInstantTime,
  formatCivilTime12h,
  formatInstantInPacific,
  formatInstantPacificDate,
  formatInstantPacificTime,
  formatPacificFooterTimestamp,
} from './format';
import { toCalendarDateString, toCivilTimeString } from './types';

const APR_27 = toCalendarDateString('2026-04-27');
const NINE_THIRTY = toCivilTimeString('09:30');
const INSTANT = '2026-04-27T15:30:00.000Z';

interface HelperOutputs {
  calendarDateHeading: string;
  calendarDateCover: string;
  calendarDateShort: string;
  calendarDateLong: string;
  civilTime12h: string;
  instantInPacific: string;
  instantPacificDate: string;
  instantPacificTime: string;
  pacificFooterTimestamp: string;
  civilOrInstantWithCivil: string;
  civilOrInstantWithoutCivil: string;
  pacificDayKeyFromCalendar: string;
  pacificDayKeyFromInstant: string;
  pacificCalendarFromInstant: string;
  addCalendarDays: string;
  pacificCivilToInstantMs: number;
}

const EXPECTED: HelperOutputs = {
  calendarDateHeading: 'MONDAY, APRIL 27, 2026',
  calendarDateCover: 'Mon, Apr 27, 2026',
  calendarDateShort: 'Apr 27, 2026',
  calendarDateLong: 'April 27, 2026',
  civilTime12h: '9:30 am',
  instantInPacific: 'Apr 27, 2026 8:30 am',
  instantPacificDate: 'Apr 27, 2026',
  instantPacificTime: '8:30 am',
  pacificFooterTimestamp: 'Monday Apr 27, 8:30 am',
  civilOrInstantWithCivil: '9:30 am',
  civilOrInstantWithoutCivil: '8:30 am',
  pacificDayKeyFromCalendar: '2026-04-27',
  pacificDayKeyFromInstant: '2026-04-26',
  pacificCalendarFromInstant: '2026-04-26',
  addCalendarDays: '2026-05-04',
  pacificCivilToInstantMs: Date.UTC(2026, 3, 27, 16, 30),
};

function runHelpers(): HelperOutputs {
  return {
    calendarDateHeading: formatCalendarDateHeading(APR_27),
    calendarDateCover: formatCalendarDateCover(APR_27),
    calendarDateShort: formatCalendarDateShort(APR_27),
    calendarDateLong: formatCalendarDateLong(APR_27),
    civilTime12h: formatCivilTime12h(NINE_THIRTY),
    instantInPacific: formatInstantInPacific(INSTANT),
    instantPacificDate: formatInstantPacificDate(INSTANT),
    instantPacificTime: formatInstantPacificTime(INSTANT),
    pacificFooterTimestamp: formatPacificFooterTimestamp(INSTANT),
    civilOrInstantWithCivil: formatCivilOrInstantTime(INSTANT, NINE_THIRTY),
    civilOrInstantWithoutCivil: formatCivilOrInstantTime(INSTANT, null),
    pacificDayKeyFromCalendar: pacificDayKey(APR_27) ?? 'NULL',
    pacificDayKeyFromInstant:
      pacificDayKey('2026-04-27T06:59:00.000Z') ?? 'NULL',
    pacificCalendarFromInstant:
      pacificCalendarDateFromInstant('2026-04-27T06:59:00.000Z') ?? 'NULL',
    addCalendarDays: addCalendarDays(APR_27, 7),
    pacificCivilToInstantMs: pacificCivilToInstantMs(APR_27, NINE_THIRTY) ?? -1,
  };
}

const ORIGINAL_TZ = process.env.TZ;

afterAll(() => {
  if (ORIGINAL_TZ === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = ORIGINAL_TZ;
  }
});

describe.each([
  ['UTC', 'UTC'],
  ['America/New_York', 'America/New_York'],
  ['America/Los_Angeles', 'America/Los_Angeles'],
  ['Asia/Tokyo', 'Asia/Tokyo'],
])('corp Pacific helpers under TZ=%s', (label, tz) => {
  it(`produces identical output (${label})`, () => {
    process.env.TZ = tz;
    expect(runHelpers()).toEqual(EXPECTED);
  });
});
