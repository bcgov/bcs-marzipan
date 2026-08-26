import { toast } from 'sonner';

import {
  formatCountdownRemaining,
  startCountdownLoadingToast,
} from './countdown-loading-toast';

export type LockHandoffPendingPayload = {
  activityId: number;
  graceEndsAt: string;
  counterpartUsername: string;
  role: 'holder' | 'requester';
};

export type LockHandoffResolvedOutcome =
  | 'completed'
  | 'cancelled'
  | 'aborted_no_holder_lock';

export type LockHandoffResolvedPayload = {
  activityId: number;
  outcome: LockHandoffResolvedOutcome;
  role: 'holder' | 'requester';
  counterpartUsername: string;
  newLockHolder?: { userId: number; username: string };
};

export type LockHandoffToastHandle = {
  dispose: () => void;
  /** Requester: call when this user has acquired the edit lock (e.g. after `lockAcquired`). */
  notifyLockAcquired: () => void;
  /**
   * Holder: show cancellation message. Requester: dismiss countdown without success toast.
   */
  notifyHandoffCancelled: () => void;
  /**
   * Requester during handoff: `lockAcquired` fired but terminal copy comes from `lockHandoffResolved`;
   * dismiss the loading/countdown toast only (no success toast yet).
   */
  dismissLoadingOnly: () => void;
};

const SUCCESS_TOAST_DURATION_MS = 5000;
/** Shown to holder and requester when a pending force handoff is cancelled (must not reuse loading `toastId`). */
const HANDOFF_CANCELLED_TOAST_DURATION_MS = 5000;

/**
 * Toast with live countdown for admin lock handoff grace period.
 * Requester: after countdown, shows "Unlocking activity..." until {@link LockHandoffToastHandle.notifyLockAcquired}.
 * Returns a handle with `dispose` (e.g. on route change) and `notifyLockAcquired` for the success toast.
 */
export function startLockHandoffCountdownToast(
  payload: LockHandoffPendingPayload
): LockHandoffToastHandle {
  const toastId = `lock-handoff-${payload.activityId}-${payload.graceEndsAt}`;
  const cancelledInfoToastId = `${toastId}-cancelled-info`;
  const endMs = new Date(payload.graceEndsAt).getTime();
  const title =
    payload.role === 'holder'
      ? `${payload.counterpartUsername} has requested to edit this activity. Please save your changes.`
      : 'Requesting the current editor to save their changes.';
  const countdownDescriptionPrefix =
    payload.role === 'holder'
      ? 'Unsaved changes will be lost in'
      : 'The activity will be unlocked in';

  let countdownHandle: ReturnType<typeof startCountdownLoadingToast> | null =
    null;
  let disposed = false;
  let completed = false;

  const stopCountdown = (): void => {
    countdownHandle?.dispose();
    countdownHandle = null;
  };

  countdownHandle = startCountdownLoadingToast({
    toastId,
    endMs,
    getContent: (secondsLeft) => {
      if (payload.role === 'requester' && secondsLeft <= 0) {
        return { title: 'Unlocking activity...' };
      }
      return {
        title,
        description: `${countdownDescriptionPrefix} ${formatCountdownRemaining(secondsLeft)}.`,
      };
    },
    onExpired: payload.role === 'requester' ? () => false : undefined,
  });

  const notifyLockAcquired = (): void => {
    if (disposed || completed || payload.role !== 'requester') return;
    completed = true;
    stopCountdown();
    toast.success('Success! The activity is ready to edit.', {
      id: toastId,
      duration: SUCCESS_TOAST_DURATION_MS,
    });
  };

  const notifyHandoffCancelled = (): void => {
    if (disposed || completed) return;
    completed = true;
    stopCountdown();
    const message =
      payload.role === 'holder'
        ? 'The unlock request has been cancelled. You can continue editing the activity.'
        : 'Unlock request cancelled.';
    toast.info(message, {
      id: cancelledInfoToastId,
      duration: HANDOFF_CANCELLED_TOAST_DURATION_MS,
    });
  };

  const dismissLoadingOnly = (): void => {
    if (disposed || completed) return;
    stopCountdown();
  };

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    stopCountdown();
    toast.dismiss(cancelledInfoToastId);
  };

  return {
    dispose,
    notifyLockAcquired,
    notifyHandoffCancelled,
    dismissLoadingOnly,
  };
}
