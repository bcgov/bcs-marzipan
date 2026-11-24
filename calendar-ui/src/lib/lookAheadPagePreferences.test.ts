import { describe, expect, it } from 'vitest';

import {
  buildDefaultLookAheadPagePreferences,
  clearLookAheadCuratedFilters,
  sanitizeLookAheadPagePreferences,
} from './lookAheadPagePreferences';

describe('lookAheadPagePreferences', () => {
  it('defaults to today preset', () => {
    const prefs = buildDefaultLookAheadPagePreferences();
    expect(prefs.activeCuratedPreset).toBe('today');
    expect(prefs.execMode).toBe(false);
    expect(prefs.filterState.categoryIds).toEqual([]);
  });

  it('clearLookAheadCuratedFilters preserves date and exec mode', () => {
    const prefs = buildDefaultLookAheadPagePreferences();
    const withFilters = {
      ...prefs,
      searchKeyword: 'foo',
      filterState: {
        ...prefs.filterState,
        categoryIds: [1],
        leadTeamIds: [2],
      },
    };
    const cleared = clearLookAheadCuratedFilters(withFilters);
    expect(cleared.searchKeyword).toBe('');
    expect(cleared.filterState.categoryIds).toEqual([]);
    expect(cleared.filterState.leadTeamIds).toEqual([]);
    expect(cleared.filterState.dateRange).toEqual(
      withFilters.filterState.dateRange
    );
    expect(cleared.execMode).toBe(false);
  });

  it('sanitizeLookAheadPagePreferences clears exec mode without permission', () => {
    const prefs = {
      ...buildDefaultLookAheadPagePreferences(),
      execMode: true,
    };
    const sanitized = sanitizeLookAheadPagePreferences(prefs, {
      canExec: false,
      canUsePublishedRange: false,
    });
    expect(sanitized.execMode).toBe(false);
  });

  it('sanitizeLookAheadPagePreferences resets published preset without permission', () => {
    const prefs = buildDefaultLookAheadPagePreferences();
    const withPublished = {
      ...prefs,
      activeCuratedPreset: 'published_range' as const,
      filterState: {
        ...prefs.filterState,
        dateRange: {
          startDate: '2026-05-29',
          endDate: '2026-06-04',
          noStartDate: false,
          noEndDate: false,
        },
      },
    };
    const sanitized = sanitizeLookAheadPagePreferences(withPublished, {
      canExec: false,
      canUsePublishedRange: false,
    });
    expect(sanitized.activeCuratedPreset).toBe('today');
    expect(sanitized.filterState.dateRange.startDate).toBe(
      buildDefaultLookAheadPagePreferences().filterState.dateRange.startDate
    );
  });
});
