import { describe, expect, it } from 'vitest';

import { resolveUserDisplayName } from './resolveUserDisplayName';

describe('resolveUserDisplayName', () => {
  it('treats whitespace-only displayName as unset', () => {
    expect(
      resolveUserDisplayName({
        displayName: '   ',
        adDisplayName: 'AD Name',
      })
    ).toBe('AD Name');
  });

  it('prefers CorpCal displayName override over AD fields', () => {
    expect(
      resolveUserDisplayName({
        displayName: 'CorpCal Name',
        adDisplayName: 'AD Name',
        adUsername: 'user1',
      })
    ).toBe('CorpCal Name');
  });

  it('falls back through adDisplayName, adUsername, adEmail', () => {
    expect(
      resolveUserDisplayName({
        adDisplayName: 'AD Name',
        adUsername: 'user1',
      })
    ).toBe('AD Name');
    expect(resolveUserDisplayName({ adUsername: 'JSMITH' })).toBe('JSMITH');
    expect(resolveUserDisplayName({ adEmail: 'a@gov.bc.ca', id: 5 })).toBe(
      'a@gov.bc.ca'
    );
  });

  it('uses User id fallback', () => {
    expect(resolveUserDisplayName({ id: 42 })).toBe('User 42');
    expect(resolveUserDisplayName({})).toBe('User');
  });
});
