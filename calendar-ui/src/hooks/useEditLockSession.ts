import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import type { LockInfo } from '@/api/locksApi';

import type { LockState } from './useActivityLock';

const ACTIVITY_THROTTLE_MS = 30_000;
const KEEPALIVE_MS = 90_000;
const ACTIVITY_EVENTS = [
  'keydown',
  'pointerdown',
  'wheel',
  'touchstart',
] as const;
const IDLE_WARN_MS = 2 * 60 * 1000;
const IDLE_CHECK_MS = 15_000;

type UseEditLockSessionOptions = {
  form: UseFormReturn<ActivityFormData>;
  activityId: number;
  lockState: LockState;
  lock: LockInfo | null;
  isEditing: boolean;
  sendHeartbeat: (options?: { keepAlive?: boolean }) => Promise<void>;
};

function idleWarnToastId(activityId: number): string {
  return `idle-lock-warn-${activityId}`;
}

/**
 * Activity-based heartbeats (form changes and keyboard/pointer input, throttled), a
 * connection keep-alive that does not extend the idle deadline, and a T−2 min idle warning.
 *
 * Heartbeat effects intentionally omit `lock` from deps: `sendHeartbeat` uses `lockRef`,
 * and including `lock` would re-run the effect after every heartbeat.
 */
export function useEditLockSession({
  form,
  activityId,
  lockState,
  lock,
  isEditing,
  sendHeartbeat,
}: UseEditLockSessionOptions): void {
  const idleWarnShownRef = useRef(false);
  const idleExpiresAt = lock?.idleExpiresAt;

  useEffect(() => {
    idleWarnShownRef.current = false;
  }, [activityId, idleExpiresAt]);

  useEffect(() => {
    if (lockState !== 'owned' || !isEditing) return undefined;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let lastSentAt = 0;

    const send = () => {
      timeoutId = undefined;
      lastSentAt = Date.now();
      void sendHeartbeat();
    };

    // Leading-edge throttle: first activity extends immediately, later activity
    // within the window is coalesced into one trailing heartbeat.
    const onActivity = () => {
      if (timeoutId !== undefined) return;
      const wait = Math.max(0, lastSentAt + ACTIVITY_THROTTLE_MS - Date.now());
      if (wait === 0) {
        send();
      } else {
        timeoutId = setTimeout(send, wait);
      }
    };

    // Only user-originated field changes count; programmatic setValue/reset
    // (hydration, live sync) must not extend the idle deadline.
    const subscription = form.watch((_values, info) => {
      if (info.type === 'change') onActivity();
    });
    ACTIVITY_EVENTS.forEach((name) =>
      window.addEventListener(name, onActivity, { passive: true })
    );

    return () => {
      subscription.unsubscribe();
      ACTIVITY_EVENTS.forEach((name) =>
        window.removeEventListener(name, onActivity)
      );
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [form, isEditing, lockState, sendHeartbeat]);

  useEffect(() => {
    if (lockState !== 'owned' || !isEditing) return;
    // Lease renewal only; does not extend the idle deadline.
    const id = window.setInterval(() => {
      void sendHeartbeat({ keepAlive: true });
    }, KEEPALIVE_MS);
    return () => window.clearInterval(id);
  }, [lockState, isEditing, sendHeartbeat]);

  useEffect(() => {
    if (lockState !== 'owned' || !idleExpiresAt) return;

    const check = (): void => {
      const end = new Date(idleExpiresAt).getTime();
      const msLeft = end - Date.now();
      if (msLeft <= 0) {
        toast.dismiss(idleWarnToastId(activityId));
        idleWarnShownRef.current = false;
        return;
      }
      if (msLeft <= IDLE_WARN_MS && !idleWarnShownRef.current) {
        idleWarnShownRef.current = true;
        toast.warning('Edit session ending soon', {
          description:
            'Your edit lock will expire due to inactivity. Click Extend to keep editing.',
          duration: 60_000,
          action: {
            label: 'Extend',
            onClick: () => {
              void sendHeartbeat();
              idleWarnShownRef.current = false;
            },
          },
          id: idleWarnToastId(activityId),
        });
      }
      if (msLeft > IDLE_WARN_MS) {
        idleWarnShownRef.current = false;
      }
    };

    check();
    const id = window.setInterval(check, IDLE_CHECK_MS);
    return () => {
      window.clearInterval(id);
      toast.dismiss(idleWarnToastId(activityId));
    };
  }, [lockState, idleExpiresAt, activityId, sendHeartbeat]);
}
