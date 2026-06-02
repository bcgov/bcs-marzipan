import { z } from 'zod';

function parseCommaSeparatedInts(val: string): number[] {
  return val
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !Number.isNaN(id));
}

function parseCommaSeparatedStrings(val: string): string[] {
  return val
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const intFromString = z.string().transform(Number).pipe(z.number().int());

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
