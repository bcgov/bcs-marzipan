import { toPacificHourMinute } from './activity-completion';
import { DEFAULT_RECURRING_EDIT_LOCKOUT_EXEMPT_ROLE_IDS } from './schemas/banner.schema';

export const RECURRING_EDIT_LOCKOUT_REASON = 'time_lockout' as const;

export const RECURRING_EDIT_LOCKOUT_MESSAGE =
  'Editing activities is locked for the current lockout window.';

export type RecurringEditLockoutSettingsSlice = {
  isActive: boolean;
  startTimeOfDay: string;
  endTimeOfDay: string;
  exemptRoleIds: unknown;
};

export function timeOfDayToMinutes(timeOfDay: string): number {
  const [hour, minute] = timeOfDay.split(':').map(Number);
  return hour * 60 + minute;
}

export function parseRecurringEditLockoutExemptRoleIds(
  exemptRoleIds: unknown
): number[] {
  if (!Array.isArray(exemptRoleIds)) {
    return [...DEFAULT_RECURRING_EDIT_LOCKOUT_EXEMPT_ROLE_IDS];
  }

  return exemptRoleIds
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
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
 * Returns true when recurring lockout is active and the role is not exempt.
 */
export function isRoleBlockedByRecurringEditLockout(
  settings: RecurringEditLockoutSettingsSlice | null | undefined,
  roleId: number,
  nowMs: number = Date.now()
): boolean {
  if (!settings?.isActive) {
    return false;
  }

  if (!isWithinRecurringEditLockoutWindow(settings, nowMs)) {
    return false;
  }

  const exemptRoleIds = parseRecurringEditLockoutExemptRoleIds(
    settings.exemptRoleIds
  );

  return !exemptRoleIds.includes(roleId);
}
