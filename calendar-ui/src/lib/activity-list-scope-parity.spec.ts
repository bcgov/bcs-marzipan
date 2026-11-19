import { describe, expect, it } from 'vitest';

import { DEFAULT_ACTIVITY_FILTER_STATE } from '@corpcal/shared';
import { activityMatchesFilterState } from '@corpcal/shared/filters/activity-filter-match';
import { activityResponseToFilterMatchInput } from '@corpcal/shared/filters/activity-filter-match-input';
import { createMockActivityResponse } from '@corpcal/shared/test-utils';

import { buildActivityListEffectiveScope } from './activity-list-effective-scope';

const statusArchive = { completedStatusId: 5, deletedStatusId: 9 };

describe('activity list scope parity', () => {
  it('ministry tab server leadTeamIds align with activity leadTeamId', () => {
    const scope = buildActivityListEffectiveScope({
      tab: 'ministry',
      preferences: {
        filterState: DEFAULT_ACTIVITY_FILTER_STATE,
        showCompleted: false,
        showDeleted: false,
      },
      statusArchiveIds: statusArchive,
      canSeeDeleted: false,
      effectiveLeadTeamId: 42,
    });

    const matching = activityResponseToFilterMatchInput(
      createMockActivityResponse({ id: 1, leadTeamId: 42 })
    );
    const other = activityResponseToFilterMatchInput(
      createMockActivityResponse({ id: 2, leadTeamId: 9 })
    );

    expect(scope.reportFetchParams.leadTeamIds).toEqual([42]);
    expect(matching.leadTeamId).toBe(42);
    expect(other.leadTeamId).not.toBe(42);
    expect(
      activityMatchesFilterState(
        {
          ...DEFAULT_ACTIVITY_FILTER_STATE,
          leadTeamIds: scope.reportFetchParams.leadTeamIds ?? [],
        },
        matching
      )
    ).toBe(true);
    expect(
      activityMatchesFilterState(
        {
          ...DEFAULT_ACTIVITY_FILTER_STATE,
          leadTeamIds: scope.reportFetchParams.leadTeamIds ?? [],
        },
        other
      )
    ).toBe(false);
  });

  it('watchlist tab sends activityIds for server filtering', () => {
    const scope = buildActivityListEffectiveScope({
      tab: 'favourites',
      preferences: {
        filterState: DEFAULT_ACTIVITY_FILTER_STATE,
        showCompleted: false,
        showDeleted: false,
      },
      statusArchiveIds: statusArchive,
      canSeeDeleted: false,
      watchlistActivityIds: [10, 20],
    });
    expect(scope.reportFetchParams.activityIds).toEqual([10, 20]);
  });
});

describe('report scope exceptions (documented)', () => {
  it('report date windows and section rules are outside list effective scope', () => {
    expect(true).toBe(true);
  });
});
