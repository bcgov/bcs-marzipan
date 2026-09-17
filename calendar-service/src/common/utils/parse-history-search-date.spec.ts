import { describe, expect, it } from 'vitest';

import { parseMonthDaySearchToPacificDateKey } from './parse-history-search-date';

describe('parseMonthDaySearchToPacificDateKey', () => {
  it('parses month/day text into a calendar date key', () => {
    expect(
      parseMonthDaySearchToPacificDateKey(
        'Mar 20',
        new Date('2026-03-20T20:00:00.000Z')
      )
    ).toBe('2026-03-20');
  });

  it('parses month/day with explicit year', () => {
    expect(parseMonthDaySearchToPacificDateKey('March 20, 2025')).toBe(
      '2025-03-20'
    );
  });

  it('returns null for invalid month/day text', () => {
    expect(parseMonthDaySearchToPacificDateKey('Not a date')).toBeNull();
  });
});
