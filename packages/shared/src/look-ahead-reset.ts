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

/** `application_settings.key` — `'true'` (default) or `'false'` when cron is stopped. */
export const LOOK_AHEAD_RESET_CRON_ENABLED_KEY =
  'look_ahead_reset_cron_enabled' as const;

/**
 * `application_settings.key` — Pacific YYYY-MM-DD for one-shot pause (skip tonight's run).
 * Empty when not paused.
 */
export const LOOK_AHEAD_RESET_CRON_PAUSED_FOR_DATE_KEY =
  'look_ahead_reset_cron_paused_for_date' as const;

export type LookAheadResetCronMode = 'running' | 'paused_today' | 'stopped';

export type LookAheadManualClearScope = 'window' | 'all_future';

export type LookAheadResetDateWindow = {
  rangeStart: string;
  rangeEnd?: string;
};

export type LookAheadResetLastClearSummary = {
  at: string;
  updated: number;
  trigger: 'schedule' | 'manual';
};

export type LookAheadResetRollbackSkipReason = 'in_flight' | 'advisory_lock';

export type LookAheadResetRollbackResult = {
  restored: number;
  /** Activities missing or deleted since the clear. */
  skipped: number;
  rollbackAvailable: boolean;
  /** Entire rollback did not run (contention), distinct from per-activity skips. */
  skippedRollback?: boolean;
  skipReason?: LookAheadResetRollbackSkipReason;
};

// ============================================================================
// Cron (use @Cron(..., { timeZone: LOOK_AHEAD_RESET_CRON_TIMEZONE }) in calendar-service)
// ============================================================================

/**
 * Nest `@Cron` six-field: second minute hour day-of-month month day-of-week.
 * At **06:45 UTC** daily (= **23:45** on the previous Pacific fixed UTC-7 calendar date).
 * Fires **15 minutes** before the Pacific-fixed day rolls at **07:00 UTC** so delayed
 * handler start is less likely to cross that boundary; scheduled runs should still pass
 * a captured `referenceUtcMs` from the handler (see calendar-service job) rather than
 * `Date.now()` deep inside the transaction.
 *
 * Always pair with `{ timeZone: LOOK_AHEAD_RESET_CRON_TIMEZONE }` on `@Cron` so runs
 * are independent of `process.env.TZ` (unlike activity completion, which uses a frequent
 * tick and `toPacificHourMinute` for Pacific gating).
 */
export const LOOK_AHEAD_RESET_CRON_UTC = '0 45 6 * * *' as const;

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
  | 'error'
  | 'cron_stopped'
  | 'paused_today';

export type LookAheadResetBatchRunResult = {
  updated: number;
  skipped: boolean;
  skipReason?: LookAheadResetBatchSkipReason;
  /** Set on manual run when pauseScheduledTonight was applied. */
  scheduledRunPausedTonight?: boolean;
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
 * Date window for a manual clear run.
 * Window mode uses the same bounded overlap as cron; all-future mode has no upper bound.
 */
export function computeManualLookAheadClearWindow(
  utcMs: number,
  params: {
    scope: LookAheadManualClearScope;
    days?: number;
    includePast?: boolean;
  }
): LookAheadResetDateWindow | null {
  if (params.scope === 'all_future' && params.includePast) {
    return null;
  }
  if (params.scope === 'window') {
    const n = params.days ?? DEFAULT_LOOK_AHEAD_RESET_WINDOW_DAYS;
    return computeLookAheadResetWindow(utcMs, n);
  }
  return { rangeStart: pacificCalendarDateFromUtcMs(utcMs) };
}

/**
 * Derive effective cron mode from persisted settings and current Pacific date.
 */
export function deriveLookAheadResetCronMode(
  settings: {
    cronEnabled: boolean;
    pausedForDate: string | null;
  },
  utcMs: number = Date.now()
): LookAheadResetCronMode {
  if (!settings.cronEnabled) return 'stopped';
  const today = pacificCalendarDateFromUtcMs(utcMs);
  if (settings.pausedForDate === today) return 'paused_today';
  return 'running';
}

export function parseLookAheadResetCronEnabled(
  raw: string | undefined
): boolean {
  if (raw == null || raw === '') return true;
  return raw !== 'false';
}

/**
 * True when `raw` is non-empty but not a valid in-range integer window days value.
 * Used for logging alongside {@link normalizeLookAheadResetWindowDays}.
 */
export function invalidStoredLookAheadResetWindowDays(
  raw: string | undefined
): boolean {
  if (raw == null || raw === '') return false;
  const n = Number.parseInt(raw, 10);
  return (
    !Number.isFinite(n) ||
    n < MIN_LOOK_AHEAD_RESET_WINDOW_DAYS ||
    n > MAX_LOOK_AHEAD_RESET_WINDOW_DAYS
  );
}

/**
 * Clamp and validate window days from persisted settings.
 */
export function normalizeLookAheadResetWindowDays(
  raw: string | undefined
): number {
  if (raw == null || raw === '') return DEFAULT_LOOK_AHEAD_RESET_WINDOW_DAYS;
  if (invalidStoredLookAheadResetWindowDays(raw)) {
    return DEFAULT_LOOK_AHEAD_RESET_WINDOW_DAYS;
  }
  return Number.parseInt(raw, 10);
}
