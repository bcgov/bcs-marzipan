import { describe, expect, it } from 'vitest';

import {
  formatMemberAddedDescription,
  formatUserCreatedDescription,
  formatUserUpdatedDescription,
  resolveTeamDisplayName,
  resolveUserDisplayName,
} from './user-team-toast-messages';

describe('resolveUserDisplayName', () => {
  it('prefers adDisplayName', () => {
    expect(
      resolveUserDisplayName({
        adDisplayName: 'Jane Smith',
        adUsername: 'jsmith',
        id: 1,
      })
    ).toBe('Jane Smith');
  });
});

describe('resolveTeamDisplayName', () => {
  it('includes abbreviation when present', () => {
    expect(
      resolveTeamDisplayName({
        displayName: 'GCPE',
        abbreviation: 'GCPE',
      })
    ).toBe('GCPE (GCPE)');
  });
});

describe('formatUserCreatedDescription', () => {
  it('includes team names when provided', () => {
    expect(
      formatUserCreatedDescription('Jane Smith', ['GCPE', 'Planning'])
    ).toBe('Jane Smith · Added to GCPE, Planning');
  });
});

describe('formatUserUpdatedDescription', () => {
  it('returns user name only when no teams were added', () => {
    expect(formatUserUpdatedDescription('Jane Smith')).toBe('Jane Smith');
  });
});

describe('formatMemberAddedDescription', () => {
  it('formats a single member', () => {
    expect(formatMemberAddedDescription(['Jane Smith'], 'GCPE')).toBe(
      'Jane Smith added to GCPE'
    );
  });
});
