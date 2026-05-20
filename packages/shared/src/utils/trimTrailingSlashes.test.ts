import { describe, expect, it } from 'vitest';

import { trimTrailingSlashes } from './trimTrailingSlashes';

describe('trimTrailingSlashes', () => {
  it('returns the string unchanged when there is no trailing slash', () => {
    expect(trimTrailingSlashes('https://example.com')).toBe(
      'https://example.com'
    );
  });

  it('removes a single trailing slash', () => {
    expect(trimTrailingSlashes('https://example.com/')).toBe(
      'https://example.com'
    );
  });

  it('removes multiple trailing slashes', () => {
    expect(trimTrailingSlashes('https://example.com///')).toBe(
      'https://example.com'
    );
  });

  it('returns empty string for an all-slash string', () => {
    expect(trimTrailingSlashes('///')).toBe('');
  });
});
