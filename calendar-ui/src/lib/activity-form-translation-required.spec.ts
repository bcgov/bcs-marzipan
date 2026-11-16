import { describe, expect, it } from 'vitest';

import {
  comboboxValuesToTranslationFields,
  normalizeTranslationComboboxValues,
  TRANSLATION_COMBO_SENTINEL_NONE,
  translationFieldsToComboboxValues,
} from './activity-form-translation-required';

const LOOKUPS = {
  tbdId: 1,
  requiredId: 2,
  noTranslationsId: 3,
};

describe('translationFieldsToComboboxValues', () => {
  it('returns language ids when languages are set', () => {
    expect(translationFieldsToComboboxValues(2, [10, 11], LOOKUPS)).toEqual([
      '10',
      '11',
    ]);
  });

  it('returns no-translations sentinel only for that status', () => {
    expect(translationFieldsToComboboxValues(3, [], LOOKUPS)).toEqual([
      TRANSLATION_COMBO_SENTINEL_NONE,
    ]);
  });

  it('returns empty combobox value for implicit TBD (tbd, null, required w/o langs)', () => {
    expect(translationFieldsToComboboxValues(1, [], LOOKUPS)).toEqual([]);
    expect(translationFieldsToComboboxValues(null, [], LOOKUPS)).toEqual([]);
    expect(translationFieldsToComboboxValues(2, [], LOOKUPS)).toEqual([]);
  });
});

describe('normalizeTranslationComboboxValues', () => {
  it('keeps no translations exclusive', () => {
    expect(
      normalizeTranslationComboboxValues([TRANSLATION_COMBO_SENTINEL_NONE, '1'])
    ).toEqual([TRANSLATION_COMBO_SENTINEL_NONE]);
  });

  it('returns empty when cleared to implicit TBD', () => {
    expect(normalizeTranslationComboboxValues([])).toEqual([]);
  });
});

describe('comboboxValuesToTranslationFields', () => {
  it('maps empty selection to tbd status', () => {
    expect(comboboxValuesToTranslationFields([], LOOKUPS)).toEqual({
      translationsRequiredStatusId: 1,
      translationLanguageIds: [],
    });
  });
});
