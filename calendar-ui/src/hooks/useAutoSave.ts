import { useEffect, useRef, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as draftsApi from '../api/draftsApi';
import type { DraftResponse } from '../api/draftsApi';
import { createLogger } from '../lib/logger';
import { useAuth } from './useAuth';

const logger = createLogger('useAutoSave');

// Add an optional callback to notify when a draft is created for the first time
export interface UseAutoSaveOptions {
  debounceMs?: number;
  enabled?: boolean;
  isDirty?: boolean;
  onSaveSuccess?: (draft: DraftResponse) => void;
  onSaveError?: (error: Error) => void;
  onDraftLoaded?: (draft: DraftResponse) => void;
  onFirstDraftCreate?: () => void;
}

export function useAutoSave(
  formType: string,
  formData: Record<string, any>,
  entityId?: number,
  options: UseAutoSaveOptions = {},
  defaultFormData?: Record<string, any>
) {
  // Get userId from auth context
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;
  const {
    debounceMs = 2000,
    enabled = true,
    isDirty = true,
    onSaveSuccess,
    onSaveError,
    onDraftLoaded,
  } = options;

  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedDataRef = useRef<string | null>(null);
  // Always use the provided defaultFormData for initialFormDataRef
  const initialFormDataRef = useRef<string | null>(null);
  const lastProcessedDataRef = useRef<string | null>(null);
  // Track if a draft was created after mount
  const draftCreatedRef = useRef(false);

  // Query key for caching - use null-safe userId
  const draftQueryKey = [
    'draft',
    userId ?? 'unauthenticated',
    formType,
    entityId,
  ];

  // Load existing draft on mount (only when authenticated)
  const {
    data: existingDraft,
    isLoading: isDraftLoading,
    error: draftLoadError,
  } = useQuery<DraftResponse | null>({
    queryKey: draftQueryKey,
    queryFn: () => {
      if (!userId) {
        return Promise.resolve(null);
      }
      return draftsApi.getDraft(userId, formType, entityId);
    },
    enabled: enabled && isAuthenticated && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Call onFirstDraftCreate only once after mount if needed
  useEffect(() => {
    if (!draftCreatedRef.current && options?.onFirstDraftCreate) {
      draftCreatedRef.current = true;
      options.onFirstDraftCreate();
    }
  }, [options]);

  // Handle draft loaded callback
  useEffect(() => {
    if (existingDraft && onDraftLoaded) {
      onDraftLoaded(existingDraft);
    }
    // Initialize lastSavedDataRef when a draft is loaded
    if (existingDraft?.draftData) {
      lastSavedDataRef.current = JSON.stringify(existingDraft.draftData);
    }
  }, [existingDraft, onDraftLoaded, formType, entityId]);

  // Capture initial form data on first render only (after mount)
  useEffect(() => {
    if (initialFormDataRef.current === null && defaultFormData) {
      initialFormDataRef.current = JSON.stringify(defaultFormData);
    }
  }, [defaultFormData]);

  // Expose a function to reset the initial form data reference (for 'start fresh')
  const resetInitialFormData = useCallback(() => {
    if (defaultFormData) {
      initialFormDataRef.current = JSON.stringify(defaultFormData);
      lastProcessedDataRef.current = JSON.stringify(defaultFormData);
    }
  }, [defaultFormData]);

  // Save draft mutation
  const { mutate: saveDraftMutation } = useMutation({
    mutationFn: () => {
      if (!userId) {
        return Promise.reject(new Error('User not authenticated'));
      }
      return draftsApi.saveDraft(userId, {
        formType,
        entityId,
        draftData: formData,
      });
    },
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: (draft) => {
      setLastSaved(new Date());
      setIsSaving(false);
      // Store the saved data for comparison
      lastSavedDataRef.current = JSON.stringify(formData);

      // Update cache
      queryClient.setQueryData(draftQueryKey, draft);

      if (onSaveSuccess) {
        onSaveSuccess(draft);
      }
    },
    onError: (error: Error) => {
      setIsSaving(false);
      logger.error('Draft save failed', error);
      if (onSaveError) {
        onSaveError(error);
      }
    },
  });

  // Delete draft mutation
  const { mutate: deleteDraftMutation } = useMutation({
    mutationFn: () => {
      if (!userId) {
        return Promise.reject(new Error('User not authenticated'));
      }
      return draftsApi.deleteDraftByForm(userId, formType, entityId);
    },
    onMutate: () => {
      // Optimistically clear cache immediately when mutation starts
      queryClient.setQueryData(draftQueryKey, null);
      setLastSaved(null);
      lastSavedDataRef.current = null;
    },
    onSuccess: () => {
      // Cache already cleared in onMutate
      // Invalidate to ensure fresh data on next mount
      void queryClient.invalidateQueries({ queryKey: draftQueryKey });
    },
    onError: (error: unknown) => {
      logger.error('Draft delete failed', error);
      void queryClient.invalidateQueries({ queryKey: draftQueryKey });
    },
  });

  // Auto-save effect with debouncing
  useEffect(() => {
    if (!enabled || !userId || !isDirty) {
      return;
    }

    if (!formData || Object.keys(formData).length === 0) {
      return;
    }

    if (initialFormDataRef.current === null) {
      return;
    }

    const currentDataString = JSON.stringify(formData);

    if (initialFormDataRef.current === currentDataString) {
      return;
    }

    if (
      lastSavedDataRef.current &&
      lastSavedDataRef.current === currentDataString
    ) {
      return;
    }

    if (lastProcessedDataRef.current === currentDataString) {
      return;
    }

    // Data has changed, update our tracking
    lastProcessedDataRef.current = currentDataString;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (!formData || Object.keys(formData).length === 0) {
        return;
      }
      if (initialFormDataRef.current === null) {
        return;
      }
      if (initialFormDataRef.current === JSON.stringify(formData)) {
        return;
      }
      if (
        lastSavedDataRef.current &&
        lastSavedDataRef.current === JSON.stringify(formData)
      ) {
        return;
      }
      const currentDataString = JSON.stringify(formData);
      if (lastSavedDataRef.current === currentDataString) {
        return;
      }
      let initial: Record<string, any> = {};
      let current: Record<string, any> = {};
      try {
        initial = JSON.parse(initialFormDataRef.current || '{}');
        current = JSON.parse(currentDataString);
      } catch {
        return;
      }
      let hasRealChange = false;
      for (const key of new Set([
        ...Object.keys(initial),
        ...Object.keys(current),
      ])) {
        const fromVal = initial[key];
        const toVal = current[key];
        if (
          (fromVal === null && toVal === undefined) ||
          (fromVal === undefined && toVal === null)
        ) {
          continue;
        }
        if (JSON.stringify(fromVal) !== JSON.stringify(toVal)) {
          hasRealChange = true;
          break;
        }
      }
      if (hasRealChange) {
        saveDraftMutation();
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, enabled, userId, debounceMs, saveDraftMutation, isDirty]);

  // Manual save function (bypasses debounce)
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveDraftMutation();
  }, [saveDraftMutation, formType, entityId]);

  // Delete draft function
  const deleteDraft = useCallback(() => {
    deleteDraftMutation();
  }, [deleteDraftMutation, formType, entityId]);

  // Clear draft and reset state
  const clearDraft = useCallback(() => {
    deleteDraft();
    setLastSaved(null);
  }, [deleteDraft]);

  return {
    /** Existing draft data loaded from server */
    existingDraft,
    /** Whether a draft is currently being loaded */
    isDraftLoading,
    /** Error loading draft */
    draftLoadError,
    /** Whether a save operation is in progress */
    isSaving,
    /** Timestamp of last successful save */
    lastSaved,
    /** Manually trigger save (bypasses debounce) */
    saveNow,
    /** Delete the current draft */
    deleteDraft,
    /** Clear draft and reset state */
    clearDraft,
    /** Reset the initial form data reference (call after 'start fresh') */
    resetInitialFormData,
  };
}
