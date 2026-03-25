import type { UseFormReturn } from 'react-hook-form';
import { useEffect, useRef, useState, type RefObject } from 'react';

import type {
  ActivityFormData,
  ActivityResponse,
} from '@corpcal/shared/schemas';
import { canonicalizeActivityFormData } from '@corpcal/shared/utils';

import { activityToFormData } from '../lib/activity-form-mapper';
import type { FormLookupData } from './useFormLookups';

/**
 * Resets the activity edit form when server data or reference lookups change,
 * then runs a deferred second reset to clear spurious dirty state from
 * controlled fields. Exposes {@link isFormHydrated} and a monotonic
 * {@link hydrationGeneration} for lock-intent logic.
 */
export function useActivityEditFormHydration(
  activity: ActivityResponse,
  lookups: FormLookupData,
  form: UseFormReturn<ActivityFormData>
): {
  isFormHydrated: boolean;
  hydrationGeneration: number;
  initialFormDataRef: RefObject<ActivityFormData | null>;
} {
  const initialFormDataRef = useRef<ActivityFormData | null>(null);
  const activityRef = useRef(activity);
  activityRef.current = activity;

  const [isFormHydrated, setIsFormHydrated] = useState(false);
  const [hydrationGeneration, setHydrationGeneration] = useState(0);

  const activitySyncKey = `${activity.id}\0${activity.lastUpdatedDateTime}`;

  useEffect(() => {
    setIsFormHydrated(false);
    const mapped = canonicalizeActivityFormData(
      activityToFormData(activityRef.current, lookups)
    );
    form.reset(mapped);
    initialFormDataRef.current = mapped;

    const timeoutId = window.setTimeout(() => {
      if (initialFormDataRef.current) {
        form.reset(initialFormDataRef.current);
      }
      setIsFormHydrated(true);
      setHydrationGeneration((g) => g + 1);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activitySyncKey, lookups, form]);

  return {
    isFormHydrated,
    hydrationGeneration,
    initialFormDataRef,
  };
}
