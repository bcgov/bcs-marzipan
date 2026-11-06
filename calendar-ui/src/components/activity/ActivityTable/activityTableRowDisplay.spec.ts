import { describe, expect, it } from 'vitest';

import {
  getInitialsFromName,
  pathsIncludeFieldChange,
  toSentenceCase,
} from './activityTableRowDisplay';

describe('toSentenceCase', () => {
  it('sentence-cases confirmed status labels', () => {
    expect(toSentenceCase('confirmed')).toBe('Confirmed');
    expect(toSentenceCase('Confirmed')).toBe('Confirmed');
  });

  it('keeps TBD in caps for scheduling status badges', () => {
    expect(toSentenceCase('TBD')).toBe('TBD');
    expect(toSentenceCase('tbd')).toBe('TBD');
    expect(toSentenceCase('Date TBD')).toBe('Date TBD');
    expect(toSentenceCase('Time TBD')).toBe('Time TBD');
  });
});

describe('getInitialsFromName', () => {
  it('returns two-letter initials for regular names', () => {
    expect(getInitialsFromName('John Doe')).toBe('JD');
    expect(getInitialsFromName('Alice Smith')).toBe('AS');
  });

  it('handles single-word names', () => {
    expect(getInitialsFromName('John')).toBe('J');
    expect(getInitialsFromName('Alice')).toBe('A');
  });

  it('handles multiple-word names by taking first letter of first two words', () => {
    expect(getInitialsFromName('John Q Public')).toBe('JQ');
  });

  it('returns SYSTEM for Calendar System user', () => {
    expect(getInitialsFromName('Calendar System')).toBe('SYSTEM');
  });
});

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
