/**
 * Corp calendar timezone constants. Pair with `Intl.DateTimeFormat` and the
 * helpers in `format.ts` / `calendar.ts` so user-visible output is the same
 * everywhere regardless of `process.env.TZ`.
 */

/**
 * IANA timezone string for the corp calendar's display zone.
 *
 * **Important:** In the IANA tz database, `Etc/GMT+N` uses an inverted sign
 * relative to POSIX-style offsets:
 *
 * - `Etc/GMT+7` is **UTC&minus;7** (what we want)
 * - `Etc/GMT-7` is **UTC+7** (a 14-hour bug)
 *
 * See `docs/DATE_AND_TIMEZONE.md` and the IANA Time Zone Database
 * (https://www.iana.org/time-zones) for context.
 */
export const CORP_PACIFIC_TIME_ZONE = 'Etc/GMT+7' as const;

/** Fixed offset in milliseconds: 7 hours behind UTC, year-round. */
export const CORP_PACIFIC_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Human-facing label for admin UI copy and tooltips. */
export const CORP_PACIFIC_LABEL = 'Pacific Time (UTC-7)' as const;
