/**
 * Activity reminder settings and helpers.
 *
 * Reminder day values are stored globally in application settings for now.
 * Per-user overrides can be layered later by resolving user-specific values first,
 * then falling back to these global defaults.
 */

/** `application_settings.key` for days before activity date for date-related reminders. */
export const ACTIVITY_REMINDER_LEAD_DAYS_KEY =
  'activity_reminder_lead_days' as const;

/** `application_settings.key` for stale reminder threshold in days since last update. */
export const ACTIVITY_REMINDER_STALE_DAYS_KEY =
  'activity_reminder_stale_days' as const;

export const DEFAULT_ACTIVITY_REMINDER_LEAD_DAYS = 7;
export const DEFAULT_ACTIVITY_REMINDER_STALE_DAYS = 14;

export const MIN_ACTIVITY_REMINDER_DAYS = 1;
export const MAX_ACTIVITY_REMINDER_DAYS = 365;

export function normalizeActivityReminderDays(
  raw: string | undefined,
  fallback: number
): number {
  if (raw == null || raw === '') return fallback;

  const parsed = Number.parseInt(raw, 10);
  if (
    !Number.isFinite(parsed) ||
    parsed < MIN_ACTIVITY_REMINDER_DAYS ||
    parsed > MAX_ACTIVITY_REMINDER_DAYS
  ) {
    return fallback;
  }

  return parsed;
}

export function invalidStoredActivityReminderDays(raw: string | undefined) {
  if (raw == null || raw === '') return false;

  const parsed = Number.parseInt(raw, 10);
  return (
    !Number.isFinite(parsed) ||
    parsed < MIN_ACTIVITY_REMINDER_DAYS ||
    parsed > MAX_ACTIVITY_REMINDER_DAYS
  );
}
