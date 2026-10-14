import { describe, expect, it } from 'vitest';

import { partitionGovernmentRepresentativesForLeadTeam } from './government-representative-sort';

describe('partitionGovernmentRepresentativesForLeadTeam', () => {
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
      name: 'Lead Minister',
      displayName: 'Lead Minister',
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

  it('returns global sortOrder when lead team is not set', () => {
    const { leadMinister, remainder } =
      partitionGovernmentRepresentativesForLeadTeam(reps, undefined, teams);

    expect(leadMinister).toBeNull();
    expect(remainder.map((rep) => rep.id)).toEqual([1, 3, 2]);
  });

  it('pins the lead team ministry minister ahead of the sorted remainder', () => {
    const { leadMinister, remainder } =
      partitionGovernmentRepresentativesForLeadTeam(reps, 100, teams);

    expect(leadMinister?.id).toBe(2);
    expect(remainder.map((rep) => rep.id)).toEqual([1, 3]);
  });

  it('returns sorted list only when lead team has no ministry', () => {
    const { leadMinister, remainder } =
      partitionGovernmentRepresentativesForLeadTeam(reps, 999, teams);

    expect(leadMinister).toBeNull();
    expect(remainder.map((rep) => rep.id)).toEqual([1, 3, 2]);
  });

  it('returns sorted list only when the ministry has no matching minister rep', () => {
    const { leadMinister, remainder } =
      partitionGovernmentRepresentativesForLeadTeam(reps, 200, teams);

    expect(leadMinister).toBeNull();
    expect(remainder.map((rep) => rep.id)).toEqual([1, 3, 2]);
  });
});
