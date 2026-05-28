import { describe, expect, it } from 'vitest';

import { toCalendarDateString } from '../../datetime/types';
import {
  addCalendarMonths,
  buildCalendarMonthSections,
  defaultThirtySixtyNinetyDateRange,
  firstDayOfCalendarMonth,
  lastDayOfCalendarMonth,
  thirtySixtyNinetyDateRangeFromPacificDate,
} from './buildCalendarMonthSections';

const MAY_FIRST = toCalendarDateString('2026-05-01');

describe('buildCalendarMonthSections', () => {
  it('returns one section for a single calendar month', () => {
    const sections = buildCalendarMonthSections({
      startDate: '2026-08-01',
      endDate: '2026-08-31',
    });

    expect(sections).toEqual([
      {
        id: '2026-08',
        name: 'August 2026',
        order: 1,
        dateRange: { start: '2026-08-01', end: '2026-08-31' },
      },
    ]);
  });

  it('returns three consecutive month sections for a three-month window', () => {
    const sections = buildCalendarMonthSections({
      startDate: '2026-05-01',
      endDate: '2026-07-31',
    });

    expect(sections.map((s) => s.id)).toEqual([
      '2026-05',
      '2026-06',
      '2026-07',
    ]);
    expect(sections.map((s) => s.name)).toEqual([
      'May 2026',
      'June 2026',
      'July 2026',
    ]);
  });

  it('clips the first and last month when the window starts or ends mid-month', () => {
    const sections = buildCalendarMonthSections({
      startDate: '2026-05-15',
      endDate: '2026-06-10',
    });

    expect(sections).toEqual([
      {
        id: '2026-05',
        name: 'May 2026',
        order: 1,
        dateRange: { start: '2026-05-15', end: '2026-05-31' },
      },
      {
        id: '2026-06',
        name: 'June 2026',
        order: 2,
        dateRange: { start: '2026-06-01', end: '2026-06-10' },
      },
    ]);
  });

  it('returns an empty list when start is after end', () => {
    expect(
      buildCalendarMonthSections({
        startDate: '2026-08-01',
        endDate: '2026-07-31',
      })
    ).toEqual([]);
  });
});

describe('defaultThirtySixtyNinetyDateRange', () => {
  it('anchors to the first day of the current Pacific month', () => {
    const range = defaultThirtySixtyNinetyDateRange(
      3,
      new Date('2026-05-27T12:00:00.000Z')
    );

    expect(range.start).toBe('2026-05-01');
    expect(range.end).toBe('2026-07-31');
  });

  it('supports one- and six-month presets', () => {
    const anchor = new Date('2026-05-27T12:00:00.000Z');
    expect(defaultThirtySixtyNinetyDateRange(1, anchor)).toEqual({
      start: '2026-05-01',
      end: '2026-05-31',
    });
    expect(defaultThirtySixtyNinetyDateRange(6, anchor)).toEqual({
      start: '2026-05-01',
      end: '2026-10-31',
    });
  });

  it('thirtySixtyNinetyDateRangeFromPacificDate matches default for the same Pacific day', () => {
    expect(
      thirtySixtyNinetyDateRangeFromPacificDate(
        3,
        toCalendarDateString('2026-05-27')
      )
    ).toEqual({
      start: '2026-05-01',
      end: '2026-07-31',
    });
  });
});

describe('calendar month helpers', () => {
  it('firstDayOfCalendarMonth normalises to month start', () => {
    expect(firstDayOfCalendarMonth(toCalendarDateString('2026-05-17'))).toBe(
      '2026-05-01'
    );
  });

  it('lastDayOfCalendarMonth handles month length and year rollover', () => {
    expect(lastDayOfCalendarMonth(toCalendarDateString('2026-02-01'))).toBe(
      '2026-02-28'
    );
    expect(lastDayOfCalendarMonth(toCalendarDateString('2026-12-15'))).toBe(
      '2026-12-31'
    );
  });

  it('addCalendarMonths advances by whole months from month start', () => {
    expect(addCalendarMonths(MAY_FIRST, 1)).toBe('2026-06-01');
    expect(addCalendarMonths(MAY_FIRST, 8)).toBe('2027-01-01');
  });
});
