// /hooks/useCalendar.tsx (TanStack Query v5)
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ActivityResponse } from '@corpcal/shared/api/types';
import type {
  FilterActivitiesQueryParams,
  RequestDeleteRequest,
  RestoreRequest,
  SoftDeleteRequest,
  UpdateActivityRequest,
} from '@corpcal/shared/schemas';

import {
  createActivity,
  deleteActivity,
  fetchActivities,
  fetchActivity,
  requestDeleteActivity,
  restoreActivity,
  softDeleteActivity,
  updateActivity,
} from '../api/activitiesApi';

/** Params for activity list query; extend with sort, search, etc. later. */
export type ActivityListQueryParams = Partial<
  Pick<FilterActivitiesQueryParams, 'excludeCompleted' | 'includeDeleted'>
>;

/** Normalize filters so the same logical view produces a stable query key. */
function normalizeListParams(
  params: ActivityListQueryParams = {}
): ActivityListQueryParams {
  const { excludeCompleted, includeDeleted } = params;
  const out: ActivityListQueryParams = {};
  if (excludeCompleted !== undefined) out.excludeCompleted = excludeCompleted;
  if (includeDeleted !== undefined) out.includeDeleted = includeDeleted;
  return out;
}

/** ActivityList stale time in milliseconds. */
const ACTIVITY_LIST_STALE_TIME = 0;

/** Poll activity list this often so other clients' creates/updates appear without refresh. */
const ACTIVITY_LIST_REFETCH_INTERVAL = 15_000;

/** Fields safe to optimistically merge from UpdateActivityRequest into ActivityResponse (table-displayed, same shape on both types). */
const OPTIMISTIC_MERGEABLE_KEYS = [
  'title',
  'summary',
  'isConfidential',
  'isIssue',
  'isAllDay',
  'startDate',
  'endDate',
  'startTime',
  'endTime',
  'lookAheadStatus',
  'lookAheadSection',
  'pitchDate',
] as const satisfies readonly (keyof ActivityResponse &
  keyof UpdateActivityRequest)[];

function buildOptimisticActivity(
  existing: ActivityResponse,
  update: UpdateActivityRequest
): ActivityResponse {
  const merged = { ...existing };
  for (const key of OPTIMISTIC_MERGEABLE_KEYS) {
    if (key in update) {
      (merged as Record<string, unknown>)[key] = (
        update as Record<string, unknown>
      )[key];
    }
  }
  return merged;
}

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

// Delete (with optimistic update)
export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteActivity(id),
    onMutate: async (id) => {
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
    onError: (_err, _id, context) => {
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
