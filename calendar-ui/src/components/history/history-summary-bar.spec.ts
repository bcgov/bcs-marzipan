import { describe, expect, it } from 'vitest';

import {
  buildHistoryAppliedFilterTypeLabels,
  historySummaryHasClearableFilters,
} from '@/components/history/history-summary-bar';

const EMPTY_DATE_RANGE = {
  startDate: '',
  endDate: '',
  noStartDate: false,
  noEndDate: false,
};

describe('history-summary-bar', () => {
  it('builds applied filter labels from active history filters', () => {
    expect(
      buildHistoryAppliedFilterTypeLabels({
        searchQuery: 'cabinet',
        activeTab: 'mine',
        dateRange: {
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          noStartDate: false,
          noEndDate: false,
        },
        selectedActionTypes: ['updated'],
        selectedCategories: ['Media'],
        selectedLeadTeamIds: ['1'],
      })
    ).toEqual([
      'My history',
      'Search',
      'Date',
      'Update type',
      'Category',
      'Team',
    ]);
  });

  it('returns false when no filters are active', () => {
    expect(
      historySummaryHasClearableFilters({
        searchQuery: '',
        dateRange: EMPTY_DATE_RANGE,
        activeTab: 'all',
      })
    ).toBe(false);
  });
});
