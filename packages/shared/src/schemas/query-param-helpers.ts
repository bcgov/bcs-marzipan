import { z } from 'zod';

/** Non-negative integer token (digit-only; rejects `1.5`, `1e2`, `0x10`, etc.). */
const INTEGER_QUERY_SEGMENT = /^\d+$/;

function parseIntegerQuerySegment(segment: string): number | null {
  const trimmed = segment.trim();
  if (trimmed === '') return null;
  if (!INTEGER_QUERY_SEGMENT.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isInteger(n) ? n : null;
}

function parseCommaSeparatedInts(val: string): number[] {
  const ids: number[] = [];
  for (const segment of val.split(',')) {
    const parsed = parseIntegerQuerySegment(segment);
    if (parsed == null) {
      if (segment.trim() !== '') {
        return [];
      }
      continue;
    }
    ids.push(parsed);
  }
  return ids;
}

function parseCommaSeparatedStrings(val: string): string[] {
  return val
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const intFromString = z
  .string()
  .regex(INTEGER_QUERY_SEGMENT)
  .transform((s) => Number(s));

/** HTTP query param: comma-separated or repeated ints → number[]; empty → undefined. */
export function commaSeparatedIntArray() {
  return z
    .union([
      z.array(intFromString),
      z.string().transform(parseCommaSeparatedInts),
    ])
    .optional()
    .transform((val) =>
      val == null || (Array.isArray(val) && val.length === 0) ? undefined : val
    );
}

/** HTTP query param: comma-separated or repeated strings → string[]; empty → undefined. */
export function commaSeparatedStringArray() {
  return z
    .union([
      z.array(z.string().min(1)),
      z.string().transform(parseCommaSeparatedStrings),
    ])
    .optional()
    .transform((val) =>
      val == null || (Array.isArray(val) && val.length === 0) ? undefined : val
    );
}

export const confirmedFilterEnum = z.enum([
  'any',
  'confirmed',
  'not_confirmed',
]);
