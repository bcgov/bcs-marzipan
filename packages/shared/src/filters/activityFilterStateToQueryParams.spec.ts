import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ACTIVITY_FILTER_STATE,
  type ActivityFilterState,
} from '../activity-filter-state';
import { activityFilterStateToQueryParams } from './activityFilterStateToQueryParams';

describe('activityFilterStateToQueryParams', () => {
  it('maps archive toggles when no status filter', () => {
    const result = activityFilterStateToQueryParams(
      {
        filterState: DEFAULT_ACTIVITY_FILTER_STATE,
        searchKeyword: '',
        showCompleted: true,
        showDeleted: false,
      },
      { completedStatusId: 5, deletedStatusId: 9 },
      true
    );
    expect(result.includeCompleted).toBe(true);
    expect(result.includeDeleted).toBe(false);
    expect(result.activityStatusIds).toBeUndefined();
  });

  it('derives includeCompleted from status filter membership', () => {
    const result = activityFilterStateToQueryParams(
      {
        filterState: {
          ...DEFAULT_ACTIVITY_FILTER_STATE,
          activityStatusIds: [1, 5],
        },
        searchKeyword: '  briefing ',
        showCompleted: false,
        showDeleted: false,
      },
      { completedStatusId: 5, deletedStatusId: 9 },
      true
    );
    expect(result.activityStatusIds).toEqual([1, 5]);
    expect(result.includeCompleted).toBe(true);
    expect(result.includeDeleted).toBe(false);
    expect(result.search).toBeUndefined();
  });

  it('maps scheduled date range with both-dates flag', () => {
    const result = activityFilterStateToQueryParams(
      {
        filterState: {
          ...DEFAULT_ACTIVITY_FILTER_STATE,
          dateRange: {
            startDate: '2025-01-01',
            endDate: '2025-01-31',
            noStartDate: false,
            noEndDate: false,
          },
        },
        searchKeyword: '',
        showCompleted: false,
        showDeleted: false,
      },
      {},
      false
    );
    expect(result.startDateFrom).toBe('2025-01-01');
    expect(result.startDateTo).toBe('2025-01-31');
    expect(result.scheduledBothDatesInRange).toBe(true);
  });

  it('maps multi-select arrays', () => {
    const filterState: ActivityFilterState = {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      tagIds: [1, 2],
      categoryNames: ['Event', 'FYI'],
      leadMinistryIds: [10],
    };
    const result = activityFilterStateToQueryParams(
      {
        filterState,
        searchKeyword: '',
        showCompleted: false,
        showDeleted: false,
      },
      {},
      false
    );
    expect(result.tagIds).toEqual([1, 2]);
    expect(result.categoryNames).toEqual(['Event', 'FYI']);
    expect(result.leadMinistryIds).toEqual([10]);
  });

  it('maps pitch scheduled without bounds to pitchDateScheduled', () => {
    const result = activityFilterStateToQueryParams(
      {
        filterState: {
          ...DEFAULT_ACTIVITY_FILTER_STATE,
          pitchDateFilter: {
            kind: 'scheduled',
            dateRange: {
              startDate: '',
              endDate: '',
              noStartDate: false,
              noEndDate: false,
            },
          },
        },
        searchKeyword: '',
        showCompleted: false,
        showDeleted: false,
      },
      {},
      false
    );
    expect(result.pitchDateScheduled).toBe(true);
    expect(result.pitchDateFrom).toBeUndefined();
  });
});
