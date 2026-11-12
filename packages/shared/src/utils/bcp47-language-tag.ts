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
