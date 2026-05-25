import type { UseFormReturn } from 'react-hook-form';
import { useEffect, useRef, useState, type RefObject } from 'react';

import type {
  ActivityFormData,
  ActivityResponse,
} from '@corpcal/shared/schemas';

import { hydrateActivityFormData } from '../lib/activity-form-hydrate';
import type { FormLookupData } from './useFormLookups';

/**
 * Resets the activity edit form once when server data changes **and** all
 * reference lookups have finished loading.
 *
 * Hydration is a single `form.reset()` call with a baseline shaped by
 * {@link hydrateActivityFormData}. Because the baseline uses the same sentinels
 * as the UI bindings (empty optional strings = `''`, empty rich text =
 * `EMPTY_RICH_TEXT_DOC`, empty optional IDs / enums = `undefined`,
 * empty nested venue strings = `null`), there is no controlled-input mismatch
 * on mount and no spurious dirty state to clear with a deferred second reset.
 *
 * Lookups are accessed via a ref so that individual query settlements do not
 * cascade repeated resets; only the ready-state transition (`lookupsReady`)
 * and the activity sync key trigger re-hydration.
 *
 * Exposes {@link isFormHydrated} and a monotonic {@link hydrationGeneration}
 * for lock-intent logic.
 *
 * On every hydrate (including the first), {@link isFormHydrated} is cleared before
 * `form.reset()` and restored on the next macrotask so {@link useEditLockIntent}
 * and TipTap controlled inputs can settle before change detection runs.
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
  const lookupsRef = useRef(lookups);
  lookupsRef.current = lookups;

  const [isFormHydrated, setIsFormHydrated] = useState(false);
  const [hydrationGeneration, setHydrationGeneration] = useState(0);

  const activitySyncKey = `${activity.id}\0${activity.lastUpdatedDateTime}`;
  const lookupsReady = !lookups.isLoading && !lookups.hasError;

  useEffect(() => {
    if (!lookupsReady) return;

    setIsFormHydrated(false);

    const mapped = hydrateActivityFormData(
      activityRef.current,
      lookupsRef.current
    );
    form.reset(mapped);
    initialFormDataRef.current = mapped;

    const timeoutId = window.setTimeout(() => {
      setIsFormHydrated(true);
      setHydrationGeneration((g) => g + 1);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activitySyncKey, lookupsReady, form]);

  return {
    isFormHydrated,
    hydrationGeneration,
    initialFormDataRef,
  };
}
