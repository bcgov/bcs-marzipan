import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ACTIVITY_FILTER_STATE,
  type ActivityFilterState,
} from '../activity-filter-state';
import { activityFilterStateToQueryParams } from './activityFilterStateToQueryParams';

const pastRange = {
  startDate: '2020-01-01',
  endDate: '2020-01-31',
  noStartDate: false,
  noEndDate: false,
};

describe('activityFilterStateToQueryParams', () => {
  it('includes completed when past date range and no status filter', () => {
    const result = activityFilterStateToQueryParams(
      {
        filterState: {
          ...DEFAULT_ACTIVITY_FILTER_STATE,
          dateRange: pastRange,
        },
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
      },
      { completedStatusId: 5, deletedStatusId: 9 },
      true
    );
    expect(result.activityStatusIds).toEqual([1, 5]);
    expect(result.includeCompleted).toBe(true);
    expect(result.includeDeleted).toBe(false);
  });

  it('omits deleted status id from activityStatusIds when user cannot view deleted', () => {
    const result = activityFilterStateToQueryParams(
      {
        filterState: {
          ...DEFAULT_ACTIVITY_FILTER_STATE,
          activityStatusIds: [1, 9],
        },
      },
      { completedStatusId: 5, deletedStatusId: 9 },
      false
    );
    expect(result.activityStatusIds).toEqual([1]);
    expect(result.includeDeleted).toBe(false);
  });

  it('does not map keyword search (applied client-side or at export)', () => {
    const result = activityFilterStateToQueryParams(
      {
        filterState: DEFAULT_ACTIVITY_FILTER_STATE,
      },
      {},
      false
    );
    expect(result.search).toBeUndefined();
  });

  it('maps scheduled date range with overlap flag', () => {
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
      },
      {},
      false
    );
    expect(result.startDateFrom).toBe('2025-01-01');
    expect(result.startDateTo).toBe('2025-01-31');
    expect(result.scheduledDateRangeOverlaps).toBe(true);
  });

  it('maps multi-select arrays', () => {
    const filterState: ActivityFilterState = {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      tagIds: [1, 2],
      categoryIds: [1, 2],
      leadTeamIds: [10],
    };
    const result = activityFilterStateToQueryParams(
      {
        filterState,
      },
      {},
      false
    );
    expect(result.tagIds).toEqual([1, 2]);
    expect(result.categoryIds).toEqual([1, 2]);
    expect(result.leadTeamIds).toEqual([10]);
  });
});
