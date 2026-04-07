import type { UseFormReturn } from 'react-hook-form';
import { useEffect, useRef, type RefObject } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';

import { computeFormChanges } from '../lib/activity-history-format';
import type { LockState } from './useActivityLock';

export const EDIT_LOCK_CONFLICT_TOAST =
  'Cannot edit. Another user has started editing this activity.';

type UseEditLockIntentOptions = {
  formHydrated: boolean;
  hydrationGeneration: number;
  isDirty: boolean;
  dirtyFieldsCount: number;
  dirtyFieldsSignature: string;
  mayEdit: boolean;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  acquire: () => Promise<boolean>;
  lockState: LockState;
  form: UseFormReturn<ActivityFormData>;
  initialFormDataRef: RefObject<ActivityFormData | null>;
  onAcquireConflict: () => void;
};

/**
 * Acquires the activity edit lock on the first real change after the form is
 * hydrated. Relies on {@link formHydrated} so pre-hydration dirty noise from
 * controlled fields does not trigger acquisition.
 */
export function useEditLockIntent({
  formHydrated,
  hydrationGeneration,
  isDirty,
  dirtyFieldsCount,
  dirtyFieldsSignature,
  mayEdit,
  isEditing,
  setIsEditing,
  acquire,
  lockState,
  form,
  initialFormDataRef,
  onAcquireConflict,
}: UseEditLockIntentOptions): void {
  const autoAcquireAttemptedRef = useRef(false);

  useEffect(() => {
    autoAcquireAttemptedRef.current = false;
  }, [hydrationGeneration]);

  useEffect(() => {
    if (
      !formHydrated ||
      !isDirty ||
      dirtyFieldsCount === 0 ||
      isEditing ||
      !mayEdit ||
      autoAcquireAttemptedRef.current
    ) {
      return;
    }
    const baseline = initialFormDataRef.current;
    if (baseline) {
      const meaningful = computeFormChanges(baseline, form.getValues());
      if (meaningful.length === 0) {
        form.reset(baseline);
        return;
      }
    }

    autoAcquireAttemptedRef.current = true;
    setIsEditing(true);
    void acquire().then((ok) => {
      if (!ok) {
        setIsEditing(false);
        if (initialFormDataRef.current) {
          form.reset(initialFormDataRef.current);
        }
        onAcquireConflict();
      } else {
        autoAcquireAttemptedRef.current = false;
      }
    });
  }, [
    formHydrated,
    isDirty,
    dirtyFieldsCount,
    dirtyFieldsSignature,
    isEditing,
    mayEdit,
    acquire,
    form,
    setIsEditing,
    initialFormDataRef,
    onAcquireConflict,
  ]);

  useEffect(() => {
    if (lockState === 'idle' && !isDirty) {
      autoAcquireAttemptedRef.current = false;
    }
  }, [lockState, isDirty]);
}
