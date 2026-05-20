import { describe, expect, it } from 'vitest';

import {
  resolveTranslationLanguageDisplayLabel,
  resolveTranslationLanguageDisplayLabels,
} from './translationLanguageDisplayLabels';

describe('resolveTranslationLanguageDisplayLabel', () => {
  it('maps shortcodes to display names case-insensitively', () => {
    expect(resolveTranslationLanguageDisplayLabel('FR')).toBe('French');
    expect(resolveTranslationLanguageDisplayLabel('pun')).toBe('Punjabi');
  });

  it('canonicalizes values that are already display names', () => {
    expect(resolveTranslationLanguageDisplayLabel('french')).toBe('French');
    expect(resolveTranslationLanguageDisplayLabel('Punjabi')).toBe('Punjabi');
  });

  it('returns unknown codes unchanged', () => {
    expect(resolveTranslationLanguageDisplayLabel('ZH')).toBe('ZH');
  });
});

describe('resolveTranslationLanguageDisplayLabels', () => {
  it('maps each entry in order', () => {
    expect(resolveTranslationLanguageDisplayLabels(['FR', 'PUN'])).toEqual([
      'French',
      'Punjabi',
    ]);
  });
});
