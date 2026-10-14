/**
 * Parses a query param as a positive integer. Returns `undefined` when omitted.
 * Returns `null` when the value is not a strict positive integer (rejects `12abc`, `3.5`, `0`).
 */
export function tryParseStrictPositiveInt(
  value: string | undefined
): number | undefined | null {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return n > 0 ? n : null;
}

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
