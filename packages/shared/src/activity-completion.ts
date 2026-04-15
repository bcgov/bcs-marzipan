/**
 * Activity completion helpers.
 *
 * All times are interpreted in Pacific Time (fixed UTC-7, no DST).
 * Helpers are pure — no I/O — and shared between calendar-service and calendar-ui.
 */

const PACIFIC_OFFSET_MS = 7 * 60 * 60 * 1000;

// ============================================================================
// Effective end time
// ============================================================================

/**
 * Compute the effective end instant (UTC ms) for an activity.
 *
 * - Timed activities: endDate + endTime interpreted as Pacific (UTC-7).
 * - All-day activities: 00:00 Pacific on the day **after** endDate (exclusive end).
 *
 * Returns `null` when the inputs are insufficient (missing endDate, or missing
 * endTime for a non-all-day activity).
 */
export function computeEffectiveEndMs(
  endDate: string | null | undefined,
  endTime: string | null | undefined,
  isAllDay: boolean
): number | null {
  if (!endDate) return null;

  if (isAllDay) {
    const [y, m, d] = endDate.split('-').map(Number);
    const midnightPacificUtcMs = Date.UTC(y, m - 1, d + 1) + PACIFIC_OFFSET_MS;
    return midnightPacificUtcMs;
  }

  if (!endTime) return null;
  const iso = `${endDate}T${endTime.length === 5 ? endTime + ':00' : endTime}-07:00`;
  return new Date(iso).getTime();
}

// ============================================================================
// Completion eligibility
// ============================================================================

export type CompletionEligibility = {
  eligible: boolean;
  reason?: string;
};

/**
 * Whether an activity can be moved to Completed (manual path, no buffer).
 *
 * @param now       Current time in UTC ms (Date.now()).
 * @param opts      Activity fields relevant to the check.
 */
export function isManualCompleteEligible(
  now: number,
  opts: {
    activityStatusName: string;
    dateStatusName: string;
    timeStatusName: string;
    endDate: string | null | undefined;
    endTime: string | null | undefined;
    isAllDay: boolean;
  }
): CompletionEligibility {
  const status = opts.activityStatusName;
  if (status !== 'reviewed' && status !== 'changed' && status !== 'completed') {
    return {
      eligible: false,
      reason: `Status "${status}" is not eligible for completion`,
    };
  }

  if (opts.dateStatusName !== 'confirmed') {
    return { eligible: false, reason: 'Date status must be Confirmed' };
  }
  if (opts.timeStatusName !== 'confirmed') {
    return { eligible: false, reason: 'Time status must be Confirmed' };
  }

  const effectiveEnd = computeEffectiveEndMs(
    opts.endDate,
    opts.endTime,
    opts.isAllDay
  );
  if (effectiveEnd === null) {
    return {
      eligible: false,
      reason: 'End date/time is missing',
    };
  }

  if (now < effectiveEnd) {
    return { eligible: false, reason: 'Activity has not ended yet' };
  }

  return { eligible: true };
}

// ============================================================================
// Cron tick gating
// ============================================================================

export type CompletionSchedule = 'hourly' | 'twice_daily' | 'daily';
export type CompletionBufferMinutes = 0 | 15 | 30 | 45;

export const COMPLETION_SCHEDULES: readonly CompletionSchedule[] = [
  'hourly',
  'twice_daily',
  'daily',
] as const;

export const COMPLETION_BUFFER_OPTIONS: readonly CompletionBufferMinutes[] = [
  0, 15, 30, 45,
] as const;

export const DEFAULT_COMPLETION_SCHEDULE: CompletionSchedule = 'daily';
export const DEFAULT_COMPLETION_BUFFER_MINUTES: CompletionBufferMinutes = 0;

/**
 * Convert a UTC timestamp to Pacific hour and minute (fixed UTC-7).
 */
export function toPacificHourMinute(utcMs: number): {
  hour: number;
  minute: number;
} {
  const d = new Date(utcMs - PACIFIC_OFFSET_MS);
  return { hour: d.getUTCHours(), minute: d.getUTCMinutes() };
}

/**
 * Whether the current quarter-hour tick should execute the completion batch,
 * given the configured schedule and buffer.
 */
export function shouldRunCompletionJob(
  schedule: CompletionSchedule,
  buffer: CompletionBufferMinutes,
  pacificHour: number,
  pacificMinute: number
): boolean {
  if (pacificMinute !== buffer) return false;

  switch (schedule) {
    case 'hourly':
      return true;
    case 'twice_daily':
      return pacificHour === 0 || pacificHour === 12;
    case 'daily':
      return pacificHour === 0;
    default:
      return false;
  }
}

// ============================================================================
// Application settings keys
// ============================================================================

export const ACTIVITY_COMPLETION_SCHEDULE_KEY =
  'activity_completion_schedule' as const;
export const ACTIVITY_COMPLETION_BUFFER_KEY =
  'activity_completion_buffer_minutes' as const;

/**
 * Well-known ID for the seeded system user used by automated jobs.
 * Must match the database seed (0005_system_user_and_completion_permissions).
 */
export const CALENDAR_SYSTEM_USER_ID = 999;
