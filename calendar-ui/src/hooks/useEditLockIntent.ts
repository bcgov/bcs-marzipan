import type { UseFormReturn } from 'react-hook-form';
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
 *
 * Subscribes via {@link UseFormReturn.watch} so the hook does not re-render on
 * every field change (unlike `useWatch` on the whole form).
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
  const mayEditRef = useRef(mayEdit);
  const formHydratedRef = useRef(formHydrated);
  const isEditingRef = useRef(isEditing);

  mayEditRef.current = mayEdit;
  formHydratedRef.current = formHydrated;
  isEditingRef.current = isEditing;

  useEffect(() => {
    autoAcquireAttemptedRef.current = false;
  }, [hydrationGeneration]);

  useEffect(() => {
    if (lockState === 'idle') {
      autoAcquireAttemptedRef.current = false;
    }
  }, [lockState]);

  useEffect(() => {
    if (!formHydrated || isEditing || !mayEdit) {
      return undefined;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const scheduleAcquireCheck = () => {
      if (
        !formHydratedRef.current ||
        isEditingRef.current ||
        !mayEditRef.current ||
        autoAcquireAttemptedRef.current
      ) {
        return;
      }
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        timeoutId = undefined;
        if (
          !formHydratedRef.current ||
          isEditingRef.current ||
          !mayEditRef.current ||
          autoAcquireAttemptedRef.current
        ) {
          return;
        }
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
    };

    const subscription = form.watch(() => {
      scheduleAcquireCheck();
    });
    scheduleAcquireCheck();

    return () => {
      subscription.unsubscribe();
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    formHydrated,
    hydrationGeneration,
    mayEdit,
    isEditing,
    acquire,
    form,
    setIsEditing,
    initialFormDataRef,
    onAcquireConflict,
  ]);
}
