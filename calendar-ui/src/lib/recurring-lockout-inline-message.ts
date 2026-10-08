import {
  formatCivilTime12h,
  type RecurringEditLockoutSettingsSlice,
} from '@corpcal/shared';

/**
 * Plain-text inline notice for activity pages during the active lockout window.
 */
export function getRecurringLockoutInlineMessage(
  schedule: Pick<RecurringEditLockoutSettingsSlice, 'endTimeOfDay'>
): string {
  const endTime = formatCivilTime12h(schedule.endTimeOfDay);
  return `Updates to activities are locked until ${endTime} PT. You can view in read-only.`;
}
