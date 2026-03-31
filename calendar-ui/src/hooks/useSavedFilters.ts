import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCallback, useMemo } from 'react';

import type {
  CreateSavedFilterBody,
  DuplicateSavedFilterBody,
  SavedFilterResponse,
  UpdateSavedFilterBody,
} from '@corpcal/shared/schemas';
import {
  createSavedFilter,
  deleteSavedFilter,
  duplicateSavedFilter,
  listSavedFilters,
  setMyDefaultSavedFilter,
  updateSavedFilter,
} from '@/api/savedFiltersApi';
import { showErrorToast } from '@/lib/error-toast';
import { resolveEffectiveDefaultSavedFilterId } from '@/lib/savedFilterDefaultResolve';
import { isSavedFilterDuplicateNameConflict } from '@/lib/savedFilterDuplicateName';

function savedFilterQueryKey() {
  return ['activity-saved-filters'] as const;
}

const EMPTY_SAVED_FILTERS: SavedFilterResponse[] = [];

export function useSavedFilters() {
  const queryClient = useQueryClient();

  const { data: listData, isLoading } = useQuery({
    queryKey: savedFilterQueryKey(),
    queryFn: () => listSavedFilters(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const savedFiltersFromApi = listData?.filters;
  const savedFilters = useMemo(
    () => savedFiltersFromApi ?? EMPTY_SAVED_FILTERS,
    [savedFiltersFromApi]
  );
  const defaultSavedFilterIdFromApi = listData?.defaultSavedFilterId ?? null;

  const effectiveDefaultSavedFilterId = useMemo(
    () =>
      resolveEffectiveDefaultSavedFilterId(
        savedFilters,
        defaultSavedFilterIdFromApi
      ),
    [savedFilters, defaultSavedFilterIdFromApi]
  );

  const defaultFilter = useMemo(() => {
    if (effectiveDefaultSavedFilterId == null) return null;
    return (
      savedFilters.find((f) => f.id === effectiveDefaultSavedFilterId) ?? null
    );
  }, [savedFilters, effectiveDefaultSavedFilterId]);

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: savedFilterQueryKey(),
    });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (body: CreateSavedFilterBody) => createSavedFilter(body),
    onSuccess: (_data, variables) => {
      invalidate();
      toast.success(`Saved filter "${variables.name}" created`);
    },
    onError: (error) => {
      if (isSavedFilterDuplicateNameConflict(error)) return;
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
      if (isSavedFilterDuplicateNameConflict(error)) return;
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

  const setDefaultMutation = useMutation({
    mutationFn: (savedFilterId: number | null) => {
      return setMyDefaultSavedFilter({
        savedFilterId,
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success('Default filter updated');
    },
    onError: (error) => {
      showErrorToast(error, 'Failed to update default filter');
    },
  });

  const setDefaultFilter = useCallback(
    (savedFilterId: number | null) =>
      setDefaultMutation.mutateAsync(savedFilterId),
    [setDefaultMutation]
  );

  return {
    savedFilters,
    isLoading,
    defaultFilter,
    effectiveDefaultSavedFilterId,
    createFilter: createMutation.mutateAsync,
    updateFilter: updateMutation.mutateAsync,
    duplicateFilter: duplicateMutation.mutateAsync,
    deleteFilter: deleteMutation.mutateAsync,
    setDefaultFilter,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSettingDefault: setDefaultMutation.isPending,
    invalidate,
  };
}

export type UseSavedFiltersReturn = ReturnType<typeof useSavedFilters>;
