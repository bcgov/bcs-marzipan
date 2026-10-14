/**
 * Parses a comma-separated query param into trimmed non-empty strings.
 */
export function parseCommaSeparatedStrings(
  value: string | undefined
): string[] {
  if (!value?.trim()) return [];
  return value
    .split(',')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}
