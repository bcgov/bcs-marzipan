/**
 * Maps translation language shortcodes (API `translationsRequired` values) to
 * `display_name` labels for Look Ahead print. Kept in sync with
 * `translated_languages` seed data.
 */
const TRANSLATION_LANGUAGE_DISPLAY_BY_SHORTCODE: Readonly<
  Record<string, string>
> = {
  AR: 'Arabic',
  SC: 'Chinese (Simplified)',
  TC: 'Chinese (Traditional)',
  DUT: 'Dutch',
  FAR: 'Farsi',
  FIN: 'Finnish',
  FR: 'French',
  GUJ: 'Gujarati',
  HE: 'Hebrew',
  HI: 'Hindi',
  IND: 'Indonesian',
  IT: 'Italian',
  JP: 'Japanese',
  KO: 'Korean',
  POR: 'Portuguese',
  PUN: 'Punjabi',
  RU: 'Russian',
  SOM: 'Somali',
  SPA: 'Spanish',
  SWA: 'Swahili',
  TL: 'Tagalog',
  UKR: 'Ukrainian',
  URD: 'Urdu',
  VN: 'Vietnamese',
};

const DISPLAY_NAME_BY_LOWER = new Map(
  Object.values(TRANSLATION_LANGUAGE_DISPLAY_BY_SHORTCODE).map((name) => [
    name.toLowerCase(),
    name,
  ])
);

/**
 * Resolves a single translation language label for Look Ahead print: shortcodes
 * become display names; values that are already display names are canonicalized.
 */
export function resolveTranslationLanguageDisplayLabel(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return trimmed;

  const fromShortcode =
    TRANSLATION_LANGUAGE_DISPLAY_BY_SHORTCODE[trimmed.toUpperCase()];
  if (fromShortcode) return fromShortcode;

  return DISPLAY_NAME_BY_LOWER.get(trimmed.toLowerCase()) ?? trimmed;
}

/** Maps each API translation label to its display name for Look Ahead print. */
export function resolveTranslationLanguageDisplayLabels(
  codes: readonly string[]
): string[] {
  return codes.map(resolveTranslationLanguageDisplayLabel);
}
