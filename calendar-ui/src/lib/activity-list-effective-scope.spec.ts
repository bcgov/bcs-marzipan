import { describe, expect, it } from 'vitest';

import { DEFAULT_ACTIVITY_FILTER_STATE } from '@corpcal/shared';

import {
  buildActivityListEffectiveScope,
  buildActivityListTabServerScope,
  intersectIdArrays,
} from './activity-list-effective-scope';

const statusArchive = { completedStatusId: 5, deletedStatusId: 9 };

const basePreferences = {
  filterState: DEFAULT_ACTIVITY_FILTER_STATE,
};

describe('intersectIdArrays', () => {
  it('returns panel ids when tab is empty', () => {
    expect(intersectIdArrays(undefined, [1, 2])).toEqual({
      ids: [1, 2],
      emptyConflict: false,
    });
  });

  it('returns tab ids when panel is empty', () => {
    expect(intersectIdArrays([7], [])).toEqual({
      ids: [7],
      emptyConflict: false,
    });
  });

  it('flags empty conflict when intersection is empty', () => {
    expect(intersectIdArrays([1], [2])).toEqual({
      ids: [],
      emptyConflict: true,
    });
  });
});

describe('buildActivityListTabServerScope', () => {
  it('scopes ministry tab to effective lead team', () => {
    expect(
      buildActivityListTabServerScope({
        tab: 'ministry',
        userTeamIds: [],
        effectiveLeadTeamId: 42,
      })
    ).toEqual({ leadTeamIds: [42] });
  });

  it('scopes my-activities to comms contact lead user', () => {
    expect(
      buildActivityListTabServerScope({
        tab: 'my-activities',
        userId: 3,
        userTeamIds: [],
      })
    ).toEqual({ commsContactLeadUserIds: [3] });
  });
});

describe('buildActivityListEffectiveScope', () => {
  it('allows All tab with base filter params only', () => {
    const scope = buildActivityListEffectiveScope({
      tab: 'all',
      preferences: basePreferences,
      statusArchiveIds: statusArchive,
      canViewDeleted: false,
    });
    expect(scope.reportAvailability).toBe('allowed');
    expect(scope.reportFetchParams.leadTeamIds).toBeUndefined();
    expect(scope.tabContextLines).toEqual([]);
  });

  it('intersects ministry tab lead team with panel lead filter', () => {
    const scope = buildActivityListEffectiveScope({
      tab: 'ministry',
      preferences: {
        ...basePreferences,
        filterState: {
          ...DEFAULT_ACTIVITY_FILTER_STATE,
          leadTeamIds: [10, 42],
        },
      },
      statusArchiveIds: statusArchive,
      canViewDeleted: false,
      effectiveLeadTeamId: 42,
      ministryTabLabel: 'CITZ',
    });
    expect(scope.reportAvailability).toBe('allowed');
    expect(scope.reportFetchParams.leadTeamIds).toEqual([42]);
    expect(scope.tabContextLines[0]?.value).toBe('CITZ');
  });

  it('blocks reports when lead team intersection is empty', () => {
    const scope = buildActivityListEffectiveScope({
      tab: 'ministry',
      preferences: {
        ...basePreferences,
        filterState: {
          ...DEFAULT_ACTIVITY_FILTER_STATE,
          leadTeamIds: [99],
        },
      },
      statusArchiveIds: statusArchive,
      canViewDeleted: false,
      effectiveLeadTeamId: 42,
    });
    expect(scope.reportAvailability).toBe('blocked-conflict');
  });

  it('blocks reports when watchlist exceeds id limit', () => {
    const scope = buildActivityListEffectiveScope({
      tab: 'favourites',
      preferences: basePreferences,
      statusArchiveIds: statusArchive,
      canViewDeleted: false,
      watchlistActivityIds: Array.from(
        { length: 501 },
        (_, index) => index + 1
      ),
    });
    expect(scope.reportAvailability).toBe('blocked-watchlist-limit');
    expect(scope.reportFetchParams.activityIds).toBeUndefined();
  });

  it('includes activityIds on watchlist tab', () => {
    const scope = buildActivityListEffectiveScope({
      tab: 'favourites',
      preferences: basePreferences,
      statusArchiveIds: statusArchive,
      canViewDeleted: false,
      watchlistActivityIds: [1, 2, 3],
    });
    expect(scope.reportAvailability).toBe('allowed');
    expect(scope.reportFetchParams.activityIds).toEqual([1, 2, 3]);
  });

  it('preserves empty activityIds for empty watchlist', () => {
    const scope = buildActivityListEffectiveScope({
      tab: 'favourites',
      preferences: basePreferences,
      statusArchiveIds: statusArchive,
      canViewDeleted: false,
      watchlistActivityIds: [],
    });
    expect(scope.reportFetchParams.activityIds).toEqual([]);
  });
});
