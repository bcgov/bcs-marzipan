import { describe, expect, it } from 'vitest';

import { resolveThirtySixtyNinetyQueryWindow } from './resolveThirtySixtyNinetyQueryWindow';

const ANCHOR = new Date('2026-05-27T12:00:00.000Z');

describe('resolveThirtySixtyNinetyQueryWindow', () => {
  it('uses both bounds when start and end are provided', () => {
    const window = resolveThirtySixtyNinetyQueryWindow(
      {
        startDateFrom: '2026-05-01',
        startDateTo: '2026-06-30',
      },
      ANCHOR
    );

    expect(window).toEqual({
      sectionRange: { start: '2026-05-01', end: '2026-06-30' },
      queryStartDateFrom: '2026-05-01',
      queryStartDateTo: '2026-06-30',
    });
  });

  it('defaults to the three-month Pacific preset when no bounds are provided', () => {
    const window = resolveThirtySixtyNinetyQueryWindow({}, ANCHOR);

    expect(window.sectionRange).toEqual({
      start: '2026-05-01',
      end: '2026-07-31',
    });
    expect(window.queryStartDateFrom).toBe('2026-05-01');
    expect(window.queryStartDateTo).toBe('2026-07-31');
  });

  it('infers a bounded future window when only start is provided', () => {
    const window = resolveThirtySixtyNinetyQueryWindow(
      { startDateFrom: '2026-08-15' },
      ANCHOR
    );

    expect(window.queryStartDateFrom).toBe('2026-08-15');
    expect(window.queryStartDateTo).toBe('2028-08-14');
    expect(window.sectionRange).toEqual({
      start: '2026-08-15',
      end: '2028-08-14',
    });
  });

  it('infers a bounded past window when only end is provided', () => {
    const window = resolveThirtySixtyNinetyQueryWindow(
      { startDateTo: '2026-06-30' },
      ANCHOR
    );

    expect(window.queryStartDateFrom).toBe('2024-07-01');
    expect(window.queryStartDateTo).toBe('2026-06-30');
    expect(window.sectionRange).toEqual({
      start: '2024-07-01',
      end: '2026-06-30',
    });
  });

  it('clamps an over-wide explicit range, keeping start', () => {
    const window = resolveThirtySixtyNinetyQueryWindow(
      {
        startDateFrom: '2020-01-01',
        startDateTo: '2026-12-31',
      },
      ANCHOR
    );

    expect(window.sectionRange.start).toBe('2020-01-01');
    expect(window.sectionRange.end).toBe('2021-12-31');
    expect(window.queryStartDateFrom).toBe('2020-01-01');
    expect(window.queryStartDateTo).toBe('2021-12-31');
  });
});
