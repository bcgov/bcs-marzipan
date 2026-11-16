import { describe, expect, it } from 'vitest';

import {
  activityTranslationWorkflowActive,
  canonicalizeTranslationFields,
  type TranslationStatusLookupIds,
} from './activity-translations-canonicalize';

const LOOKUPS: TranslationStatusLookupIds = {
  tbdId: 1,
  requiredId: 2,
  noTranslationsId: 3,
};

describe('canonicalizeTranslationFields', () => {
  it('sets required status when languages are selected', () => {
    expect(
      canonicalizeTranslationFields(
        { translationsRequiredStatusId: 1, translationLanguageIds: [2, 1] },
        LOOKUPS,
        { translationWorkflowActive: true }
      )
    ).toEqual({
      translationsRequiredStatusId: 2,
      translationLanguageIds: [1, 2],
    });
  });

  it('keeps no_translations with empty languages', () => {
    expect(
      canonicalizeTranslationFields(
        { translationsRequiredStatusId: 3, translationLanguageIds: [] },
        LOOKUPS,
        { translationWorkflowActive: true }
      )
    ).toEqual({
      translationsRequiredStatusId: 3,
      translationLanguageIds: [],
    });
  });

  it('clears languages when status is no_translations', () => {
    expect(
      canonicalizeTranslationFields(
        { translationsRequiredStatusId: 3, translationLanguageIds: [1] },
        LOOKUPS,
        { translationWorkflowActive: true }
      )
    ).toEqual({
      translationsRequiredStatusId: 3,
      translationLanguageIds: [],
    });
  });

  it('coerces legacy required without languages to tbd', () => {
    expect(
      canonicalizeTranslationFields(
        { translationsRequiredStatusId: 2, translationLanguageIds: [] },
        LOOKUPS,
        { translationWorkflowActive: true }
      )
    ).toEqual({
      translationsRequiredStatusId: 1,
      translationLanguageIds: [],
    });
  });

  it('coerces null status to tbd when workflow is active', () => {
    expect(
      canonicalizeTranslationFields(
        { translationsRequiredStatusId: null, translationLanguageIds: [] },
        LOOKUPS,
        { translationWorkflowActive: true }
      )
    ).toEqual({
      translationsRequiredStatusId: 1,
      translationLanguageIds: [],
    });
  });

  it('clears to null when workflow is inactive', () => {
    expect(
      canonicalizeTranslationFields(
        { translationsRequiredStatusId: 1, translationLanguageIds: [1] },
        LOOKUPS,
        { translationWorkflowActive: false }
      )
    ).toEqual({
      translationsRequiredStatusId: null,
      translationLanguageIds: [],
    });
  });
});

describe('activityTranslationWorkflowActive', () => {
  it('returns true when a selected material allows translation', () => {
    const flags = new Map([[5, { allowsTranslation: true }]]);
    expect(activityTranslationWorkflowActive([5], flags)).toBe(true);
  });

  it('returns false when no material allows translation', () => {
    const flags = new Map([[5, { allowsTranslation: false }]]);
    expect(activityTranslationWorkflowActive([5], flags)).toBe(false);
  });
});
