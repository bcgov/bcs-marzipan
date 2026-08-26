import type { UseFormReturn } from 'react-hook-form';
import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';

import type { RecurringEditLockoutSettingsSlice } from '@corpcal/shared';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import { teardownEditSessionForLockout } from '@/lib/teardown-edit-session-for-lockout';

import type { LockState } from './useActivityLock';
import { useLockoutEditCountdownToast } from './useLockoutEditCountdownToast';

export type UseRecurringLockoutSessionOptions = {
  activityId: number;
  isBlockedByRecurringLockout: boolean;
  recurringLockoutSchedule: RecurringEditLockoutSettingsSlice | null;
  permissions: readonly string[];
  isEditing: boolean;
  lockState: LockState;
  form: UseFormReturn<ActivityFormData>;
  initialFormDataRef: MutableRefObject<ActivityFormData | null>;
  setFormUiEpoch: (update: (epoch: number) => number) => void;
  setIsEditing: (value: boolean) => void;
  applyExternalLockReleased: () => void;
  releaseWithRetry: () => Promise<void>;
  refreshActivity: () => void | Promise<void>;
  closeSubmitModals: () => void;
};

export type UseRecurringLockoutSessionResult = {
  lockoutSubmitGenerationRef: MutableRefObject<number>;
};

/**
 * Tears down active edit sessions when recurring lockout begins and wires
 * the pre-lockout countdown toast.
 */
export function useRecurringLockoutSession({
  activityId,
  isBlockedByRecurringLockout,
  recurringLockoutSchedule,
  permissions,
  isEditing,
  lockState,
  form,
  initialFormDataRef,
  setFormUiEpoch,
  setIsEditing,
  applyExternalLockReleased,
  releaseWithRetry,
  refreshActivity,
  closeSubmitModals,
}: UseRecurringLockoutSessionOptions): UseRecurringLockoutSessionResult {
  const lockoutSubmitGenerationRef = useRef(0);

  const lockoutTeardownStartedRef = useRef(false);
  const isEditingRef = useRef(isEditing);
  const lockStateRef = useRef(lockState);
  const recurringLockoutScheduleRef = useRef(recurringLockoutSchedule);
  isEditingRef.current = isEditing;
  lockStateRef.current = lockState;
  recurringLockoutScheduleRef.current = recurringLockoutSchedule;

  useEffect(() => {
    if (!isBlockedByRecurringLockout) {
      lockoutTeardownStartedRef.current = false;
    }
  }, [isBlockedByRecurringLockout]);

  const runLockoutTeardownIfNeeded = useCallback(() => {
    if (lockoutTeardownStartedRef.current) {
      return;
    }

    const schedule = recurringLockoutScheduleRef.current;
    const editing = isEditingRef.current;
    const currentLockState = lockStateRef.current;

    if (schedule == null) {
      return;
    }
    if (!editing && currentLockState !== 'owned') {
      return;
    }

    lockoutTeardownStartedRef.current = true;

    void teardownEditSessionForLockout({
      activityId,
      schedule,
      lockoutSubmitGenerationRef,
      isEditing: editing,
      lockState: currentLockState,
      initialFormData: initialFormDataRef.current,
      form,
      setFormUiEpoch,
      setIsEditing,
      applyExternalLockReleased,
      releaseWithRetry,
      closeSubmitModals,
    }).then(() => {
      void refreshActivity();
    });
  }, [
    activityId,
    applyExternalLockReleased,
    closeSubmitModals,
    form,
    initialFormDataRef,
    refreshActivity,
    releaseWithRetry,
    setFormUiEpoch,
    setIsEditing,
  ]);

  useLockoutEditCountdownToast({
    activityId,
    isEditing,
    lockState,
    schedule: recurringLockoutSchedule,
    isBlockedByRecurringLockout,
    permissions,
  });

  const wasBlockedByRecurringLockoutRef = useRef(false);

  useEffect(() => {
    const wasBlocked = wasBlockedByRecurringLockoutRef.current;
    wasBlockedByRecurringLockoutRef.current = isBlockedByRecurringLockout;

    if (!isBlockedByRecurringLockout) {
      return;
    }

    const justBlocked = !wasBlocked;
    if (!justBlocked) {
      return;
    }

    runLockoutTeardownIfNeeded();
  }, [isBlockedByRecurringLockout, runLockoutTeardownIfNeeded]);

  return {
    lockoutSubmitGenerationRef,
  };
}
