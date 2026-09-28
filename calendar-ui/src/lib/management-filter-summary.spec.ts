import { describe, expect, it } from 'vitest';

import {
  buildTeamAppliedFilterTypeLabels,
  buildTeamFilterDetailLines,
  buildUserAppliedFilterTypeLabels,
  buildUserFilterDetailLines,
  hasTeamClearableFilters,
  hasUserClearableFilters,
} from './management-filter-summary';

describe('management-filter-summary', () => {
  it('builds user filter labels from keyword, team, and role selections', () => {
    expect(
      buildUserAppliedFilterTypeLabels({
        keyword: ' ada ',
        teamIds: [1],
        roleIds: [],
      })
    ).toEqual(['Search', 'Team']);
  });

  it('detects clearable user filters', () => {
    expect(
      hasUserClearableFilters({ keyword: '', teamIds: [], roleIds: [] })
    ).toBe(false);
    expect(
      hasUserClearableFilters({ keyword: 'x', teamIds: [], roleIds: [] })
    ).toBe(true);
  });

  it('builds team filter labels from keyword only', () => {
    expect(buildTeamAppliedFilterTypeLabels({ keyword: ' ops ' })).toEqual([
      'Search',
    ]);
  });

  it('detects clearable team filters', () => {
    expect(hasTeamClearableFilters({ keyword: '' })).toBe(false);
    expect(hasTeamClearableFilters({ keyword: 'x' })).toBe(true);
  });

  it('builds user filter detail lines with resolved labels', () => {
    expect(
      buildUserFilterDetailLines({
        keyword: 'ada',
        teamIds: [1],
        roleIds: [2],
        teamOptions: [{ value: '1', label: 'Comms' }],
        roleOptions: [{ value: '2', label: 'Admin' }],
      })
    ).toEqual([
      { label: 'Search', value: 'ada' },
      { label: 'Team', value: 'Comms' },
      { label: 'Role', value: 'Admin' },
    ]);
  });

  it('builds team filter detail lines from keyword', () => {
    expect(buildTeamFilterDetailLines({ keyword: ' ops ' })).toEqual([
      { label: 'Search', value: 'ops' },
    ]);
  });
});
