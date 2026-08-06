import { describe, expect, it } from 'vitest';

import {
  filterAllowedLookupIds,
  getForbiddenLookupIds,
  isLookupSelectable,
} from './lookup-selectability';

describe('isLookupSelectable', () => {
  it('returns true for global lookups', () => {
    expect(isLookupSelectable({ visibility: 'global' }, [])).toBe(true);
  });

  it('returns false for team lookup when user has no teams', () => {
    expect(isLookupSelectable({ visibility: 'team', teamIds: [1] }, [])).toBe(
      false
    );
  });

  it('returns true when user team overlaps lookup teams', () => {
    expect(
      isLookupSelectable({ visibility: 'team', teamIds: [1, 2] }, [2, 3])
    ).toBe(true);
  });

  it('returns false when user teams do not overlap', () => {
    expect(isLookupSelectable({ visibility: 'team', teamIds: [1] }, [2])).toBe(
      false
    );
  });
});

describe('filterAllowedLookupIds', () => {
  const lookups = new Map([
    [1, { visibility: 'global' as const }],
    [2, { visibility: 'team' as const, teamIds: [10] }],
    [3, { visibility: 'team' as const, teamIds: [20] }],
  ]);

  it('allows selectable ids on create', () => {
    expect(filterAllowedLookupIds([1, 2], undefined, [10], lookups)).toEqual([
      1, 2,
    ]);
  });

  it('grandfathers existing ids on update', () => {
    expect(filterAllowedLookupIds([1, 3], [3], [10], lookups)).toEqual([1, 3]);
  });

  it('rejects new non-selectable ids', () => {
    expect(filterAllowedLookupIds([1, 3], [], [10], lookups)).toEqual([1]);
  });
});

describe('getForbiddenLookupIds', () => {
  it('returns ids that fail selectability check', () => {
    const lookups = new Map([
      [1, { visibility: 'global' as const }],
      [2, { visibility: 'team' as const, teamIds: [10] }],
    ]);
    expect(getForbiddenLookupIds([1, 2], [], [99], lookups)).toEqual([2]);
  });
});
