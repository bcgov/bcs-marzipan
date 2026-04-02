import { toast } from 'sonner';

export type LockHandoffPendingPayload = {
  activityId: number;
  graceEndsAt: string;
  counterpartUsername: string;
  role: 'holder' | 'requester';
};

/**
 * Toast with live countdown for admin lock handoff grace period.
 * Returns a disposer to clear the interval (e.g. on route change).
 */
export function startLockHandoffCountdownToast(
  payload: LockHandoffPendingPayload
): () => void {
  const toastId = `lock-handoff-${payload.activityId}-${payload.graceEndsAt}`;
  const endMs = new Date(payload.graceEndsAt).getTime();
  const baseMessage =
    payload.role === 'holder'
      ? `${payload.counterpartUsername} will receive the edit lock when the timer ends. You can still save to transfer sooner.`
      : `You will receive the edit lock when the timer ends.`;

  const run = (): void => {
    const s = Math.max(0, Math.ceil((endMs - Date.now()) / 1000));
    toast.loading(`${baseMessage} (${s}s)`, {
      id: toastId,
      duration: Infinity,
    });
    if (s <= 0) {
      toast.dismiss(toastId);
    }
  };

  run();
  const interval = window.setInterval(() => {
    run();
    if (Date.now() >= endMs) {
      window.clearInterval(interval);
    }
  }, 1000);

  return () => {
    window.clearInterval(interval);
    toast.dismiss(toastId);
  };
}
