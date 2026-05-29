import { describe, expect, it } from 'vitest';

import {
  defaultLookAheadDateRange,
  lookAheadDateRangeFromTomorrow,
} from './lookAheadDateRange';

describe('lookAheadDateRangeFromTomorrow', () => {
  it('returns one inclusive day starting tomorrow in Pacific', () => {
    const anchor = new Date('2026-05-28T15:00:00.000Z');
    expect(lookAheadDateRangeFromTomorrow(1, anchor)).toEqual({
      start: '2026-05-29',
      end: '2026-05-29',
    });
  });

  it('returns seven inclusive days starting tomorrow', () => {
    const anchor = new Date('2026-05-28T15:00:00.000Z');
    expect(lookAheadDateRangeFromTomorrow(7, anchor)).toEqual({
      start: '2026-05-29',
      end: '2026-06-04',
    });
  });

  it('returns fourteen inclusive days starting tomorrow', () => {
    const anchor = new Date('2026-05-28T15:00:00.000Z');
    expect(lookAheadDateRangeFromTomorrow(14, anchor)).toEqual({
      start: '2026-05-29',
      end: '2026-06-11',
    });
  });

  it('defaultLookAheadDateRange matches 7-day preset', () => {
    const anchor = new Date('2026-05-28T15:00:00.000Z');
    expect(defaultLookAheadDateRange(anchor)).toEqual(
      lookAheadDateRangeFromTomorrow(7, anchor)
    );
  });
});
