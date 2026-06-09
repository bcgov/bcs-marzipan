import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ACTIVITY_FILTER_STATE,
  type ActivityFilterState,
} from '../activity-filter-state';
import { activityMatchesFilterState } from './activity-filter-match';
import type { ActivityFilterMatchInput } from './activity-filter-match-input';
import { activityFilterStateToQueryParams } from './activityFilterStateToQueryParams';

function makeMatchInput(
  overrides: Partial<ActivityFilterMatchInput> = {}
): ActivityFilterMatchInput {
  return {
    id: 1,
    startDate: null,
    endDate: null,
    categoryNames: [],
    activityStatusId: 0,
    pitchRequiredStatusName: null,
    pitchDate: null,
    lookAheadStatus: null,
    lookAheadSection: null,
    dateStatusName: '',
    timeStatusName: '',
    tagIds: [],
    leadMinistryId: null,
    leadOrgId: null,
    commsContactLeadUserId: null,
    eventPlannerLeadIds: [],
    translationsRequiredStatusId: null,
    translationLanguageNames: [],
    ...overrides,
  };
}

/**
 * Documents expected server query mapping for parity with
 * calendar-ui filterActivityRowsByFilters scenarios.
 */
describe('activityFilterStateToQueryParams parity mapping', () => {
  it('maps category and tag filters to array query params', () => {
    const filterState: ActivityFilterState = {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      categoryNames: ['Event', 'FYI'],
      tagIds: [1, 2],
      activityStatusIds: [1, 3],
    };
    const params = activityFilterStateToQueryParams(
      {
        filterState,
        showCompleted: false,
        showDeleted: false,
      },
      { completedStatusId: 5, deletedStatusId: 9 },
      false
    );
    expect(params.categoryNames).toEqual(['Event', 'FYI']);
    expect(params.tagIds).toEqual([1, 2]);
    expect(params.activityStatusIds).toEqual([1, 3]);
    expect(params.includeCompleted).toBe(false);
    expect(params.includeDeleted).toBe(false);
  });

  it('maps comms and ministry multi-selects', () => {
    const filterState: ActivityFilterState = {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      leadMinistryIds: [10, 20],
      commsContactLeadUserIds: [100],
      eventPlannerLeadIds: [5, 6],
    };
    const params = activityFilterStateToQueryParams(
      {
        filterState,
        showCompleted: true,
        showDeleted: false,
      },
      {},
      true
    );
    expect(params.leadMinistryIds).toEqual([10, 20]);
    expect(params.commsContactLeadUserIds).toEqual([100]);
    expect(params.eventPlannerLeadIds).toEqual([5, 6]);
    expect(params.search).toBeUndefined();
  });

  it('maps look-ahead and pitch filters', () => {
    const filterState: ActivityFilterState = {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      lookAheadStatusValues: ['new', 'changed'],
      lookAheadSectionValues: ['events'],
      pitchRequiredStatusNames: ['Required'],
      pitchDateFilter: { kind: 'not_scheduled' },
    };
    const params = activityFilterStateToQueryParams(
      {
        filterState,
        showCompleted: false,
        showDeleted: false,
      },
      {},
      false
    );
    expect(params.lookAheadStatusValues).toEqual(['new', 'changed']);
    expect(params.lookAheadSectionValues).toEqual(['events']);
    expect(params.pitchRequiredStatusNames).toEqual(['Required']);
    expect(params.pitchDateNotScheduled).toBe(true);
  });
});

/**
 * Spot-checks that the query-param mapping (Reports SQL path) and the shared
 * matcher (Activity List client path) agree on the same `ActivityFilterState`
 * for representative activities. The SQL builder remains the API owner; these
 * cases document that both layers interpret state the same way.
 */
describe('activityFilterStateToQueryParams + activityMatchesFilterState parity', () => {
  it('pitch not_scheduled maps to a param and excludes scheduled pitches', () => {
    const filterState: ActivityFilterState = {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      pitchDateFilter: { kind: 'not_scheduled' },
    };
    const params = activityFilterStateToQueryParams(
      {
        filterState,
        showCompleted: false,
        showDeleted: false,
      },
      {},
      false
    );
    expect(params.pitchDateNotScheduled).toBe(true);

    expect(
      activityMatchesFilterState(
        filterState,
        makeMatchInput({ pitchDate: null })
      )
    ).toBe(true);
    expect(
      activityMatchesFilterState(
        filterState,
        makeMatchInput({ pitchDate: '2025-02-01' })
      )
    ).toBe(false);
  });

  it('scheduled date range maps to bounds and uses span overlap', () => {
    const filterState: ActivityFilterState = {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      dateRange: {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        noStartDate: false,
        noEndDate: false,
      },
    };
    const params = activityFilterStateToQueryParams(
      {
        filterState,
        showCompleted: false,
        showDeleted: false,
      },
      {},
      false
    );
    expect(params.startDateFrom).toBe('2025-01-01');
    expect(params.startDateTo).toBe('2025-01-31');
    expect(params.scheduledDateRangeOverlaps).toBe(true);

    expect(
      activityMatchesFilterState(
        filterState,
        makeMatchInput({ startDate: '2025-01-10', endDate: '2025-01-20' })
      )
    ).toBe(true);
    expect(
      activityMatchesFilterState(
        filterState,
        makeMatchInput({ startDate: '2025-01-10', endDate: '2025-02-10' })
      )
    ).toBe(true);
    expect(
      activityMatchesFilterState(
        filterState,
        makeMatchInput({ startDate: '2025-02-01', endDate: '2025-02-10' })
      )
    ).toBe(false);
    expect(
      activityMatchesFilterState(
        filterState,
        makeMatchInput({ startDate: null, endDate: '2025-01-20' })
      )
    ).toBe(false);
  });

  it('pitch scheduled without date range maps to pitchDateScheduled', () => {
    const filterState: ActivityFilterState = {
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
    };
    const params = activityFilterStateToQueryParams(
      {
        filterState,
        showCompleted: false,
        showDeleted: false,
      },
      {},
      false
    );
    expect(params.pitchDateScheduled).toBe(true);
    expect(params.pitchDateFrom).toBeUndefined();
    expect(params.pitchDateTo).toBeUndefined();

    expect(
      activityMatchesFilterState(
        filterState,
        makeMatchInput({ pitchDate: '2025-02-01' })
      )
    ).toBe(true);
    expect(
      activityMatchesFilterState(
        filterState,
        makeMatchInput({ pitchDate: null })
      )
    ).toBe(false);
  });

  it('category maps to names and matches case-insensitively', () => {
    const filterState: ActivityFilterState = {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      categoryNames: ['Event'],
    };
    const params = activityFilterStateToQueryParams(
      {
        filterState,
        showCompleted: false,
        showDeleted: false,
      },
      {},
      false
    );
    expect(params.categoryNames).toEqual(['Event']);
    expect(
      activityMatchesFilterState(
        filterState,
        makeMatchInput({ categoryNames: ['event'] })
      )
    ).toBe(true);
    expect(
      activityMatchesFilterState(
        filterState,
        makeMatchInput({ categoryNames: ['Release'] })
      )
    ).toBe(false);
  });
});
