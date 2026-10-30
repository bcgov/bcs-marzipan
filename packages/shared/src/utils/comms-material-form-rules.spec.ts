import { describe, expect, it } from 'vitest';

import type { ActivityFormData } from '../schemas/activity.schema';
import {
  buildCommsMaterialReleaseFlagsById,
  stripCommsDependentFields,
} from './comms-material-form-rules';

const baseForm = (): ActivityFormData =>
  ({
    commsMaterialIds: [],
    newsReleaseOriginId: 1,
    newsReleaseDistributionId: 2,
    translationsRequiredStatusId: 3,
    translationLanguageIds: [10, 11],
  }) as unknown as ActivityFormData;

describe('stripCommsDependentFields', () => {
  const flags = buildCommsMaterialReleaseFlagsById([
    {
      id: 11,
      releaseType: {
        allowsTranslation: true,
        requiresNewsReleaseDetails: true,
      },
    },
    {
      id: 4,
      releaseType: {
        allowsTranslation: false,
        requiresNewsReleaseDetails: false,
      },
    },
  ]);

  it('clears NR and translation fields when no comms materials selected', () => {
    const result = stripCommsDependentFields(baseForm(), flags);
    expect(result.newsReleaseOriginId).toBeNull();
    expect(result.newsReleaseDistributionId).toBeNull();
    expect(result.translationsRequiredStatusId).toBeNull();
    expect(result.translationLanguageIds).toEqual([]);
  });

  it('keeps fields when news release material is selected', () => {
    const result = stripCommsDependentFields(
      { ...baseForm(), commsMaterialIds: [11] },
      flags
    );
    expect(result.newsReleaseOriginId).toBe(1);
    expect(result.translationLanguageIds).toEqual([10, 11]);
  });

  it('clears NR fields but keeps translation when only allowsTranslation material selected', () => {
    const flagsTranslationOnly = buildCommsMaterialReleaseFlagsById([
      {
        id: 99,
        releaseType: {
          allowsTranslation: true,
          requiresNewsReleaseDetails: false,
        },
      },
    ]);
    const result = stripCommsDependentFields(
      { ...baseForm(), commsMaterialIds: [99] },
      flagsTranslationOnly
    );
    expect(result.newsReleaseOriginId).toBeNull();
    expect(result.newsReleaseDistributionId).toBeNull();
    expect(result.translationsRequiredStatusId).toBe(3);
  });

  it('clears translation when factsheet-only selection', () => {
    const result = stripCommsDependentFields(
      { ...baseForm(), commsMaterialIds: [4] },
      flags
    );
    expect(result.translationsRequiredStatusId).toBeNull();
    expect(result.translationLanguageIds).toEqual([]);
  });
});
