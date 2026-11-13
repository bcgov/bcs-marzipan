/** Max length for `translated_languages.shortcode` (varchar). */
export const BCP47_LANGUAGE_TAG_MAX_LENGTH = 15;

/**
 * Validates admin/API input for a BCP 47 language tag (language + optional subtags).
 * Accepts common tags used in CorpCal (e.g. fr, ar, zh-Hans, en-US).
 */
export function isPlausibleBcp47LanguageTag(tag: string): boolean {
  const trimmed = tag.trim();
  if (!trimmed || trimmed.length > BCP47_LANGUAGE_TAG_MAX_LENGTH) {
    return false;
  }
  return /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(trimmed);
}

/**
 * Normalize a BCP 47 language tag for case-insensitive comparison.
 * Language subtag lowercased; script subtag title-cased (e.g. zh-Hans).
 */
export function normalizeLanguageTagForCompare(tag: string): string {
  const trimmed = tag.trim();
  if (!trimmed) return trimmed;

  const parts = trimmed.split('-');
  if (parts.length === 0) return trimmed;

  const language = parts[0].toLowerCase();
  const rest = parts.slice(1).map((part) => {
    if (part.length === 4) {
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }
    return part.toUpperCase();
  });

  return rest.length > 0 ? `${language}-${rest.join('-')}` : language;
}

/** Format a stored BCP 47 tag for UI display (canonical casing). */
export function formatLanguageTagForDisplay(tag: string): string {
  return normalizeLanguageTagForCompare(tag);
}
