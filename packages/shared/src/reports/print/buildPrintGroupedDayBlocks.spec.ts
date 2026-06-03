import { describe, expect, it } from 'vitest';

import { toCalendarDateString } from '../../datetime/types';
import { buildCalendarDayKeys } from './buildCalendarDayKeys';
import { buildPrintGroupedDayBlocks } from './buildPrintGroupedDayBlocks';
import { BASE_ACTIVITY } from './buildPrintGroupedDayBlocks.test-fixture';

const APR_27 = toCalendarDateString('2026-04-27');
const APR_28 = toCalendarDateString('2026-04-28');
const APR_29 = toCalendarDateString('2026-04-29');

describe('buildCalendarDayKeys', () => {
  it('returns inclusive ordered day keys', () => {
    expect(
      buildCalendarDayKeys({ startDate: '2026-04-27', endDate: '2026-04-29' })
    ).toEqual(['2026-04-27', '2026-04-28', '2026-04-29']);
  });

  it('returns a single key when start equals end', () => {
    expect(
      buildCalendarDayKeys({ startDate: '2026-04-27', endDate: '2026-04-27' })
    ).toEqual(['2026-04-27']);
  });

  it('returns empty when start is after end', () => {
    expect(
      buildCalendarDayKeys({ startDate: '2026-05-01', endDate: '2026-04-27' })
    ).toEqual([]);
  });
});

describe('buildPrintGroupedDayBlocks', () => {
  it('includes every day in range for per-day chrome with grouped empty runs', () => {
    const blocks = buildPrintGroupedDayBlocks({
      activitiesByKey: new Map([['2026-04-28', [BASE_ACTIVITY]]]),
      resolvedDateRange: { start: APR_27, end: APR_29 },
      showPerDayPrintChrome: true,
      emptyDayDisplayMode: 'grouped',
      variant: 'lookAhead',
      activityBaseUrl: 'https://example.test',
    });

    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toMatchObject({
      dayKey: '2026-04-27',
      dayHeading: 'MONDAY, APRIL 27, 2026',
      rows: [],
    });
    expect(blocks[1].rows).toHaveLength(1);
    expect(blocks[2]).toMatchObject({
      dayKey: '2026-04-29',
      dayHeading: 'WEDNESDAY, APRIL 29, 2026',
      rows: [],
    });
  });

  it('groups consecutive empty days into one block', () => {
    const blocks = buildPrintGroupedDayBlocks({
      activitiesByKey: new Map(),
      resolvedDateRange: { start: APR_27, end: APR_29 },
      showPerDayPrintChrome: true,
      emptyDayDisplayMode: 'grouped',
      variant: 'lookAhead',
      activityBaseUrl: 'https://example.test',
    });

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      dayKey: '2026-04-27..2026-04-29',
      dayHeading: 'MONDAY, APRIL 27 – WEDNESDAY, APRIL 29, 2026',
      rows: [],
    });
  });

  it('renders individual empty days when configured', () => {
    const blocks = buildPrintGroupedDayBlocks({
      activitiesByKey: new Map(),
      resolvedDateRange: { start: APR_27, end: APR_28 },
      showPerDayPrintChrome: true,
      emptyDayDisplayMode: 'individual',
      variant: 'lookAhead',
      activityBaseUrl: 'https://example.test',
    });

    expect(blocks).toHaveLength(2);
    expect(blocks[0].dayKey).toBe('2026-04-27');
    expect(blocks[1].dayKey).toBe('2026-04-28');
  });

  it('keeps activity-only days for flat rollup sections', () => {
    const blocks = buildPrintGroupedDayBlocks({
      activitiesByKey: new Map([['2026-04-28', [BASE_ACTIVITY]]]),
      resolvedDateRange: { start: APR_27, end: APR_29 },
      showPerDayPrintChrome: false,
      variant: 'lookAhead',
      activityBaseUrl: 'https://example.test',
    });

    expect(blocks).toHaveLength(1);
    expect(blocks[0].dayKey).toBe('2026-04-28');
  });
});
