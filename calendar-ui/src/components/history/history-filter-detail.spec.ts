import { describe, expect, it } from 'vitest';

import {
  buildActivityHistoryFilterDetailLines,
  buildGlobalHistoryFilterDetailLines,
} from '@/components/history/history-filter-detail';

describe('history-filter-detail', () => {
  it('builds activity history filter detail lines', () => {
    expect(
      buildActivityHistoryFilterDetailLines({
        searchQuery: 'cabinet',
        selectedActionTypes: ['updated'],
        selectedUserIds: ['1'],
        actorFilterOptions: [{ value: '1', label: 'Alice Tester' }],
      })
    ).toEqual([
      { label: 'Search', value: 'cabinet' },
      { label: 'Type', value: 'Updated' },
      { label: 'Updated by', value: 'Alice Tester' },
    ]);
  });

  it('builds global history filter detail lines without tab scope', () => {
    expect(
      buildGlobalHistoryFilterDetailLines({
        searchQuery: 'event',
        dateRange: {
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          noStartDate: false,
          noEndDate: false,
        },
        selectedCategories: ['Media'],
        categoryOptions: [{ value: 'Media', label: 'Media' }],
      })
    ).toEqual([
      { label: 'Search', value: 'event' },
      { label: 'Date', value: 'Jan 1, 2026 – Jan 31, 2026' },
      { label: 'Category', value: 'Media' },
    ]);
  });
});
