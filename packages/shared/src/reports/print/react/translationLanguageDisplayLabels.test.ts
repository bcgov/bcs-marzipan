import { describe, expect, it } from 'vitest';

import {
  buildTranslationLanguageLabelResolver,
  passthroughTranslationLanguageLabelResolver,
  resolveTranslationLanguageDisplayLabel,
  resolveTranslationLanguageDisplayLabels,
  type TranslationLanguageLookup,
} from './translationLanguageDisplayLabels';

const SAMPLE_LOOKUPS: readonly TranslationLanguageLookup[] = [
  { shortcode: 'FR', displayName: 'French' },
  { shortcode: 'PUN', displayName: 'Punjabi' },
  { shortcode: 'SC', displayName: 'Chinese (Simplified)' },
  { shortcode: 'SPA', displayName: 'Spanish' },
];

describe('buildTranslationLanguageLabelResolver', () => {
  it('maps shortcodes to display names case-insensitively', () => {
    const resolve = buildTranslationLanguageLabelResolver(SAMPLE_LOOKUPS);
    expect(resolve('FR')).toBe('French');
    expect(resolve('pun')).toBe('Punjabi');
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
      resolveTranslationLanguageDisplayLabels(['FR', 'PUN'], resolve)
    ).toEqual(['French', 'Punjabi']);
  });
});
