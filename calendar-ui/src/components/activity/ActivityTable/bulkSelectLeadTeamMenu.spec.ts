import { describe, expect, it } from 'vitest';

import {
  activityIdsForLeadTeam,
  activityIdsForUserLeadTeams,
  bulkSelectLeadTeamMenuItemLabel,
  bulkSelectLeadTeamsForMenu,
  bulkSelectLeadTeamShortLabel,
  countActivitiesByLeadTeamId,
  isBulkSelectLeadTeamItemDisabled,
} from './bulkSelectLeadTeamMenu';

describe('bulkSelectLeadTeamMenu', () => {
  const rows = [
    { id: 1, leadTeamId: 10 },
    { id: 2, leadTeamId: 20 },
    { id: 3, leadTeamId: 10 },
    { id: 4, leadTeamId: null },
  ];

  it('counts activities per lead team', () => {
    expect(Object.fromEntries(countActivitiesByLeadTeamId(rows))).toEqual({
      10: 2,
      20: 1,
    });
  });

  it('prefers abbreviation for menu labels', () => {
    expect(
      bulkSelectLeadTeamShortLabel({
        id: 1,
        name: 'team_one',
        displayName: 'Team One',
        abbreviation: 'T1',
      })
    ).toBe('T1');
    expect(
      bulkSelectLeadTeamMenuItemLabel(
        { id: 1, name: 'team_one', abbreviation: 'T1' },
        3
      )
    ).toBe('T1 activities (3)');
  });

  it('disables teams with zero rows or outside an active lead team filter', () => {
    expect(isBulkSelectLeadTeamItemDisabled(10, 0, [])).toBe(true);
    expect(isBulkSelectLeadTeamItemDisabled(10, 2, [])).toBe(false);
    expect(isBulkSelectLeadTeamItemDisabled(10, 2, [20])).toBe(true);
    expect(isBulkSelectLeadTeamItemDisabled(20, 2, [20])).toBe(false);
  });

  it('returns activity ids for a single lead team and for user teams', () => {
    expect(activityIdsForLeadTeam(rows, 10)).toEqual([1, 3]);
    expect(activityIdsForUserLeadTeams(rows, [20])).toEqual([2]);
  });

  it('limits the team menu to user teams unless admin', () => {
    const teams = [
      { id: 10, name: 'a', abbreviation: 'A' },
      { id: 20, name: 'b', abbreviation: 'B' },
    ];
    expect(
      bulkSelectLeadTeamsForMenu(teams, [20], false).map((t) => t.id)
    ).toEqual([20]);
    expect(
      bulkSelectLeadTeamsForMenu(teams, [], true).map((t) => t.id)
    ).toEqual([10, 20]);
  });
});
