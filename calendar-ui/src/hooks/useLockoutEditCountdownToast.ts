import { useEffect, useRef } from 'react';

import {
  canBypassRecurringEditLockout,
  getMsUntilRecurringEditLockoutStart,
  getRecurringEditLockoutCountdownWindowMs,
  type RecurringLockoutBannerScheduleSlice,
} from '@corpcal/shared';
import {
  formatLockoutStartTimeLabel,
  startLockoutCountdownToast,
  type LockoutCountdownToastHandle,
} from '@/lib/lockout-countdown-toast';

import type { LockState } from './useActivityLock';

type UseLockoutEditCountdownToastOptions = {
  activityId: number;
  isEditing: boolean;
  lockState: LockState;
  schedule: RecurringLockoutBannerScheduleSlice | null;
  isBlockedByRecurringLockout: boolean;
  permissions: readonly string[];
};

/**
 * Warns non-bypass editors with a live countdown before the recurring lockout
 * window starts. The lead time is configured in recurring lockout settings.
 */
export function useLockoutEditCountdownToast({
  activityId,
  isEditing,
  lockState,
  schedule,
  isBlockedByRecurringLockout,
  permissions,
}: UseLockoutEditCountdownToastOptions): void {
  const handleRef = useRef<LockoutCountdownToastHandle | null>(null);
  const preWindowTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const dispose = (): void => {
      handleRef.current?.dispose();
      handleRef.current = null;
      if (preWindowTimeoutRef.current != null) {
        window.clearTimeout(preWindowTimeoutRef.current);
        preWindowTimeoutRef.current = null;
      }
    };

    if (
      canBypassRecurringEditLockout(permissions) ||
      isBlockedByRecurringLockout ||
      !isEditing ||
      lockState !== 'owned' ||
      schedule == null ||
      !schedule.isActive
    ) {
      dispose();
      return dispose;
    }

    const msUntilStart = getMsUntilRecurringEditLockoutStart(schedule);
    if (msUntilStart == null || msUntilStart <= 0) {
      dispose();
      return dispose;
    }

    const lockStartMs = Date.now() + msUntilStart;
    const lockStartTimeLabel = formatLockoutStartTimeLabel(
      schedule.startTimeOfDay
    );

    const countdownWindowMs =
      getRecurringEditLockoutCountdownWindowMs(schedule);

    const showCountdown = (): void => {
      handleRef.current?.dispose();
      handleRef.current = startLockoutCountdownToast({
        activityId,
        lockStartMs,
        lockStartTimeLabel,
      });
    };

    if (msUntilStart <= countdownWindowMs) {
      showCountdown();
    } else {
      preWindowTimeoutRef.current = window.setTimeout(
        showCountdown,
        msUntilStart - countdownWindowMs
      );
    }

    return dispose;
  }, [
    activityId,
    isBlockedByRecurringLockout,
    isEditing,
    lockState,
    permissions,
    schedule,
  ]);
}
