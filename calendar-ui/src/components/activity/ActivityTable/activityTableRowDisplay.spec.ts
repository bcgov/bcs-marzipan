import { describe, expect, it } from 'vitest';

import { pathsIncludeFieldChange } from './activityTableRowDisplay';

describe('pathsIncludeFieldChange', () => {
  it('matches exact paths', () => {
    expect(pathsIncludeFieldChange(['title'], 'title')).toBe(true);
    expect(pathsIncludeFieldChange(['title'], 'summary')).toBe(false);
  });

  it('matches nested form paths under a review path prefix', () => {
    expect(
      pathsIncludeFieldChange(['venueAddress'], 'venueAddress.venueName')
    ).toBe(true);
  });

  it('matches when form path is a prefix of a review path', () => {
    expect(pathsIncludeFieldChange(['venueAddress.city'], 'venueAddress')).toBe(
      true
    );
  });

  it('accepts ReadonlySet', () => {
    expect(pathsIncludeFieldChange(new Set(['startDate']), 'startDate')).toBe(
      true
    );
  });

  it('returns false for undefined or empty paths', () => {
    expect(pathsIncludeFieldChange(undefined, 'title')).toBe(false);
    expect(pathsIncludeFieldChange([], 'title')).toBe(false);
  });
});
