import { describe, expect, it } from 'vitest';

import { formatLookAheadReleaseTypesLine } from './format-look-ahead-release-types';

describe('formatLookAheadReleaseTypesLine', () => {
  it('sorts by report sort order and joins abbrevs', () => {
    expect(
      formatLookAheadReleaseTypesLine([
        {
          releaseTypeId: 2,
          reportAbbrev: 'IB',
          reportSortOrder: 4,
          allowsTranslation: false,
        },
        {
          releaseTypeId: 4,
          reportAbbrev: 'NR',
          reportSortOrder: 1,
          allowsTranslation: true,
        },
      ])
    ).toBe('NR, IB');
  });

  it('dedupes by release type id', () => {
    expect(
      formatLookAheadReleaseTypesLine([
        {
          releaseTypeId: 4,
          reportAbbrev: 'NR',
          reportSortOrder: 1,
          allowsTranslation: true,
        },
        {
          releaseTypeId: 4,
          reportAbbrev: 'NR',
          reportSortOrder: 1,
          allowsTranslation: true,
        },
      ])
    ).toBe('NR');
  });

  it('truncates to two visible with +N', () => {
    expect(
      formatLookAheadReleaseTypesLine([
        {
          releaseTypeId: 4,
          reportAbbrev: 'NR',
          reportSortOrder: 1,
          allowsTranslation: true,
        },
        {
          releaseTypeId: 7,
          reportAbbrev: 'STMT',
          reportSortOrder: 2,
          allowsTranslation: false,
        },
        {
          releaseTypeId: 3,
          reportAbbrev: 'MA',
          reportSortOrder: 3,
          allowsTranslation: false,
        },
      ])
    ).toBe('NR, STMT +1');
  });
});
