import { describe, expect, it } from 'vitest';

import { sortGovernmentRepresentativesForUser } from './government-representative-sort';

describe('sortGovernmentRepresentativesForUser', () => {
  const reps = [
    {
      id: 1,
      name: 'Premier',
      displayName: 'Premier',
      ministryId: null,
      sortOrder: 1,
    },
    {
      id: 2,
      name: 'User Minister',
      displayName: 'User Minister',
      ministryId: 10,
      sortOrder: 5,
    },
    {
      id: 3,
      name: 'Other Minister',
      displayName: 'Other Minister',
      ministryId: 20,
      sortOrder: 2,
    },
  ];

  const teams = [
    { id: 100, ministryId: 10 },
    { id: 200, ministryId: 30 },
  ];

  it('returns global sortOrder when user has no teams', () => {
    expect(
      sortGovernmentRepresentativesForUser(reps, [], teams).map((rep) => rep.id)
    ).toEqual([1, 3, 2]);
  });

  it('boosts reps for ministries linked to the user teams', () => {
    expect(
      sortGovernmentRepresentativesForUser(reps, [100], teams).map(
        (rep) => rep.id
      )
    ).toEqual([2, 1, 3]);
  });

  it('preserves sortOrder within boosted and non-boosted groups', () => {
    const manyReps = [
      {
        id: 1,
        displayName: 'B',
        ministryId: 10,
        sortOrder: 2,
      },
      {
        id: 2,
        displayName: 'A',
        ministryId: 10,
        sortOrder: 1,
      },
      {
        id: 3,
        displayName: 'D',
        ministryId: 20,
        sortOrder: 2,
      },
      {
        id: 4,
        displayName: 'C',
        ministryId: 20,
        sortOrder: 1,
      },
    ];

    expect(
      sortGovernmentRepresentativesForUser(manyReps, [100], teams).map(
        (rep) => rep.id
      )
    ).toEqual([2, 1, 4, 3]);
  });
});
