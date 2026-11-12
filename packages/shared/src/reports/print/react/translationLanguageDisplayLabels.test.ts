import { describe, expect, it } from 'vitest';

import {
  buildTranslationLanguageLabelResolver,
  passthroughTranslationLanguageLabelResolver,
  resolveTranslationLanguageDisplayLabel,
  resolveTranslationLanguageDisplayLabels,
  type TranslationLanguageLookup,
} from './translationLanguageDisplayLabels';

const SAMPLE_LOOKUPS: readonly TranslationLanguageLookup[] = [
  { shortcode: 'fr', displayName: 'French' },
  { shortcode: 'pa', displayName: 'Punjabi' },
  { shortcode: 'zh-Hans', displayName: 'Chinese (Simplified)' },
  { shortcode: 'es', displayName: 'Spanish' },
];

describe('buildTranslationLanguageLabelResolver', () => {
  it('maps shortcodes to display names case-insensitively', () => {
    const resolve = buildTranslationLanguageLabelResolver(SAMPLE_LOOKUPS);
    expect(resolve('FR')).toBe('French');
    expect(resolve('PA')).toBe('Punjabi');
    expect(resolve('zh-hans')).toBe('Chinese (Simplified)');
  });

  it('canonicalizes values that are already display names', () => {
    const resolve = buildTranslationLanguageLabelResolver(SAMPLE_LOOKUPS);
    expect(resolve('french')).toBe('French');
    expect(resolve('Punjabi')).toBe('Punjabi');
  });

  it('returns unknown codes unchanged', () => {
    const resolve = buildTranslationLanguageLabelResolver(SAMPLE_LOOKUPS);
    expect(resolve('ZH')).toBe('ZH');
  });
});

describe('resolveTranslationLanguageDisplayLabel', () => {
  it('passes through when no resolver is supplied', () => {
    expect(
      resolveTranslationLanguageDisplayLabel(
        'FR',
        passthroughTranslationLanguageLabelResolver
      )
    ).toBe('FR');
  });

  it('uses an injected resolver when provided', () => {
    const resolve = buildTranslationLanguageLabelResolver(SAMPLE_LOOKUPS);
    expect(resolveTranslationLanguageDisplayLabel('FR', resolve)).toBe(
      'French'
    );
  });
});

describe('resolveTranslationLanguageDisplayLabels', () => {
  it('maps each entry in order via resolver', () => {
    const resolve = buildTranslationLanguageLabelResolver(SAMPLE_LOOKUPS);
    expect(
      resolveTranslationLanguageDisplayLabels(['fr', 'pa'], resolve)
    ).toEqual(['French', 'Punjabi']);
  });
});
