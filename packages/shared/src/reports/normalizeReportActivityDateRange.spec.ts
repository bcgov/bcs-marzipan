import { describe, expect, it } from 'vitest';

import { toCalendarDateString } from '../datetime/types';
import { normalizeReportActivityDateRange } from './normalizeReportActivityDateRange';

const MAY_FIRST = toCalendarDateString('2026-05-01');
const JULY_LAST = toCalendarDateString('2026-07-31');

describe('normalizeReportActivityDateRange', () => {
  it('passes through both bounds when within max span', () => {
    expect(
      normalizeReportActivityDateRange({
        startDateFrom: '2026-01-01',
        startDateTo: '2026-06-30',
      })
    ).toEqual({
      start: '2026-01-01',
      end: '2026-06-30',
      wasClamped: false,
      inferredBound: null,
      spanDays: 181,
    });
  });

  it('infers end when only start is provided', () => {
    const result = normalizeReportActivityDateRange({
      startDateFrom: '2024-03-15',
    });

    expect(result.start).toBe('2024-03-15');
    expect(result.end).toBe('2026-03-14');
    expect(result.inferredBound).toBe('end');
    expect(result.wasClamped).toBe(false);
  });

  it('infers start when only end is provided', () => {
    const result = normalizeReportActivityDateRange({
      startDateTo: '2026-03-14',
    });

    expect(result.start).toBe('2024-03-15');
    expect(result.end).toBe('2026-03-14');
    expect(result.inferredBound).toBe('start');
    expect(result.wasClamped).toBe(false);
  });

  it('clamps when both bounds exceed max span, keeping start', () => {
    const result = normalizeReportActivityDateRange({
      startDateFrom: '2020-01-01',
      startDateTo: '2026-12-31',
    });

    expect(result.start).toBe('2020-01-01');
    expect(result.end).toBe('2021-12-31');
    expect(result.wasClamped).toBe(true);
    expect(result.inferredBound).toBe(null);
  });

  it('uses defaultRange when neither bound is provided', () => {
    const result = normalizeReportActivityDateRange({
      defaultRange: { start: MAY_FIRST, end: JULY_LAST },
    });

    expect(result.start).toBe('2026-05-01');
    expect(result.end).toBe('2026-07-31');
    expect(result.inferredBound).toBe('both');
    expect(result.wasClamped).toBe(false);
  });

  it('throws when no bounds and no defaultRange', () => {
    expect(() => normalizeReportActivityDateRange({})).toThrow(
      /requires at least one date bound or defaultRange/
    );
  });
});
