import { describe, expect, it } from 'vitest';

import type { SavedFilterResponse } from '@corpcal/shared/schemas';

import { resolveEffectiveDefaultSavedFilterId } from './savedFilterDefaultResolve';

const base = (
  overrides: Partial<SavedFilterResponse>
): SavedFilterResponse => ({
  id: 1,
  ownerUserId: 10,
  name: 'A',
  filterState: {},
  searchKeyword: '',
  isDefault: false,
  sortOrder: 0,
  scopeType: 'user',
  scopeTeamId: null,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('resolveEffectiveDefaultSavedFilterId', () => {
  it('returns API default when that filter is in the list', () => {
    const filters = [base({ id: 1 }), base({ id: 2, name: 'B' })];
    expect(resolveEffectiveDefaultSavedFilterId(filters, 2)).toBe(2);
  });

  it('returns null when API default is not in the list', () => {
    const filters = [base({ id: 1 })];
    expect(resolveEffectiveDefaultSavedFilterId(filters, 99)).toBeNull();
  });

  it('returns null when API default is null', () => {
    const filters = [base({ id: 1 })];
    expect(resolveEffectiveDefaultSavedFilterId(filters, null)).toBeNull();
  });
});
