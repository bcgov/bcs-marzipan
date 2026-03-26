import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCallback } from 'react';

import type {
  CreateSavedFilterBody,
  DuplicateSavedFilterBody,
  UpdateSavedFilterBody,
} from '@corpcal/shared/schemas';
import {
  createSavedFilter,
  deleteSavedFilter,
  duplicateSavedFilter,
  listSavedFilters,
  updateSavedFilter,
} from '@/api/savedFiltersApi';
import { showErrorToast } from '@/lib/error-toast';

function savedFilterQueryKey(contextKey: string) {
  return ['activity-saved-filters', contextKey] as const;
}

export function useSavedFilters(contextKey: string | null) {
  const queryClient = useQueryClient();

  const { data: savedFilters = [], isLoading } = useQuery({
    queryKey: savedFilterQueryKey(contextKey ?? ''),
    queryFn: () => listSavedFilters(contextKey!),
    enabled: contextKey != null && contextKey.length > 0,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const invalidate = useCallback(() => {
    if (contextKey) {
      void queryClient.invalidateQueries({
        queryKey: savedFilterQueryKey(contextKey),
      });
    }
  }, [contextKey, queryClient]);

  const createMutation = useMutation({
    mutationFn: (body: CreateSavedFilterBody) => createSavedFilter(body),
    onSuccess: (_data, variables) => {
      invalidate();
      toast.success(`Saved filter "${variables.name}" created`);
    },
    onError: (error) => {
      showErrorToast(error, 'Failed to create saved filter');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateSavedFilterBody }) =>
      updateSavedFilter(id, body),
    onSuccess: () => {
      invalidate();
      toast.success('Saved filter updated');
    },
    onError: (error) => {
      showErrorToast(error, 'Failed to update saved filter');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body?: DuplicateSavedFilterBody;
    }) => duplicateSavedFilter(id, body),
    onSuccess: (data) => {
      invalidate();
      toast.success(`Saved filter duplicated as "${data.name}"`);
    },
    onError: (error) => {
      showErrorToast(error, 'Failed to duplicate saved filter');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSavedFilter(id),
    onSuccess: () => {
      invalidate();
      toast.success('Saved filter deleted');
    },
    onError: (error) => {
      showErrorToast(error, 'Failed to delete saved filter');
    },
  });

  const defaultFilter = savedFilters.find((f) => f.isDefault) ?? null;

  return {
    savedFilters,
    isLoading,
    defaultFilter,
    createFilter: createMutation.mutateAsync,
    updateFilter: updateMutation.mutateAsync,
    duplicateFilter: duplicateMutation.mutateAsync,
    deleteFilter: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    invalidate,
  };
}

export type UseSavedFiltersReturn = ReturnType<typeof useSavedFilters>;
