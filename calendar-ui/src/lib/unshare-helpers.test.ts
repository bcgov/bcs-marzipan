import { describe, expect, it } from 'vitest';

import { PERMISSIONS, SYSTEM_ROLES } from '@corpcal/shared';

import {
  canUserUnshareTeam,
  countActivitiesSharedWithTeam,
  getBulkUnshareVisibilityMessage,
  getUnshareableTeamsForActivity,
  getUnshareableTeamsForBulk,
  getUnshareVisibilityMessage,
  resolveUnsharePermissions,
} from './unshare-helpers';

const TEAM_LOOKUPS = [
  { id: 7, name: 'AG Comms', displayName: 'AG Comms' },
  { id: 8, name: 'Other Team', displayName: 'Other Team' },
];

describe('canUserUnshareTeam', () => {
  it('allows admin or unshare-all without team membership', () => {
    expect(canUserUnshareTeam([], 7, true, false)).toBe(true);
    expect(canUserUnshareTeam([], 7, false, true)).toBe(true);
  });

  it('requires membership for standard unshare', () => {
    expect(canUserUnshareTeam([7], 7, false, false)).toBe(true);
    expect(canUserUnshareTeam([8], 7, false, false)).toBe(false);
  });
});

describe('getUnshareableTeamsForActivity', () => {
  it('returns only shared teams the user may remove', () => {
    const teams = getUnshareableTeamsForActivity(
      { sharedWithTeamIds: [7, 8], visibility: 'global' },
      TEAM_LOOKUPS,
      [7],
      true,
      false,
      false
    );

    expect(teams).toEqual([{ id: 7, name: 'AG Comms' }]);
  });

  it('returns empty when user lacks unshare permissions', () => {
    expect(
      getUnshareableTeamsForActivity(
        { sharedWithTeamIds: [7] },
        TEAM_LOOKUPS,
        [7],
        false,
        false,
        false
      )
    ).toEqual([]);
  });
});

describe('getUnshareableTeamsForBulk', () => {
  it('unions eligible teams across the selection', () => {
    const teams = getUnshareableTeamsForBulk(
      [{ sharedWithTeamIds: [7] }, { sharedWithTeamIds: [8] }],
      TEAM_LOOKUPS,
      [7, 8],
      true,
      false,
      false
    );

    expect(teams.map((t) => t.id).sort()).toEqual([7, 8]);
  });
});

describe('countActivitiesSharedWithTeam', () => {
  it('counts activities that include the team', () => {
    expect(
      countActivitiesSharedWithTeam(
        [{ sharedWithTeamIds: [7] }, { sharedWithTeamIds: [7, 8] }, {}],
        7
      )
    ).toBe(2);
  });
});

describe('visibility messages', () => {
  it('describes team-restricted unshare', () => {
    expect(getUnshareVisibilityMessage('team')).toContain(
      'no longer see this activity'
    );
  });

  it('describes mixed bulk selection', () => {
    expect(
      getBulkUnshareVisibilityMessage([
        { visibility: 'team' },
        { visibility: 'global' },
      ])
    ).toContain('Team-restricted');
  });
});

describe('resolveUnsharePermissions', () => {
  it('detects admin role and permission keys', () => {
    const perms = new Set<string>([
      PERMISSIONS.ACTIVITIES.UNSHARE,
      PERMISSIONS.ACTIVITIES.UNSHARE_ALL,
    ]);

    expect(
      resolveUnsharePermissions((key) => perms.has(key), SYSTEM_ROLES.ADMIN)
    ).toEqual({
      hasUnshare: true,
      hasUnshareAll: true,
      isAdminOrSysAdmin: true,
    });
  });
});
