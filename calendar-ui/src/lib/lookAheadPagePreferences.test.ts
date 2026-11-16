import { describe, expect, it } from 'vitest';

import {
  buildDefaultLookAheadPagePreferences,
  clearLookAheadCuratedFilters,
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
});
