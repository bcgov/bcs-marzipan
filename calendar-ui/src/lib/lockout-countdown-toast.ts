import { toast } from 'sonner';

import {
  formatCivilTime12h,
  type RecurringEditLockoutSettingsSlice,
} from '@corpcal/shared';

import {
  formatCountdownRemaining,
  startCountdownLoadingToast,
} from './countdown-loading-toast';
import { getRecurringLockoutInlineMessage } from './recurring-lockout-inline-message';

const DISCARD_TOAST_DURATION_MS = 8000;

export type LockoutCountdownToastHandle = {
  dispose: () => void;
};

export function startLockoutCountdownToast(options: {
  activityId: number;
  lockStartMs: number;
  lockStartTimeLabel: string;
}): LockoutCountdownToastHandle {
  const toastId = `lockout-countdown-${options.activityId}-${options.lockStartMs}`;
  const title = `Activity editing will be locked at ${options.lockStartTimeLabel} PT.`;

  return startCountdownLoadingToast({
    toastId,
    endMs: options.lockStartMs,
    variant: 'warning',
    getContent: (secondsLeft) => ({
      title,
      description: `Unsaved changes will be lost in ${formatCountdownRemaining(secondsLeft)}.`,
    }),
  });
}

export function showLockoutChangesDiscardedToast(
  schedule: Pick<RecurringEditLockoutSettingsSlice, 'endTimeOfDay'>,
  activityId: number
): void {
  toast.warning('Unsaved changes discarded', {
    id: `lockout-discarded-${activityId}`,
    description: `${getRecurringLockoutInlineMessage(schedule)}`,
    duration: DISCARD_TOAST_DURATION_MS,
  });
}

export function formatLockoutStartTimeLabel(startTimeOfDay: string): string {
  return formatCivilTime12h(startTimeOfDay);
}
