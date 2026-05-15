/**
 * Database -> wire helpers for calendar and time fields.
 *
 * Drizzle's `date()` column with `postgres-js` returns a `string` (`YYYY-MM-DD`)
 * by default and we want to keep that string end-to-end. These helpers
 * defensively handle the legacy case where a JS `Date` arrives (e.g. via a
 * driver option flip), without depending on `process.env.TZ`.
 */

import {
  isCalendarDateString,
  isCivilTimeString,
  type CalendarDateString,
  type CivilTimeString,
} from './types';

/**
 * Coerce a DB `date` column value into a `CalendarDateString` for the wire.
 *
 *  - `null` / `undefined` -> `null`.
 *  - `'YYYY-MM-DD'` string -> validated and cast (string pass-through, the
 *    happy path with `postgres-js` + Drizzle).
 *  - `Date` -> reads UTC components (PostgreSQL serializes `DATE` to a
 *    UTC-midnight `Date` when libraries opt into Date conversion); never
 *    uses `getDate()` / `getFullYear()` so output is the same regardless of
 *    `process.env.TZ`.
 *
 * Throws on a string that is not `YYYY-MM-DD`-shaped to surface bugs early.
 */
export function toCalendarDateStringFromDb(
  value: string | Date | null | undefined
): CalendarDateString | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    if (value === '') return null;
    if (!isCalendarDateString(value)) {
      throw new Error(
        `Expected a YYYY-MM-DD calendar date string from the DB, got: ${JSON.stringify(value)}`
      );
    }
    return value;
  }
  if (Number.isNaN(value.getTime())) return null;
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, '0');
  const d = String(value.getUTCDate()).padStart(2, '0');
  const candidate = `${y}-${m}-${d}`;
  if (!isCalendarDateString(candidate)) return null;
  return candidate;
}

/**
 * Coerce a DB `time` column value into a `CivilTimeString` for the wire.
 *
 *  - `null` / `undefined` -> `null`.
 *  - `'HH:mm'` -> pass-through.
 *  - `'HH:mm:ss'` (or longer) -> truncated to `HH:mm`.
 */
export function toCivilTimeStringFromDb(
  value: string | null | undefined
): CivilTimeString | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const normalized =
    trimmed.length >= 5 && trimmed[2] === ':' ? trimmed.slice(0, 5) : trimmed;
  if (!isCivilTimeString(normalized)) {
    throw new Error(
      `Expected an HH:mm civil time string from the DB, got: ${JSON.stringify(value)}`
    );
  }
  return normalized;
}
