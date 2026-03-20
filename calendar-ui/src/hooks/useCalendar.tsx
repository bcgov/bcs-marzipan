// /hooks/useCalendar.tsx (TanStack Query v5)
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ActivityResponse } from '@corpcal/shared/api/types';
import type {
  AddActivityHistoryNoteRequest,
  RequestDeleteRequest,
  RestoreRequest,
  SoftDeleteRequest,
  UpdateActivityRequest,
} from '@corpcal/shared/schemas';

import {
  addActivityHistoryNote,
  createActivity,
  deleteActivity,
  fetchActivities,
  fetchActivity,
  requestDeleteActivity,
  restoreActivity,
  softDeleteActivity,
  updateActivity,
} from '../api/activitiesApi';
import {
  buildOptimisticActivity,
  normalizeListParams,
  type ActivityListQueryParams,
} from '../lib/activity-query-utils';

export type { ActivityListQueryParams };

/** ActivityList stale time in milliseconds. */
const ACTIVITY_LIST_STALE_TIME = 0;

/** Poll activity list this often so other clients' creates/updates appear without refresh. */
const ACTIVITY_LIST_REFETCH_INTERVAL = 15_000;

// List (10s stale; poll so other clients' changes appear without refresh)
export function useActivityList(filters: ActivityListQueryParams = {}) {
  const normalized = normalizeListParams(filters);
  return useQuery<ActivityResponse[]>({
    queryKey: ['activities', 'list', normalized],
    queryFn: () => fetchActivities(normalized),
    staleTime: ACTIVITY_LIST_STALE_TIME,
    refetchInterval: ACTIVITY_LIST_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

// Single by id
export function useActivity(id: number | undefined) {
  return useQuery<ActivityResponse>({
    queryKey: ['activity', id],
    queryFn: () => fetchActivity(id!),
    enabled: !!id,
  });
}

// Create
export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

// Update (with optimistic update)
export function useUpdateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateActivityRequest }) =>
      updateActivity(id, data),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['activities', 'list'] });
      const snapshot = qc.getQueriesData<ActivityResponse[]>({
        queryKey: ['activities', 'list'],
      });
      qc.setQueriesData<ActivityResponse[]>(
        { queryKey: ['activities', 'list'] },
        (oldList) => {
          if (!Array.isArray(oldList)) return oldList;
          return oldList.map((item) =>
            item.id === vars.id
              ? buildOptimisticActivity(item, vars.data)
              : item
          );
        }
      );
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        context.snapshot.forEach(([queryKey, data]) => {
          qc.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_, __, vars) => {
      void qc.invalidateQueries({ queryKey: ['activities'] });
      void qc.invalidateQueries({ queryKey: ['activity', vars.id] });
    },
  });
}

// Delete (with optimistic update). Pass { id, body?: { reason?: string } } for hard delete audit.
export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; body?: { reason?: string } }) =>
      deleteActivity(vars.id, vars.body),
    onMutate: async (vars) => {
      const id = vars.id;
      await qc.cancelQueries({ queryKey: ['activities', 'list'] });
      const snapshot = qc.getQueriesData<ActivityResponse[]>({
        queryKey: ['activities', 'list'],
      });
      qc.setQueriesData<ActivityResponse[]>(
        { queryKey: ['activities', 'list'] },
        (oldList) => {
          if (!Array.isArray(oldList)) return oldList;
          return oldList.filter((item) => item.id !== id);
        }
      );
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        context.snapshot.forEach(([queryKey, data]) => {
          qc.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_, __, id) => {
      void qc.invalidateQueries({ queryKey: ['activities'] });
      void qc.invalidateQueries({ queryKey: ['activity', id] });
    },
  });
}

// Restore (invalidate on success)
export function useRestoreActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body?: RestoreRequest }) =>
      restoreActivity(id, body),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['activities'] });
      void qc.invalidateQueries({ queryKey: ['activity', vars.id] });
    },
  });
}

// Soft delete (invalidate on success)
export function useSoftDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: SoftDeleteRequest }) =>
      softDeleteActivity(id, body),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['activities'] });
      void qc.invalidateQueries({ queryKey: ['activity', vars.id] });
    },
  });
}

// Request delete (invalidate on success)
export function useRequestDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: RequestDeleteRequest }) =>
      requestDeleteActivity(id, body),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['activities'] });
      void qc.invalidateQueries({ queryKey: ['activity', vars.id] });
    },
  });
}

export function useAddActivityHistoryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: AddActivityHistoryNoteRequest;
    }) => addActivityHistoryNote(id, body),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['activity', vars.id] });
    },
  });
}
