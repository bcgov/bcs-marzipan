import { toPacificHourMinute } from './activity-completion';
import { PERMISSIONS } from './auth/constants';

export const RECURRING_EDIT_LOCKOUT_REASON = 'time_lockout' as const;

export const RECURRING_EDIT_LOCKOUT_MESSAGE =
  'Editing activities is locked for the current lockout window.';

export type RecurringEditLockoutSettingsSlice = {
  isActive: boolean;
  startTimeOfDay: string;
  endTimeOfDay: string;
};

export function timeOfDayToMinutes(timeOfDay: string): number {
  const [hour, minute] = timeOfDay.split(':').map(Number);
  return hour * 60 + minute;
}

export function canBypassRecurringEditLockout(
  permissions: readonly string[]
): boolean {
  return permissions.includes(PERMISSIONS.ACTIVITIES.BYPASS_RECURRING_LOCKOUT);
}

/**
 * Whether the current Pacific time is within the recurring edit lockout window.
 * Start is inclusive; end is exclusive.
 */
export function isWithinRecurringEditLockoutWindow(
  settings: RecurringEditLockoutSettingsSlice,
  nowMs: number = Date.now()
): boolean {
  const { hour, minute } = toPacificHourMinute(nowMs);
  const currentMinutes = hour * 60 + minute;
  const startMinutes = timeOfDayToMinutes(String(settings.startTimeOfDay));
  const endMinutes = timeOfDayToMinutes(String(settings.endTimeOfDay));

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Returns true when recurring lockout is active, the current time is within
 * the window, and the user lacks activities.bypass_recurring_lockout.
 */
export function isUserBlockedByRecurringEditLockout(
  settings: RecurringEditLockoutSettingsSlice | null | undefined,
  permissions: readonly string[],
  nowMs: number = Date.now()
): boolean {
  if (!settings?.isActive) {
    return false;
  }

  if (!isWithinRecurringEditLockoutWindow(settings, nowMs)) {
    return false;
  }

  return !canBypassRecurringEditLockout(permissions);
}
