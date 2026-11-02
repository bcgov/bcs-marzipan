import { describe, expect, it } from 'vitest';

import {
  formatGovBcDisplayNameAsFirstLast,
  parseGovBcDisplayName,
} from './parse-gov-bc-display-name';

describe('parseGovBcDisplayName', () => {
  it('parses "Last, First" Azure AD names', () => {
    expect(parseGovBcDisplayName('Carmichael, Robert')).toEqual({
      surname: 'Carmichael',
      givenNames: 'Robert',
      givenNameTokens: ['Robert'],
    });
  });

  it('drops ministry tags after the given name', () => {
    expect(parseGovBcDisplayName('Carmichael, Alexander CITZ:EX')).toEqual({
      surname: 'Carmichael',
      givenNames: 'Alexander',
      givenNameTokens: ['Alexander'],
    });
    expect(
      parseGovBcDisplayName('Carmichael, Alexander James CITZ:EX')
    ).toEqual({
      surname: 'Carmichael',
      givenNames: 'Alexander James',
      givenNameTokens: ['Alexander', 'James'],
    });
  });

  it('parses plain "First Last" names', () => {
    expect(parseGovBcDisplayName('Demo User')).toEqual({
      surname: 'User',
      givenNames: 'Demo',
      givenNameTokens: ['Demo'],
    });
    expect(parseGovBcDisplayName('Mary Jane Watson')).toEqual({
      surname: 'Watson',
      givenNames: 'Mary Jane',
      givenNameTokens: ['Mary', 'Jane'],
    });
  });

  it('parses "First Last" with ministry tags', () => {
    expect(parseGovBcDisplayName('Alexander Carmichael CITZ:EX')).toEqual({
      surname: 'Carmichael',
      givenNames: 'Alexander',
      givenNameTokens: ['Alexander'],
    });
  });

  it('handles single names and empty input', () => {
    expect(parseGovBcDisplayName('madonna')).toEqual({
      surname: '',
      givenNames: 'madonna',
      givenNameTokens: ['madonna'],
    });
    expect(parseGovBcDisplayName('')).toBeNull();
    expect(parseGovBcDisplayName(null)).toBeNull();
  });
});

describe('formatGovBcDisplayNameAsFirstLast', () => {
  it('formats Azure AD names for display', () => {
    expect(formatGovBcDisplayNameAsFirstLast('Carmichael, Robert')).toBe(
      'Robert Carmichael'
    );
    expect(
      formatGovBcDisplayNameAsFirstLast('Carmichael, Alexander CITZ:EX')
    ).toBe('Alexander Carmichael');
  });

  it('leaves already-friendly names unchanged', () => {
    expect(formatGovBcDisplayNameAsFirstLast('Demo User')).toBe('Demo User');
  });
});
