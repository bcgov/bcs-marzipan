import { describe, expect, it } from 'vitest';

import { toCalendarDateString } from '../../datetime/types';
import {
  defaultLookAheadDateRange,
  lookAheadDateRangeFromTomorrow,
  lookAheadQuickPickFromRange,
  lookAheadQuickPickRange,
  lookAheadTodayRange,
} from './lookAheadDateRange';

const ANCHOR = new Date('2026-05-28T15:00:00.000Z');
const PACIFIC_MAY_28 = toCalendarDateString('2026-05-28');

describe('lookAheadTodayRange', () => {
  it('returns Pacific today only', () => {
    expect(lookAheadTodayRange(ANCHOR)).toEqual({
      start: '2026-05-28',
      end: '2026-05-28',
    });
  });
});

describe('lookAheadDateRangeFromTomorrow', () => {
  it('returns seven inclusive days starting tomorrow in Pacific', () => {
    expect(lookAheadDateRangeFromTomorrow(7, ANCHOR)).toEqual({
      start: '2026-05-29',
      end: '2026-06-04',
    });
  });

  it('returns fourteen inclusive days starting tomorrow', () => {
    expect(lookAheadDateRangeFromTomorrow(14, ANCHOR)).toEqual({
      start: '2026-05-29',
      end: '2026-06-11',
    });
  });
});

describe('lookAheadQuickPickRange', () => {
  it('maps today, +7, and +14 quick picks', () => {
    expect(lookAheadQuickPickRange('today', ANCHOR)).toEqual({
      start: '2026-05-28',
      end: '2026-05-28',
    });
    expect(lookAheadQuickPickRange(7, ANCHOR)).toEqual({
      start: '2026-05-29',
      end: '2026-06-04',
    });
    expect(lookAheadQuickPickRange(14, ANCHOR)).toEqual({
      start: '2026-05-29',
      end: '2026-06-11',
    });
  });
});

describe('lookAheadQuickPickFromRange', () => {
  it('recognizes each quick pick for a Pacific today anchor', () => {
    expect(
      lookAheadQuickPickFromRange('2026-05-28', '2026-05-28', PACIFIC_MAY_28)
    ).toBe('today');
    expect(
      lookAheadQuickPickFromRange('2026-05-29', '2026-06-04', PACIFIC_MAY_28)
    ).toBe(7);
    expect(
      lookAheadQuickPickFromRange('2026-05-29', '2026-06-11', PACIFIC_MAY_28)
    ).toBe(14);
  });

  it('returns null for custom ranges', () => {
    expect(
      lookAheadQuickPickFromRange('2026-05-28', '2026-06-03', PACIFIC_MAY_28)
    ).toBeNull();
  });
});

describe('defaultLookAheadDateRange', () => {
  it('defaults to Pacific today only', () => {
    expect(defaultLookAheadDateRange(ANCHOR)).toEqual({
      start: '2026-05-28',
      end: '2026-05-28',
    });
  });
});
