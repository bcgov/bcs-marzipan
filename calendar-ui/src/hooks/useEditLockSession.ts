import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import type { LockInfo } from '@/api/locksApi';
import {
  isActivitySocketConnectionBlocked,
  type ActivitySocketConnectionDisplay,
} from '@/lib/activity-socket-connection-display';
import {
  EDIT_LOCK_IDLE_EXPIRY_TOLERANCE_MS,
  EDIT_LOCK_IDLE_WARN_MS,
  getEditLockIdleMsLeft,
  isEditLockIdleDeadlinePassed,
} from '@/lib/edit-lock-idle-expiry';

import type {
  HeartbeatOutcome,
  LockRefreshResult,
  LockState,
} from './useActivityLock';

/** Client activity send interval; the server's activity throttle (10s) must stay below this. */
const ACTIVITY_THROTTLE_MS = 30_000;
/** Retry delay after a throttled activity heartbeat; exceeds the server's 10s window. */
const THROTTLED_RETRY_MS = 11_000;
const KEEPALIVE_MS = 90_000;
const ACTIVITY_EVENTS = [
  'keydown',
  'pointerdown',
  'wheel',
  'touchstart',
] as const;
const IDLE_CHECK_MS = 15_000;
/** Lock status poll while the activity socket is down (aligns with server cleanup cadence). */
const DISCONNECTED_LOCK_POLL_MS = 30_000;

type UseEditLockSessionOptions = {
  form: UseFormReturn<ActivityFormData>;
  activityId: number;
  lockState: LockState;
  lock: LockInfo | null;
  isEditing: boolean;
  sendHeartbeat: (options?: {
    keepAlive?: boolean;
  }) => Promise<HeartbeatOutcome>;
  getServerNowMs: () => number;
  /** Server idle deadline reached locally (same handling as heartbeat 410 / lockReleased). */
  onEditLockLost: () => void;
  socketConnection: ActivitySocketConnectionDisplay;
  refreshLockFromServer: () => Promise<LockRefreshResult>;
};

function idleWarnToastId(activityId: number): string {
  return `idle-lock-warn-${activityId}`;
}

/**
 * Activity-based heartbeats (form changes and keyboard/pointer input, throttled), a
 * connection keep-alive that does not extend the idle deadline, a T−1 min idle warning
 * (server clock), and local idle-deadline detection so lock loss is not delayed by
 * keep-alive when the socket is down.
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
  getServerNowMs,
  onEditLockLost,
  socketConnection,
  refreshLockFromServer,
}: UseEditLockSessionOptions): void {
  const idleWarnShownRef = useRef(false);
  const idleDeadlineHandledRef = useRef(false);
  const idleExpiresAt = lock?.idleExpiresAt;
  const onEditLockLostRef = useRef(onEditLockLost);
  onEditLockLostRef.current = onEditLockLost;

  useEffect(() => {
    idleWarnShownRef.current = false;
    idleDeadlineHandledRef.current = false;
  }, [activityId, idleExpiresAt]);

  useEffect(() => {
    if (lockState !== 'owned' || !isEditing) return undefined;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let lastSentAt = 0;
    let disposed = false;

    const send = () => {
      timeoutId = undefined;
      lastSentAt = Date.now();
      void sendHeartbeat().then((outcome) => {
        // Server rejected the activity as too soon (arrival jitter); retry once
        // its window has passed so the idle deadline still gets extended.
        if (outcome !== 'throttled' || disposed || timeoutId !== undefined) {
          return;
        }
        timeoutId = setTimeout(send, THROTTLED_RETRY_MS);
      });
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
      disposed = true;
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
    if (lockState !== 'owned' || !isEditing || !idleExpiresAt) return undefined;

    const notifyIfIdleDeadlinePassed = (): void => {
      if (idleDeadlineHandledRef.current) return;
      if (!isEditLockIdleDeadlinePassed(idleExpiresAt, getServerNowMs())) {
        return;
      }
      idleDeadlineHandledRef.current = true;
      toast.dismiss(idleWarnToastId(activityId));
      idleWarnShownRef.current = false;
      onEditLockLostRef.current();
    };

    const check = (): void => {
      const msLeft = getEditLockIdleMsLeft(idleExpiresAt, getServerNowMs());
      if (msLeft <= EDIT_LOCK_IDLE_EXPIRY_TOLERANCE_MS) {
        notifyIfIdleDeadlinePassed();
        return;
      }
      if (msLeft <= EDIT_LOCK_IDLE_WARN_MS && !idleWarnShownRef.current) {
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
      if (msLeft > EDIT_LOCK_IDLE_WARN_MS) {
        idleWarnShownRef.current = false;
      }
    };

    let expiryTimeoutId: ReturnType<typeof setTimeout> | undefined;
    const scheduleExpiryTimeout = (): void => {
      if (expiryTimeoutId !== undefined) {
        clearTimeout(expiryTimeoutId);
        expiryTimeoutId = undefined;
      }
      const msLeft = getEditLockIdleMsLeft(idleExpiresAt, getServerNowMs());
      const delay = Math.max(0, msLeft - EDIT_LOCK_IDLE_EXPIRY_TOLERANCE_MS);
      expiryTimeoutId = setTimeout(() => {
        expiryTimeoutId = undefined;
        notifyIfIdleDeadlinePassed();
      }, delay);
    };

    check();
    scheduleExpiryTimeout();
    const intervalId = window.setInterval(check, IDLE_CHECK_MS);

    const resyncClock = (): void => {
      if (document.visibilityState !== 'visible') return;
      check();
      scheduleExpiryTimeout();
    };
    window.addEventListener('focus', resyncClock);
    document.addEventListener('visibilitychange', resyncClock);

    return () => {
      window.clearInterval(intervalId);
      if (expiryTimeoutId !== undefined) {
        clearTimeout(expiryTimeoutId);
      }
      window.removeEventListener('focus', resyncClock);
      document.removeEventListener('visibilitychange', resyncClock);
      toast.dismiss(idleWarnToastId(activityId));
    };
  }, [
    activityId,
    getServerNowMs,
    idleExpiresAt,
    isEditing,
    lockState,
    sendHeartbeat,
  ]);

  useEffect(() => {
    if (lockState !== 'owned' || !isEditing) return undefined;
    if (!isActivitySocketConnectionBlocked(socketConnection)) return undefined;

    const syncLockStatus = (): void => {
      void refreshLockFromServer().then((state) => {
        if (state !== 'owned') {
          onEditLockLostRef.current();
        }
      });
    };

    syncLockStatus();
    const intervalId = window.setInterval(
      syncLockStatus,
      DISCONNECTED_LOCK_POLL_MS
    );

    const resyncOnVisible = (): void => {
      if (document.visibilityState === 'visible') {
        syncLockStatus();
      }
    };
    window.addEventListener('focus', resyncOnVisible);
    document.addEventListener('visibilitychange', resyncOnVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', resyncOnVisible);
      document.removeEventListener('visibilitychange', resyncOnVisible);
    };
  }, [isEditing, lockState, refreshLockFromServer, socketConnection]);
}
