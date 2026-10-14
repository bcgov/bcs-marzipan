import { describe, expect, it } from 'vitest';

import {
  createDefaultGlobalHistoryDateRange,
  DEFAULT_GLOBAL_HISTORY_DAY_COUNT,
  isDefaultGlobalHistoryDateRange,
  isGlobalHistoryDateRangeActive,
} from './default-history-date-range';

describe('default-history-date-range', () => {
  const now = new Date('2026-03-20T20:00:00.000Z');

  it('creates a single-day Pacific range for today', () => {
    const range = createDefaultGlobalHistoryDateRange(now);
    expect(range.startDate).toBe('2026-03-20');
    expect(range.endDate).toBe('2026-03-20');
    expect(DEFAULT_GLOBAL_HISTORY_DAY_COUNT).toBe(1);
  });

  it('treats the default range as inactive for filter summaries', () => {
    const range = createDefaultGlobalHistoryDateRange(now);
    expect(isDefaultGlobalHistoryDateRange(range, now)).toBe(true);
    expect(isGlobalHistoryDateRangeActive(range, now)).toBe(false);
  });
});
