import { useEffect, useRef, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as draftsApi from '../api/draftsApi';
import type { DraftResponse } from '../api/draftsApi';
import { createLogger } from '../lib/logger';

const logger = createLogger('useAutoSave');

export interface UseAutoSaveOptions {
  /**
   * Debounce delay in milliseconds before saving
   * @default 2000
   */
  debounceMs?: number;

  /**
   * Whether autosave is enabled
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback when draft is successfully saved
   */
  onSaveSuccess?: (draft: DraftResponse) => void;

  /**
   * Callback when draft save fails
   */
  onSaveError?: (error: Error) => void;

  /**
   * Callback when draft is loaded
   */
  onDraftLoaded?: (draft: DraftResponse) => void;
}

/**
 * Hook for autosaving form data as drafts
 *
 * Features:
 * - Automatically saves form data after user stops typing (debounced)
 * - Loads existing draft on mount
 * - Provides methods to manually save, delete, and clear drafts
 * - Integrates with React Query for caching and optimistic updates
 *
 * @param userId - User ID (temporary until authentication is implemented)
 * @param formType - Type of form (e.g., 'activity', 'event')
 * @param formData - Current form data to autosave
 * @param entityId - Optional entity ID if editing existing item
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function CreateActivityForm() {
 *   const [formData, setFormData] = useState({});
 *   const { existingDraft, isSaving, lastSaved } = useAutoSave(
 *     1, // userId
 *     'activity',
 *     formData,
 *     undefined, // entityId (null for new)
 *     {
 *       debounceMs: 3000,
 *       onSaveSuccess: () => toast.success('Draft saved'),
 *     }
 *   );
 *
 *   // Load draft on mount
 *   useEffect(() => {
 *     if (existingDraft?.draftData) {
 *       setFormData(existingDraft.draftData);
 *     }
 *   }, [existingDraft]);
 *
 *   return (
 *     <form>
 *       {isSaving && <span>Saving...</span>}
 *       {lastSaved && <span>Last saved: {lastSaved.toLocaleTimeString()}</span>}
 *     </form>
 *   );
 * }
 * ```
 */
export function useAutoSave(
  userId: number,
  formType: string,
  formData: Record<string, any>,
  entityId?: number,
  options: UseAutoSaveOptions = {}
) {
  const {
    debounceMs = 2000,
    enabled = true,
    onSaveSuccess,
    onSaveError,
    onDraftLoaded,
  } = options;

  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Query key for caching
  const draftQueryKey = ['draft', userId, formType, entityId];

  // Load existing draft on mount
  const {
    data: existingDraft,
    isLoading: isDraftLoading,
    error: draftLoadError,
  } = useQuery<DraftResponse | null>({
    queryKey: draftQueryKey,
    queryFn: () => draftsApi.getDraft(userId, formType, entityId),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle draft loaded callback
  useEffect(() => {
    if (existingDraft && onDraftLoaded) {
      logger.debug('Draft loaded', { formType, entityId });
      onDraftLoaded(existingDraft);
    }
  }, [existingDraft, onDraftLoaded, formType, entityId]);

  // Save draft mutation
  const { mutate: saveDraftMutation } = useMutation({
    mutationFn: () =>
      draftsApi.saveDraft(userId, {
        formType,
        entityId,
        draftData: formData,
      }),
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: (draft) => {
      setLastSaved(new Date());
      setIsSaving(false);
      logger.debug('Draft saved successfully', { draftId: draft.id });

      // Update cache
      queryClient.setQueryData(draftQueryKey, draft);

      if (onSaveSuccess) {
        onSaveSuccess(draft);
      }
    },
    onError: (error: Error) => {
      setIsSaving(false);
      logger.error('Failed to save draft', error);

      if (onSaveError) {
        onSaveError(error);
      }
    },
  });

  // Delete draft mutation
  const { mutate: deleteDraftMutation } = useMutation({
    mutationFn: () => draftsApi.deleteDraftByForm(userId, formType, entityId),
    onSuccess: () => {
      logger.debug('Draft deleted successfully', { formType, entityId });
      // Invalidate cache
      void queryClient.invalidateQueries({ queryKey: draftQueryKey });
      setLastSaved(null);
    },
  });

  // Auto-save effect with debouncing
  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't save if form data is empty
    if (!formData || Object.keys(formData).length === 0) {
      return;
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      logger.debug('Auto-saving draft', { formType, entityId });
      saveDraftMutation();
    }, debounceMs);

    // Cleanup on unmount or before next save
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, enabled, userId, formType, entityId, debounceMs]);

  // Manual save function (bypasses debounce)
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    logger.debug('Manual save triggered', { formType, entityId });
    saveDraftMutation();
  }, [saveDraftMutation, formType, entityId]);

  // Delete draft function
  const deleteDraft = useCallback(() => {
    logger.debug('Deleting draft', { formType, entityId });
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
  };
}
