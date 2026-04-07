import { useWatch, type UseFormReturn } from 'react-hook-form';
import { useEffect, useRef, type RefObject } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';

import { computeFormChanges } from '../lib/activity-history-format';
import type { LockState } from './useActivityLock';

export const EDIT_LOCK_CONFLICT_TOAST =
  'Cannot edit. Another user has started editing this activity.';

/** Debounce before evaluating form changes, letting controlled-component churn settle. */
const CHANGE_DETECT_DEBOUNCE_MS = 80;

type UseEditLockIntentOptions = {
  formHydrated: boolean;
  hydrationGeneration: number;
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
 * hydrated. Uses {@link computeFormChanges} as the sole arbiter of whether a
 * change is meaningful, with a short debounce to let controlled-component
 * value churn settle before evaluating.
 */
export function useEditLockIntent({
  formHydrated,
  hydrationGeneration,
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
  const watched = useWatch({ control: form.control });

  useEffect(() => {
    autoAcquireAttemptedRef.current = false;
  }, [hydrationGeneration]);

  useEffect(() => {
    if (
      !formHydrated ||
      isEditing ||
      !mayEdit ||
      autoAcquireAttemptedRef.current
    ) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const baseline = initialFormDataRef.current;
      if (!baseline) return;

      const changes = computeFormChanges(baseline, form.getValues());
      if (changes.length === 0) return;

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
    }, CHANGE_DETECT_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [
    watched,
    formHydrated,
    hydrationGeneration,
    isEditing,
    mayEdit,
    acquire,
    form,
    setIsEditing,
    initialFormDataRef,
    onAcquireConflict,
  ]);

  useEffect(() => {
    if (lockState === 'idle') {
      autoAcquireAttemptedRef.current = false;
    }
  }, [lockState]);
}
