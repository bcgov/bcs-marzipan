import { useWatch, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import type { LockInfo } from '@/api/locksApi';

import type { LockState } from './useActivityLock';

const DEBOUNCE_MS = 45_000;
const HEARTBEAT_FALLBACK_MS = 90_000;
const IDLE_WARN_MS = 2 * 60 * 1000;
const IDLE_CHECK_MS = 15_000;

type UseEditLockSessionOptions = {
  form: UseFormReturn<ActivityFormData>;
  activityId: number;
  lockState: LockState;
  lock: LockInfo | null;
  isEditing: boolean;
  sendHeartbeat: () => Promise<void>;
};

/**
 * Debounced heartbeats on form activity, periodic fallback, and T−2 min idle warning.
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
  const watched = useWatch({ control: form.control });

  useEffect(() => {
    idleWarnShownRef.current = false;
  }, [activityId, lock?.idleExpiresAt]);

  useEffect(() => {
    if (lockState !== 'owned' || !lock || !isEditing) return;
    const t = setTimeout(() => {
      void sendHeartbeat();
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [watched, lockState, lock, isEditing, sendHeartbeat]);

  useEffect(() => {
    if (lockState !== 'owned' || !lock || !isEditing) return;
    const id = window.setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_FALLBACK_MS);
    return () => window.clearInterval(id);
  }, [lockState, lock?.id, isEditing, sendHeartbeat]);

  useEffect(() => {
    if (lockState !== 'owned' || !lock?.idleExpiresAt) return;

    const check = (): void => {
      const end = new Date(lock.idleExpiresAt).getTime();
      const msLeft = end - Date.now();
      if (msLeft <= 0) {
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
          id: `idle-lock-warn-${activityId}`,
        });
      }
      if (msLeft > IDLE_WARN_MS) {
        idleWarnShownRef.current = false;
      }
    };

    check();
    const id = window.setInterval(check, IDLE_CHECK_MS);
    return () => window.clearInterval(id);
  }, [lockState, lock?.idleExpiresAt, activityId, sendHeartbeat]);
}
