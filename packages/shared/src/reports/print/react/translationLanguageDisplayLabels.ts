/** Minimal lookup row for resolving translation language labels in print. */
export type TranslationLanguageLookup = {
  shortcode?: string | null;
  displayName?: string | null;
  name?: string | null;
};

export type TranslationLanguageLabelResolver = (code: string) => string;

/**
 * Builds a resolver from active `translated_languages` lookup rows (API/DB).
 * Maps shortcodes to `displayName`; canonicalizes values that are already display names.
 */
export function buildTranslationLanguageLabelResolver(
  lookups: readonly TranslationLanguageLookup[]
): TranslationLanguageLabelResolver {
  const byShortcode = new Map<string, string>();
  const byDisplayLower = new Map<string, string>();

  for (const item of lookups) {
    const display = item.displayName?.trim() || item.name?.trim();
    if (!display) continue;
    const shortcode = item.shortcode?.trim().toUpperCase();
    if (shortcode) byShortcode.set(shortcode, display);
    byDisplayLower.set(display.toLowerCase(), display);
  }

  return (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return trimmed;

    const fromShortcode = byShortcode.get(trimmed.toUpperCase());
    if (fromShortcode) return fromShortcode;

    return byDisplayLower.get(trimmed.toLowerCase()) ?? trimmed;
  };
}

/** Pass-through resolver when lookup data is unavailable (values used as-is). */
export const passthroughTranslationLanguageLabelResolver: TranslationLanguageLabelResolver =
  (code) => code.trim();

/**
 * Resolves a single translation language label for Look Ahead print.
 * Prefer {@link buildTranslationLanguageLabelResolver} with lookup rows from the API.
 */
export function resolveTranslationLanguageDisplayLabel(
  code: string,
  resolveLabel: TranslationLanguageLabelResolver = passthroughTranslationLanguageLabelResolver
): string {
  return resolveLabel(code);
}

/** Maps each API translation label to its display name for Look Ahead print. */
export function resolveTranslationLanguageDisplayLabels(
  codes: readonly string[],
  resolveLabel: TranslationLanguageLabelResolver = passthroughTranslationLanguageLabelResolver
): string[] {
  return codes.map((code) =>
    resolveTranslationLanguageDisplayLabel(code, resolveLabel)
  );
}
