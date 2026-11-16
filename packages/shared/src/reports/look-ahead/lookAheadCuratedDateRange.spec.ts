import { describe, expect, it } from 'vitest';

import { toCalendarDateString } from '../../datetime/types';
import {
  defaultLookAheadCuratedDateRange,
  lookAheadCuratedPresetFromRange,
  lookAheadCuratedPresetRange,
} from './lookAheadCuratedDateRange';

const ANCHOR = new Date('2026-05-28T15:00:00.000Z');
const PACIFIC_MAY_28 = toCalendarDateString('2026-05-28');

describe('lookAheadCuratedPresetRange', () => {
  it('maps today and inclusive presets from Pacific today', () => {
    expect(lookAheadCuratedPresetRange('today', ANCHOR)).toEqual({
      start: '2026-05-28',
      end: '2026-05-28',
    });
    expect(lookAheadCuratedPresetRange('inclusive7', ANCHOR)).toEqual({
      start: '2026-05-28',
      end: '2026-06-03',
    });
    expect(lookAheadCuratedPresetRange('inclusive14', ANCHOR)).toEqual({
      start: '2026-05-28',
      end: '2026-06-10',
    });
    expect(lookAheadCuratedPresetRange('inclusive30', ANCHOR)).toEqual({
      start: '2026-05-28',
      end: '2026-06-26',
    });
  });

  it('maps published_range starting tomorrow for seven days', () => {
    expect(lookAheadCuratedPresetRange('published_range', ANCHOR)).toEqual({
      start: '2026-05-29',
      end: '2026-06-04',
    });
  });
});

describe('lookAheadCuratedPresetFromRange', () => {
  it('recognizes curated presets', () => {
    expect(
      lookAheadCuratedPresetFromRange(
        '2026-05-28',
        '2026-05-28',
        PACIFIC_MAY_28
      )
    ).toBe('today');
    expect(
      lookAheadCuratedPresetFromRange(
        '2026-05-29',
        '2026-06-04',
        PACIFIC_MAY_28
      )
    ).toBe('published_range');
    expect(
      lookAheadCuratedPresetFromRange(
        '2026-05-28',
        '2026-06-03',
        PACIFIC_MAY_28
      )
    ).toBe('inclusive7');
  });

  it('returns null for custom ranges', () => {
    expect(
      lookAheadCuratedPresetFromRange(
        '2026-05-28',
        '2026-06-02',
        PACIFIC_MAY_28
      )
    ).toBeNull();
  });
});

describe('defaultLookAheadCuratedDateRange', () => {
  it('defaults to today', () => {
    expect(defaultLookAheadCuratedDateRange(ANCHOR)).toEqual({
      start: '2026-05-28',
      end: '2026-05-28',
    });
  });
});
