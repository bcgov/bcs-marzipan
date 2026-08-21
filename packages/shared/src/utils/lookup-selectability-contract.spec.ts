import { describe, expect, it } from 'vitest';

import {
  filterAllowedLookupIds,
  getForbiddenLookupIds,
  isLookupSelectable,
  type LookupTeamScope,
} from './lookup-selectability';

/**
 * Documents the contract between shared selectability helpers and the
 * category/tag scoping rules used by calendar-service policy helpers.
 */
describe('lookup selectability contract', () => {
  const fixtures: Array<{
    id: number;
    scope: LookupTeamScope;
    userTeamIds: number[];
    selectable: boolean;
  }> = [
    {
      id: 1,
      scope: { visibility: 'global' },
      userTeamIds: [],
      selectable: true,
    },
    {
      id: 2,
      scope: { visibility: 'team', teamIds: [10] },
      userTeamIds: [10],
      selectable: true,
    },
    {
      id: 3,
      scope: { visibility: 'team', teamIds: [10] },
      userTeamIds: [20],
      selectable: false,
    },
    {
      id: 4,
      scope: { visibility: 'team', teamIds: [] },
      userTeamIds: [10],
      selectable: false,
    },
    {
      id: 5,
      scope: { visibility: 'team', teamIds: [10, 20] },
      userTeamIds: [20, 30],
      selectable: true,
    },
  ];

  it('isLookupSelectable matches documented fixture expectations', () => {
    for (const fixture of fixtures) {
      expect(isLookupSelectable(fixture.scope, fixture.userTeamIds)).toBe(
        fixture.selectable
      );
    }
  });

  it('getForbiddenLookupIds rejects only non-grandfathered, non-selectable ids', () => {
    const lookupsById = new Map(fixtures.map((f) => [f.id, f.scope]));
    const userTeamIds = [20];

    expect(
      getForbiddenLookupIds([1, 3, 5], undefined, userTeamIds, lookupsById)
    ).toEqual([3]);
    expect(
      filterAllowedLookupIds([1, 3, 5], [3], userTeamIds, lookupsById)
    ).toEqual([1, 3, 5]);
  });
});
