import { describe, expect, it } from 'vitest';

import {
  formatLanguageTagForDisplay,
  isPlausibleBcp47LanguageTag,
  normalizeLanguageTagForCompare,
} from './bcp47-language-tag';

describe('bcp47-language-tag', () => {
  it('normalizes simple language tags to lowercase', () => {
    expect(normalizeLanguageTagForCompare('FR')).toBe('fr');
    expect(normalizeLanguageTagForCompare('  es ')).toBe('es');
  });

  it('normalizes script subtags to canonical casing', () => {
    expect(normalizeLanguageTagForCompare('zh-hans')).toBe('zh-Hans');
    expect(normalizeLanguageTagForCompare('ZH-HANT')).toBe('zh-Hant');
  });

  it('formats for display using canonical casing', () => {
    expect(formatLanguageTagForDisplay('zh-hans')).toBe('zh-Hans');
    expect(formatLanguageTagForDisplay('pa')).toBe('pa');
  });

  it('validates plausible BCP 47 tags for lookup shortcodes', () => {
    expect(isPlausibleBcp47LanguageTag('fr')).toBe(true);
    expect(isPlausibleBcp47LanguageTag('zh-Hans')).toBe(true);
    expect(isPlausibleBcp47LanguageTag('en-US')).toBe(true);
    expect(isPlausibleBcp47LanguageTag('')).toBe(false);
    expect(isPlausibleBcp47LanguageTag('French')).toBe(false);
    expect(isPlausibleBcp47LanguageTag('zh-hans-extra-long-subtag')).toBe(
      false
    );
  });
});
