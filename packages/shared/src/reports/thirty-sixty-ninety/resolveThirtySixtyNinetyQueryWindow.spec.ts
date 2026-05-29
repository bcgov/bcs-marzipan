import { describe, expect, it } from 'vitest';

import {
  MAX_THIRTY_SIXTY_NINETY_DISPLAY_MONTHS,
  resolveThirtySixtyNinetyQueryWindow,
} from './resolveThirtySixtyNinetyQueryWindow';

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

  it('opens the query to the future when only start is provided', () => {
    const window = resolveThirtySixtyNinetyQueryWindow(
      { startDateFrom: '2026-08-15' },
      ANCHOR
    );

    expect(window.queryStartDateFrom).toBe('2026-08-15');
    expect(window.queryStartDateTo).toBeUndefined();
    expect(window.sectionRange.start).toBe('2026-08-15');
    expect(window.sectionRange.end).toBe('2027-01-31');
  });

  it('opens the query to the past when only end is provided', () => {
    const window = resolveThirtySixtyNinetyQueryWindow(
      { startDateTo: '2026-03-10' },
      ANCHOR
    );

    expect(window.queryStartDateFrom).toBeUndefined();
    expect(window.queryStartDateTo).toBe('2026-03-10');
    expect(window.sectionRange.end).toBe('2026-03-10');
    expect(window.sectionRange.start).toBe('2025-10-01');
  });

  it('caps open-ended section scaffolding at six months', () => {
    const startOnly = resolveThirtySixtyNinetyQueryWindow(
      { startDateFrom: '2026-01-01' },
      ANCHOR
    );
    expect(startOnly.sectionRange.end).toBe('2026-06-30');

    const endOnly = resolveThirtySixtyNinetyQueryWindow(
      { startDateTo: '2026-12-31' },
      ANCHOR
    );
    expect(endOnly.sectionRange.start).toBe('2026-07-01');

    expect(MAX_THIRTY_SIXTY_NINETY_DISPLAY_MONTHS).toBe(6);
  });
});
