/**
 * Parses a comma-separated string of numeric IDs (e.g. from query params) into an array of numbers.
 * Returns an empty array for undefined, null, or blank input. Invalid segments are filtered out.
 */
export function parseCommaSeparatedIds(value: string | undefined): number[] {
  if (!value?.trim()) return [];
  return value
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));
}
