import type { UseFormReturn } from 'react-hook-form';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';

import {
  isWithinRecurringEditLockoutWindow,
  type RecurringEditLockoutSettingsSlice,
} from '@corpcal/shared';
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
  isRecurringLockoutBlocking: boolean;
  lockoutSubmitGenerationRef: MutableRefObject<number>;
};

/**
 * Latches recurring lockout blocking at clock boundaries, tears down active edit
 * sessions once, and wires the pre-lockout countdown toast.
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
  const [lockoutBoundaryRecheckTick, setLockoutBoundaryRecheckTick] =
    useState(0);
  /** Latches during lockout when the hook's isBlocked lags behind the clock at the boundary. */
  const [lockoutSessionBlocked, setLockoutSessionBlocked] = useState(false);

  useEffect(() => {
    if (isBlockedByRecurringLockout) {
      setLockoutSessionBlocked(true);
    }
  }, [isBlockedByRecurringLockout]);

  useEffect(() => {
    if (recurringLockoutSchedule == null) {
      setLockoutSessionBlocked(false);
      return;
    }
    if (!isWithinRecurringEditLockoutWindow(recurringLockoutSchedule)) {
      setLockoutSessionBlocked(false);
    }
  }, [recurringLockoutSchedule, lockoutBoundaryRecheckTick]);

  const isRecurringLockoutBlocking =
    isBlockedByRecurringLockout || lockoutSessionBlocked;

  const lockoutTeardownStartedRef = useRef(false);
  const isEditingRef = useRef(isEditing);
  const lockStateRef = useRef(lockState);
  const recurringLockoutScheduleRef = useRef(recurringLockoutSchedule);
  isEditingRef.current = isEditing;
  lockStateRef.current = lockState;
  recurringLockoutScheduleRef.current = recurringLockoutSchedule;

  useEffect(() => {
    if (!isRecurringLockoutBlocking) {
      lockoutTeardownStartedRef.current = false;
    }
  }, [isRecurringLockoutBlocking]);

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

  const handleRecurringLockoutStart = useCallback(() => {
    setLockoutSessionBlocked(true);
    // Force a React re-render so time-derived isBlocked/readOnly recompute at lockout start.
    setLockoutBoundaryRecheckTick((tick) => tick + 1);
    runLockoutTeardownIfNeeded();
  }, [runLockoutTeardownIfNeeded]);

  useLockoutEditCountdownToast({
    activityId,
    isEditing,
    lockState,
    schedule: recurringLockoutSchedule,
    isBlockedByRecurringLockout: isRecurringLockoutBlocking,
    permissions,
    onLockoutStart: handleRecurringLockoutStart,
  });

  const wasBlockedByRecurringLockoutRef = useRef(false);

  useEffect(() => {
    const wasBlocked = wasBlockedByRecurringLockoutRef.current;
    wasBlockedByRecurringLockoutRef.current = isRecurringLockoutBlocking;

    if (!isRecurringLockoutBlocking) {
      return;
    }

    const justBlocked = !wasBlocked;
    if (!justBlocked) {
      return;
    }

    runLockoutTeardownIfNeeded();
  }, [isRecurringLockoutBlocking, runLockoutTeardownIfNeeded]);

  return {
    isRecurringLockoutBlocking,
    lockoutSubmitGenerationRef,
  };
}
