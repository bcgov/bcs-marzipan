import { useEffect, useRef } from 'react';

import {
  canBypassRecurringEditLockout,
  getMsUntilRecurringEditLockoutStart,
  type RecurringEditLockoutSettingsSlice,
} from '@corpcal/shared';
import {
  formatLockoutStartTimeLabel,
  LOCKOUT_EDIT_COUNTDOWN_WINDOW_MS,
  startLockoutCountdownToast,
  type LockoutCountdownToastHandle,
} from '@/lib/lockout-countdown-toast';

import type { LockState } from './useActivityLock';

type UseLockoutEditCountdownToastOptions = {
  activityId: number;
  isEditing: boolean;
  lockState: LockState;
  schedule: RecurringEditLockoutSettingsSlice | null;
  isBlockedByRecurringLockout: boolean;
  permissions: readonly string[];
};

/**
 * Warns non-bypass editors with a live countdown in the last three minutes
 * before the recurring lockout window starts.
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

    const showCountdown = (): void => {
      handleRef.current?.dispose();
      handleRef.current = startLockoutCountdownToast({
        activityId,
        lockStartMs,
        lockStartTimeLabel,
      });
    };

    if (msUntilStart <= LOCKOUT_EDIT_COUNTDOWN_WINDOW_MS) {
      showCountdown();
    } else {
      preWindowTimeoutRef.current = window.setTimeout(
        showCountdown,
        msUntilStart - LOCKOUT_EDIT_COUNTDOWN_WINDOW_MS
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
