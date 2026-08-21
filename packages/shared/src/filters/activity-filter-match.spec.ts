import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ACTIVITY_FILTER_STATE,
  type ActivityFilterState,
} from '../activity-filter-state';
import {
  activityMatchesFilterState,
  type ActivityFilterMatchOptions,
} from './activity-filter-match';
import type { ActivityFilterMatchInput } from './activity-filter-match-input';

function makeInput(
  overrides: Partial<ActivityFilterMatchInput> = {}
): ActivityFilterMatchInput {
  return {
    id: 1,
    startDate: null,
    endDate: null,
    categoryIds: [],
    activityStatusId: 0,
    pitchRequiredStatusName: null,
    pitchDate: null,
    lookAheadStatus: null,
    lookAheadSection: null,
    dateStatusName: '',
    timeStatusName: '',
    tagIds: [],
    leadTeamId: null,
    leadMinistryId: null,
    leadOrgId: null,
    commsContactLeadUserId: null,
    eventPlannerLeadIds: [],
    translationsRequiredStatusId: null,
    translationLanguageNames: [],
    ...overrides,
  };
}

function state(overrides: Partial<ActivityFilterState>): ActivityFilterState {
  return { ...DEFAULT_ACTIVITY_FILTER_STATE, ...overrides };
}

/**
 * Fixture catalog: a spread of activities covering edge cases referenced by the
 * table-driven scenarios below. IDs are stable so scenarios can list expected
 * matches by ID.
 */
const FIXTURES: ActivityFilterMatchInput[] = [
  makeInput({
    id: 1,
    startDate: '2025-01-10',
    endDate: '2025-01-12',
    categoryIds: [1, 2],
    activityStatusId: 1,
    pitchRequiredStatusName: 'Required',
    pitchDate: '2025-02-15',
    lookAheadStatus: 'new',
    lookAheadSection: 'events',
    dateStatusName: 'Confirmed',
    timeStatusName: 'Confirmed',
    tagIds: [10, 20],
    leadTeamId: 9,
    leadMinistryId: 100,
    leadOrgId: 5,
    commsContactLeadUserId: 1000,
    eventPlannerLeadIds: [50],
    translationsRequiredStatusId: 2,
    translationLanguageNames: ['French'],
  }),
  makeInput({
    id: 2,
    startDate: '2025-01-15',
    endDate: '2025-02-05', // end outside Jan window
    categoryIds: [3],
    activityStatusId: 2,
    pitchRequiredStatusName: 'Not required',
    pitchDate: null, // not scheduled
    lookAheadStatus: 'changed',
    lookAheadSection: 'issues',
    dateStatusName: 'Tentative',
    timeStatusName: 'Tentative',
    tagIds: [20],
    leadMinistryId: 200,
    leadOrgId: 6,
    commsContactLeadUserId: 2000,
    eventPlannerLeadIds: [51],
    translationsRequiredStatusId: 1,
    translationLanguageNames: ['Spanish'],
  }),
  makeInput({
    id: 3,
    startDate: null, // missing start
    endDate: '2025-01-20',
    categoryIds: [],
    activityStatusId: 3,
    pitchRequiredStatusName: null,
    pitchDate: '2025-01-05',
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
  }),
  makeInput({
    id: 4,
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    categoryIds: [1],
    activityStatusId: 1,
    pitchRequiredStatusName: 'required', // lowercase variant
    pitchDate: '2025-03-20',
    lookAheadStatus: 'new',
    lookAheadSection: 'news',
    dateStatusName: 'confirmed', // lowercase
    timeStatusName: 'Not confirmed',
    tagIds: [30],
    leadMinistryId: 100,
    leadOrgId: 7,
    commsContactLeadUserId: 1000,
    eventPlannerLeadIds: [50, 52],
    translationsRequiredStatusId: 2,
    translationLanguageNames: ['French', 'Spanish'],
  }),
];

function matchIds(
  filterState: ActivityFilterState,
  options?: ActivityFilterMatchOptions
): number[] {
  return FIXTURES.filter((f) =>
    activityMatchesFilterState(filterState, f, options)
  ).map((f) => f.id);
}

describe('activityMatchesFilterState', () => {
  it('matches everything for the default (empty) filter state', () => {
    expect(matchIds(DEFAULT_ACTIVITY_FILTER_STATE)).toEqual([1, 2, 3, 4]);
  });

  describe('scheduled date range (span must overlap window)', () => {
    it('excludes disjoint activities and those with a missing bound', () => {
      expect(
        matchIds(
          state({
            dateRange: {
              startDate: '2025-01-01',
              endDate: '2025-01-31',
              noStartDate: false,
              noEndDate: false,
            },
          })
        )
      ).toEqual([1, 2, 4]); // 3 missing start; 2 spans into Feb but overlaps Jan
    });

    it('honors noStartDate (open lower bound)', () => {
      expect(
        matchIds(
          state({
            dateRange: {
              startDate: '',
              endDate: '2025-01-31',
              noStartDate: true,
              noEndDate: false,
            },
          })
        )
      ).toEqual([1, 2, 4]); // 3 missing start
    });
  });

  describe('category (OR within)', () => {
    it('matches any selected category', () => {
      expect(matchIds(state({ categoryIds: [1, 3] }))).toEqual([1, 2, 4]);
    });
  });

  describe('activity status (OR within)', () => {
    it('matches selected status IDs', () => {
      expect(matchIds(state({ activityStatusIds: [1, 3] }))).toEqual([1, 3, 4]);
    });
  });

  describe('pitch required status (case-insensitive)', () => {
    it('matches selected names and excludes null status', () => {
      expect(
        matchIds(state({ pitchRequiredStatusNames: ['Required'] }))
      ).toEqual([1, 4]);
    });
  });

  describe('pitch date', () => {
    it('not_scheduled keeps only activities without a pitch date', () => {
      expect(
        matchIds(state({ pitchDateFilter: { kind: 'not_scheduled' } }))
      ).toEqual([2]);
    });

    it('scheduled with range keeps pitch dates in window', () => {
      expect(
        matchIds(
          state({
            pitchDateFilter: {
              kind: 'scheduled',
              dateRange: {
                startDate: '2025-02-01',
                endDate: '2025-02-28',
                noStartDate: false,
                noEndDate: false,
              },
            },
          })
        )
      ).toEqual([1]);
    });

    it('scheduled with empty range keeps any activity with a pitch date', () => {
      expect(
        matchIds(
          state({
            pitchDateFilter: {
              kind: 'scheduled',
              dateRange: {
                startDate: '',
                endDate: '',
                noStartDate: false,
                noEndDate: false,
              },
            },
          })
        )
      ).toEqual([1, 3, 4]);
    });
  });

  describe('look ahead', () => {
    it('filters by status (OR within)', () => {
      expect(matchIds(state({ lookAheadStatusValues: ['new'] }))).toEqual([
        1, 4,
      ]);
    });

    it('filters by section', () => {
      expect(
        matchIds(state({ lookAheadSectionValues: ['events', 'news'] }))
      ).toEqual([1, 4]);
    });

    it('combines status and section with AND', () => {
      expect(
        matchIds(
          state({
            lookAheadStatusValues: ['new'],
            lookAheadSectionValues: ['events'],
          })
        )
      ).toEqual([1]);
    });
  });

  describe('date / time confirmed', () => {
    it('date confirmed keeps confirmed (case-insensitive)', () => {
      expect(matchIds(state({ dateConfirmedFilter: 'confirmed' }))).toEqual([
        1, 4,
      ]);
    });

    it('time not_confirmed excludes confirmed', () => {
      expect(matchIds(state({ timeConfirmedFilter: 'not_confirmed' }))).toEqual(
        [2, 3, 4]
      );
    });
  });

  describe('tags / leads (AND across, OR within)', () => {
    it('filters by tags', () => {
      expect(matchIds(state({ tagIds: [20, 40] }))).toEqual([1, 2]);
    });

    it('filters by lead team', () => {
      expect(matchIds(state({ leadTeamIds: [9] }))).toEqual([1]);
    });

    it('ANDs across lead types', () => {
      expect(
        matchIds(state({ leadTeamIds: [9], eventPlannerLeadIds: [52] }))
      ).toEqual([]);
    });
  });

  describe('translations', () => {
    it('filters status by ID', () => {
      expect(matchIds(state({ translationRequiredStatusIds: [2] }))).toEqual([
        1, 4,
      ]);
    });

    it('filters languages via label resolver', () => {
      const options: ActivityFilterMatchOptions = {
        translationLanguageLabelById: new Map([
          [10, 'French'],
          [20, 'Spanish'],
        ]),
      };
      expect(
        matchIds(state({ translationLanguageIds: [10] }), options)
      ).toEqual([1, 4]);
    });

    it('does not exclude on language when no resolver and no IDs are available', () => {
      expect(matchIds(state({ translationLanguageIds: [10] }))).toEqual([
        1, 2, 3, 4,
      ]);
    });

    it('filters languages by direct IDs when present on the input', () => {
      const input = makeInput({ id: 9, translationLanguageIds: [99] });
      expect(
        activityMatchesFilterState(
          state({ translationLanguageIds: [99] }),
          input
        )
      ).toBe(true);
      expect(
        activityMatchesFilterState(
          state({ translationLanguageIds: [1] }),
          input
        )
      ).toBe(false);
    });
  });

  it('ANDs across dimensions', () => {
    expect(
      matchIds(
        state({
          categoryIds: [1],
          activityStatusIds: [1],
          lookAheadStatusValues: ['new'],
        })
      )
    ).toEqual([1, 4]);
  });
});
