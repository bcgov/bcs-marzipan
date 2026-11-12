import { describe, expect, it } from 'vitest';

import {
  formatLanguageTagForDisplay,
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
});
