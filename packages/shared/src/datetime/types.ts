/**
 * Branded TypeScript aliases for the three datetime concepts the corp calendar
 * uses on the wire and in storage. See `docs/DATE_AND_TIMEZONE.md`.
 *
 * The runtime value is always a plain `string`; the brand exists only at the
 * type level so plain strings cannot be assigned where a calendar date or
 * civil time is expected without going through a parser/validator.
 */

declare const __brand: unique symbol;
type Brand<Base, Tag extends string> = Base & { readonly [__brand]: Tag };

/**
 * ISO calendar date in `YYYY-MM-DD` (no time component, no timezone).
 *
 * Examples: `'2026-04-27'`, `'2026-12-01'`.
 */
export type CalendarDateString = Brand<string, 'CalendarDateString'>;

/**
 * Wall-clock civil time in `HH:mm` (24-hour, zero-padded).
 *
 * In the corp calendar, civil times are interpreted in **Pacific Time fixed
 * UTC&minus;7** (no DST), not the viewer's local timezone.
 *
 * Examples: `'09:30'`, `'14:00'`.
 */
export type CivilTimeString = Brand<string, 'CivilTimeString'>;

/**
 * ISO 8601 instant with a trailing `Z` (UTC). True moments in time, used for
 * audit and optimistic-concurrency timestamps such as `createdDateTime` and
 * `lastUpdatedDateTime`.
 *
 * Examples: `'2026-04-27T15:30:00.000Z'`.
 */
export type IsoUtcInstantString = Brand<string, 'IsoUtcInstantString'>;

/** Strict regex for `YYYY-MM-DD` (does not validate calendar correctness). */
const CALENDAR_DATE_PATTERN =
  /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

/** Strict regex for `HH:mm` (24-hour clock). */
const CIVIL_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/**
 * Type guard for `YYYY-MM-DD` calendar date strings. Validates the shape and
 * that the date round-trips through `Date.UTC` (rejects e.g. `'2026-02-30'`).
 */
export function isCalendarDateString(
  value: unknown
): value is CalendarDateString {
  if (typeof value !== 'string') return false;
  if (!CALENDAR_DATE_PATTERN.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  const utcMs = Date.UTC(y, m - 1, d);
  if (Number.isNaN(utcMs)) return false;
  const round = new Date(utcMs);
  return (
    round.getUTCFullYear() === y &&
    round.getUTCMonth() === m - 1 &&
    round.getUTCDate() === d
  );
}

/** Type guard for `HH:mm` civil time strings. */
export function isCivilTimeString(value: unknown): value is CivilTimeString {
  return typeof value === 'string' && CIVIL_TIME_PATTERN.test(value);
}

/**
 * Asserts and casts a string to `CalendarDateString`. Throws on invalid input.
 *
 * Use at boundaries (parsing query strings, mapping DB values) where you want
 * a hard guarantee. Use the type guard for soft validation.
 */
export function toCalendarDateString(value: string): CalendarDateString {
  if (!isCalendarDateString(value)) {
    throw new Error(`Invalid CalendarDateString: ${JSON.stringify(value)}`);
  }
  return value;
}

/** Asserts and casts a string to `CivilTimeString`. Throws on invalid input. */
export function toCivilTimeString(value: string): CivilTimeString {
  if (!isCivilTimeString(value)) {
    throw new Error(`Invalid CivilTimeString: ${JSON.stringify(value)}`);
  }
  return value;
}
