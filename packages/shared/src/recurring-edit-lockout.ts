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

export type RecurringLockoutBannerScheduleSlice =
  RecurringEditLockoutSettingsSlice & {
    bannerLeadMinutes: number;
  };

const MINUTES_PER_DAY = 24 * 60;
const PACIFIC_OFFSET_MS = 7 * 60 * 60 * 1000;

export function timeOfDayToMinutes(timeOfDay: string): number {
  const [hour, minute] = timeOfDay.split(':').map(Number);
  return hour * 60 + minute;
}

function pacificDateParts(utcMs: number): {
  year: number;
  month: number;
  day: number;
  minuteOfDay: number;
} {
  const d = new Date(utcMs - PACIFIC_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    minuteOfDay: d.getUTCHours() * 60 + d.getUTCMinutes(),
  };
}

function pacificMinuteOfDayToUtcMs(
  year: number,
  month: number,
  day: number,
  minuteOfDay: number
): number {
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  return Date.UTC(year, month - 1, day, hour, minute, 0, 0) + PACIFIC_OFFSET_MS;
}

function msUntilPacificMinuteOfDay(
  nowMs: number,
  targetMinuteOfDay: number,
  options?: { forceNextCalendarDay?: boolean }
): number {
  const parts = pacificDateParts(nowMs);
  let { year, month, day } = parts;
  const currentMinuteOfDay = parts.minuteOfDay;

  let useNextDay = options?.forceNextCalendarDay ?? false;
  if (!useNextDay && targetMinuteOfDay <= currentMinuteOfDay) {
    useNextDay = true;
  }

  if (useNextDay) {
    const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
    year = nextDay.getUTCFullYear();
    month = nextDay.getUTCMonth() + 1;
    day = nextDay.getUTCDate();
  }

  const targetMs = pacificMinuteOfDayToUtcMs(
    year,
    month,
    day,
    targetMinuteOfDay
  );
  return Math.max(1, targetMs - nowMs);
}

export function getRecurringLockoutBannerVisibilityMinutes(
  settings: Pick<
    RecurringLockoutBannerScheduleSlice,
    'startTimeOfDay' | 'endTimeOfDay' | 'bannerLeadMinutes'
  >
): { bannerStartMinutes: number; endMinutes: number } {
  const startMinutes = timeOfDayToMinutes(String(settings.startTimeOfDay));
  const endMinutes = timeOfDayToMinutes(String(settings.endTimeOfDay));
  const leadMinutes = Math.max(0, settings.bannerLeadMinutes);
  const bannerStartMinutes =
    (startMinutes - leadMinutes + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  return { bannerStartMinutes, endMinutes };
}

/**
 * Whether the current Pacific time is within the recurring lockout banner window.
 * Visible from (startTimeOfDay - bannerLeadMinutes) through endTimeOfDay (exclusive).
 */
export function isWithinRecurringLockoutBannerWindow(
  settings: RecurringLockoutBannerScheduleSlice,
  nowMs: number = Date.now()
): boolean {
  if (!settings.isActive) {
    return false;
  }

  const { hour, minute } = toPacificHourMinute(nowMs);
  const currentMinutes = hour * 60 + minute;
  const { bannerStartMinutes, endMinutes } =
    getRecurringLockoutBannerVisibilityMinutes(settings);

  if (bannerStartMinutes > endMinutes) {
    return currentMinutes >= bannerStartMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= bannerStartMinutes && currentMinutes < endMinutes;
}

/**
 * Milliseconds until the next banner show or hide boundary in Pacific time.
 * Returns null when lockout banner settings are inactive.
 */
export function getNextRecurringLockoutBannerBoundaryMs(
  settings: RecurringLockoutBannerScheduleSlice,
  nowMs: number = Date.now()
): number | null {
  if (!settings.isActive) {
    return null;
  }

  const { hour, minute } = toPacificHourMinute(nowMs);
  const currentMinutes = hour * 60 + minute;
  const startMinutes = timeOfDayToMinutes(String(settings.startTimeOfDay));
  const { bannerStartMinutes, endMinutes } =
    getRecurringLockoutBannerVisibilityMinutes(settings);
  const inWindow = isWithinRecurringLockoutBannerWindow(settings, nowMs);

  if (inWindow) {
    const inLockout = isWithinRecurringEditLockoutWindow(settings, nowMs);

    if (!inLockout) {
      const msUntilLockStart = msUntilPacificMinuteOfDay(nowMs, startMinutes);
      const msUntilHide =
        bannerStartMinutes > endMinutes && currentMinutes >= bannerStartMinutes
          ? msUntilPacificMinuteOfDay(nowMs, endMinutes, {
              forceNextCalendarDay: true,
            })
          : msUntilPacificMinuteOfDay(nowMs, endMinutes);

      return Math.min(msUntilLockStart, msUntilHide);
    }

    if (
      bannerStartMinutes > endMinutes &&
      currentMinutes >= bannerStartMinutes
    ) {
      return msUntilPacificMinuteOfDay(nowMs, endMinutes, {
        forceNextCalendarDay: true,
      });
    }

    return msUntilPacificMinuteOfDay(nowMs, endMinutes);
  }

  return msUntilPacificMinuteOfDay(nowMs, bannerStartMinutes);
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
