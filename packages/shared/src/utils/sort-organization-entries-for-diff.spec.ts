import { describe, expect, it } from 'vitest';

import { sortOrganizationEntriesForDiff } from './sort-organization-entries-for-diff';

describe('sortOrganizationEntriesForDiff', () => {
  it('orders lead first, then id, then name', () => {
    expect(
      sortOrganizationEntriesForDiff([
        { organizationName: 'Beta Ministry', isLead: false },
        { organizationId: 2, isLead: true },
        { organizationId: 1, isLead: false },
      ])
    ).toEqual([
      { organizationId: 2, isLead: true },
      { organizationId: 1, isLead: false },
      { organizationName: 'Beta Ministry', isLead: false },
    ]);
  });
});
