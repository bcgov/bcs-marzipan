/**
 * Look Ahead status reset (scheduled + manual).
 *
 * Calendar dates use Pacific fixed UTC-7 (no DST), consistent with activity completion.
 */

const PACIFIC_OFFSET_MS = 7 * 60 * 60 * 1000;

// ============================================================================
// Application settings
// ============================================================================

/** `application_settings.key` — value is stringified integer `n` (inclusive end = rangeStart + n days). */
export const LOOK_AHEAD_RESET_WINDOW_DAYS_KEY =
  'look_ahead_reset_window_days' as const;

/** Default `n`: today through today+7 inclusive (8 calendar days). */
export const DEFAULT_LOOK_AHEAD_RESET_WINDOW_DAYS = 7;

export const MIN_LOOK_AHEAD_RESET_WINDOW_DAYS = 0;
export const MAX_LOOK_AHEAD_RESET_WINDOW_DAYS = 364;

// ============================================================================
// Cron (use @Cron(..., { timeZone: LOOK_AHEAD_RESET_CRON_TIMEZONE }) in calendar-service)
// ============================================================================

/**
 * Nest `@Cron` six-field: second minute hour day-of-month month day-of-week.
 * At **06:55 UTC** daily (= **23:55** on the previous Pacific fixed UTC-7 calendar date).
 *
 * Always pair with `{ timeZone: LOOK_AHEAD_RESET_CRON_TIMEZONE }` on `@Cron` so runs
 * are independent of `process.env.TZ` (unlike activity completion, which uses a frequent
 * tick and `toPacificHourMinute` for Pacific gating).
 */
export const LOOK_AHEAD_RESET_CRON_UTC = '0 55 6 * * *' as const;

/** IANA timezone for the Look Ahead reset cron (UTC wall clock for hour/minute). */
export const LOOK_AHEAD_RESET_CRON_TIMEZONE = 'UTC' as const;

// ============================================================================
// Advisory lock (distinct from activity completion)
// ============================================================================

export const LOOK_AHEAD_RESET_JOB_ADVISORY_CLASS = 7_881_904;

export const LOOK_AHEAD_RESET_JOB_ADVISORY_KEY = 1;

// ============================================================================
// Batch result (mirror activity completion job)
// ============================================================================

export type LookAheadResetBatchSkipReason =
  | 'in_flight'
  | 'advisory_lock'
  | 'error';

export type LookAheadResetBatchRunResult = {
  updated: number;
  skipped: boolean;
  skipReason?: LookAheadResetBatchSkipReason;
};

// ============================================================================
// Date window (pure)
// ============================================================================

/**
 * Pacific fixed UTC-7 calendar date (YYYY-MM-DD) for an instant in UTC ms.
 */
export function pacificCalendarDateFromUtcMs(utcMs: number): string {
  const d = new Date(utcMs - PACIFIC_OFFSET_MS);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Add whole calendar days to a YYYY-MM-DD string (civil date arithmetic).
 */
export function addCalendarDaysToIsoDate(
  isoDate: string,
  days: number
): string {
  const [y, mo, d] = isoDate.split('-').map(Number);
  const u = Date.UTC(y, mo - 1, d + days);
  const nd = new Date(u);
  const yy = nd.getUTCFullYear();
  const mm = String(nd.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(nd.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Inclusive reset window for a run at `utcMs` with forward offset `n` (days after rangeStart).
 */
export function computeLookAheadResetWindow(
  utcMs: number,
  n: number
): { rangeStart: string; rangeEnd: string } {
  const rangeStart = pacificCalendarDateFromUtcMs(utcMs);
  const rangeEnd = addCalendarDaysToIsoDate(rangeStart, n);
  return { rangeStart, rangeEnd };
}

/**
 * Clamp and validate window days from persisted settings.
 */
export function normalizeLookAheadResetWindowDays(
  raw: string | undefined
): number {
  if (raw == null || raw === '') return DEFAULT_LOOK_AHEAD_RESET_WINDOW_DAYS;
  const n = Number.parseInt(raw, 10);
  if (
    !Number.isFinite(n) ||
    n < MIN_LOOK_AHEAD_RESET_WINDOW_DAYS ||
    n > MAX_LOOK_AHEAD_RESET_WINDOW_DAYS
  ) {
    return DEFAULT_LOOK_AHEAD_RESET_WINDOW_DAYS;
  }
  return n;
}
