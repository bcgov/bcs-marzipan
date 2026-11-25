import { describe, expect, it } from 'vitest';

import { DEFAULT_ACTIVITY_FILTER_STATE } from '../activity-filter-state';
import {
  dateRangeOverlapsPast,
  isImplicitCompletedWidenActive,
  isNonTerminalStatusFilterOnly,
  resolveActivityArchiveQueryFlags,
  shouldShowCompletedHiddenByStatusHint,
} from './activity-archive-include';

const statusArchive = { completedStatusId: 6, deletedStatusId: 4 };

describe('dateRangeOverlapsPast', () => {
  const today = '2025-06-15';

  it('returns false when date range inactive', () => {
    expect(
      dateRangeOverlapsPast(DEFAULT_ACTIVITY_FILTER_STATE.dateRange, today)
    ).toBe(false);
  });

  it('returns true for open start bound', () => {
    expect(
      dateRangeOverlapsPast(
        {
          startDate: '',
          endDate: '2026-01-01',
          noStartDate: true,
          noEndDate: false,
        },
        today
      )
    ).toBe(true);
  });

  it('returns true when start is before today', () => {
    expect(
      dateRangeOverlapsPast(
        {
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          noStartDate: false,
          noEndDate: false,
        },
        today
      )
    ).toBe(true);
  });

  it('returns false when range starts today (future-only from today)', () => {
    expect(
      dateRangeOverlapsPast(
        {
          startDate: today,
          endDate: '2025-12-31',
          noStartDate: false,
          noEndDate: false,
        },
        today
      )
    ).toBe(false);
  });

  it('returns false for entirely future range', () => {
    expect(
      dateRangeOverlapsPast(
        {
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          noStartDate: false,
          noEndDate: false,
        },
        today
      )
    ).toBe(false);
  });
});

describe('resolveActivityArchiveQueryFlags', () => {
  const pastRange = {
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    noStartDate: false,
    noEndDate: false,
  };

  it('includes completed when past overlaps and no status filter', () => {
    expect(
      resolveActivityArchiveQueryFlags({
        filterState: {
          ...DEFAULT_ACTIVITY_FILTER_STATE,
          dateRange: pastRange,
        },
        statusArchiveIds: statusArchive,
        canViewDeleted: true,
      })
    ).toEqual({ includeCompleted: true, includeDeleted: false });
  });

  it('excludes completed by default when no past overlap', () => {
    expect(
      resolveActivityArchiveQueryFlags({
        filterState: DEFAULT_ACTIVITY_FILTER_STATE,
        statusArchiveIds: statusArchive,
        canViewDeleted: true,
      })
    ).toEqual({ includeCompleted: false, includeDeleted: false });
  });

  it('includes completed when status filter selects completed', () => {
    expect(
      resolveActivityArchiveQueryFlags({
        filterState: {
          ...DEFAULT_ACTIVITY_FILTER_STATE,
          activityStatusIds: [1, 6],
        },
        statusArchiveIds: statusArchive,
        canViewDeleted: true,
      })
    ).toEqual({ includeCompleted: true, includeDeleted: false });
  });

  it('does not widen for non-terminal status only even when past overlaps', () => {
    expect(
      resolveActivityArchiveQueryFlags({
        filterState: {
          ...DEFAULT_ACTIVITY_FILTER_STATE,
          dateRange: pastRange,
          activityStatusIds: [1, 2],
        },
        statusArchiveIds: statusArchive,
        canViewDeleted: true,
      })
    ).toEqual({ includeCompleted: false, includeDeleted: false });
  });

  it('includes deleted only when selected and user can view deleted', () => {
    expect(
      resolveActivityArchiveQueryFlags({
        filterState: {
          ...DEFAULT_ACTIVITY_FILTER_STATE,
          activityStatusIds: [4],
        },
        statusArchiveIds: statusArchive,
        canViewDeleted: true,
      })
    ).toEqual({ includeCompleted: false, includeDeleted: true });

    expect(
      resolveActivityArchiveQueryFlags({
        filterState: {
          ...DEFAULT_ACTIVITY_FILTER_STATE,
          activityStatusIds: [4],
        },
        statusArchiveIds: statusArchive,
        canViewDeleted: false,
      })
    ).toEqual({ includeCompleted: false, includeDeleted: false });
  });

  it('never includes deleted from past date alone', () => {
    expect(
      resolveActivityArchiveQueryFlags({
        filterState: {
          ...DEFAULT_ACTIVITY_FILTER_STATE,
          dateRange: pastRange,
        },
        statusArchiveIds: statusArchive,
        canViewDeleted: true,
      }).includeDeleted
    ).toBe(false);
  });
});

describe('hint and summary helpers', () => {
  const pastRange = {
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    noStartDate: false,
    noEndDate: false,
  };

  it('shouldShowCompletedHiddenByStatusHint when non-terminal + past', () => {
    expect(
      shouldShowCompletedHiddenByStatusHint(
        {
          ...DEFAULT_ACTIVITY_FILTER_STATE,
          dateRange: pastRange,
          activityStatusIds: [1],
        },
        statusArchive
      )
    ).toBe(true);
  });

  it('isImplicitCompletedWidenActive without status filter', () => {
    expect(
      isImplicitCompletedWidenActive(
        { ...DEFAULT_ACTIVITY_FILTER_STATE, dateRange: pastRange },
        statusArchive
      )
    ).toBe(true);
    expect(
      isNonTerminalStatusFilterOnly(
        {
          ...DEFAULT_ACTIVITY_FILTER_STATE,
          activityStatusIds: [2],
        },
        statusArchive
      )
    ).toBe(true);
  });
});
