import { describe, expect, it } from 'vitest';

import { getInitials } from './initials';

describe('getInitials', () => {
  it('uses first and last name order', () => {
    expect(getInitials('Demo User')).toBe('DU');
  });

  it('reads "Last, First" as First Last', () => {
    expect(getInitials('Carmichael, Robert')).toBe('RC');
  });

  it('handles Azure AD names with a ministry tag', () => {
    expect(getInitials('Carmichael, Alexander CITZ:EX')).toBe('AC');
    expect(getInitials('Carmichael, Alexander James CITZ:EX')).toBe('AC');
    expect(getInitials('Alexander Carmichael CITZ:EX')).toBe('AC');
  });

  it('uses first and last word for middle names', () => {
    expect(getInitials('Mary Jane Watson')).toBe('MW');
  });

  it('handles single names and extra whitespace', () => {
    expect(getInitials('  madonna ')).toBe('M');
    expect(getInitials('Demo    User')).toBe('DU');
  });

  it('falls back when empty', () => {
    expect(getInitials('')).toBe('U');
    expect(getInitials(null)).toBe('U');
    expect(getInitials('  ', '?')).toBe('?');
  });
});
