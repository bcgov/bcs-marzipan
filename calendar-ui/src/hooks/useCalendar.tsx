// /hooks/useCalendar.tsx (TanStack Query v5)
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
  ActivityListItem,
  ActivityResponse,
} from '@corpcal/shared/api/types';
import type {
  AddActivityHistoryNoteRequest,
  RequestDeleteRequest,
  RestoreRequest,
  SoftDeleteRequest,
  UpdateActivityRequest,
  UpsertActivityFlagRequest,
  UpsertActivityFlagsRequest,
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
  removeActivityFlag,
  removeAssigneeActivityFlag,
  syncActivityFlags,
  upsertActivityFlag,
} from '../api/flagsApi';
import {
  buildOptimisticActivity,
  normalizeListParams,
  type ActivityListQueryParams,
} from '../lib/activity-query-utils';
import { showErrorToast } from '../lib/error-toast';
import { scheduleLiveActivityRefresh } from '../lib/liveActivitySync';

export type { ActivityListQueryParams };

/** ActivityList stale time in milliseconds. */
const ACTIVITY_LIST_STALE_TIME = 0;

/**
 * Poll when Socket.IO is disconnected (fallback). When live sync runs, pass
 * `suppressPollingWhileLive: true` to rely on invalidate-driven refetches.
 */
export const ACTIVITY_LIST_REFETCH_FALLBACK_MS = 10_000;

export type UseActivityListOptions = {
  /**
   * When true, skips interval polling ({@link LiveActivitySyncProvider} pushes invalidates).
   */
  suppressPollingWhileLive?: boolean;
};

// List — optional polling fallback when realtime is unavailable
export function useActivityList(
  filters: ActivityListQueryParams = {},
  options?: UseActivityListOptions
) {
  const normalized = normalizeListParams(filters);
  const refetchInterval =
    options?.suppressPollingWhileLive === true
      ? false
      : ACTIVITY_LIST_REFETCH_FALLBACK_MS;

  return useQuery<ActivityListItem[]>({
    queryKey: ['activities', 'list', normalized],
    queryFn: () => fetchActivities(normalized),
    staleTime: ACTIVITY_LIST_STALE_TIME,
    refetchInterval,
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
      // Mark list/history stale without refetching while still on create (avoids extra API churn before navigate).
      void qc.invalidateQueries({
        queryKey: ['activities'],
        refetchType: 'none',
      });
      scheduleLiveActivityRefresh(qc, {
        source: 'local',
        invalidateActivities: true,
      });
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
      const snapshot = qc.getQueriesData<ActivityListItem[]>({
        queryKey: ['activities', 'list'],
      });
      qc.setQueriesData<ActivityListItem[]>(
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
      scheduleLiveActivityRefresh(qc, { source: 'local', activityId: vars.id });
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
      const snapshot = qc.getQueriesData<ActivityListItem[]>({
        queryKey: ['activities', 'list'],
      });
      qc.setQueriesData<ActivityListItem[]>(
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
    onSettled: (_, __, vars) => {
      const activityId = vars.id;
      void qc.invalidateQueries({ queryKey: ['activities'] });
      void qc.invalidateQueries({ queryKey: ['activity', activityId] });
      scheduleLiveActivityRefresh(qc, { source: 'local', activityId });
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
      scheduleLiveActivityRefresh(qc, { source: 'local', activityId: vars.id });
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
      scheduleLiveActivityRefresh(qc, { source: 'local', activityId: vars.id });
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
      scheduleLiveActivityRefresh(qc, { source: 'local', activityId: vars.id });
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

/** Upsert (set or replace) the flag for an activity on a given team. */
export function useUpsertActivityFlag(options?: { onSuccess?: () => void }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      activityId,
      body,
    }: {
      activityId: number;
      body: UpsertActivityFlagRequest;
      assigneeName?: string;
    }) => upsertActivityFlag(activityId, body),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['activities'] });
      void qc.invalidateQueries({ queryKey: ['activity', vars.activityId] });
      scheduleLiveActivityRefresh(qc, {
        source: 'local',
        activityId: vars.activityId,
      });
      toast.success(
        vars.assigneeName
          ? `Activity assigned to ${vars.assigneeName}`
          : 'Activity assigned'
      );
      options?.onSuccess?.();
    },
    onError: (error) => {
      showErrorToast(error, 'Failed to assign activity');
    },
  });
}

/** Sync (set) all assignees for an activity/team pair. */
export function useSyncActivityFlags(options?: { onSuccess?: () => void }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      activityId,
      body,
    }: {
      activityId: number;
      body: UpsertActivityFlagsRequest;
      assigneeNames?: string[];
    }) => syncActivityFlags(activityId, body),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['activities'] });
      void qc.invalidateQueries({ queryKey: ['activity', vars.activityId] });
      scheduleLiveActivityRefresh(qc, {
        source: 'local',
        activityId: vars.activityId,
      });
      if ((vars.assigneeNames?.length ?? 0) > 0) {
        toast.success(`Activity assigned to ${vars.assigneeNames!.join(', ')}`);
      } else {
        toast.success('Activity assignments updated');
      }
      options?.onSuccess?.();
    },
    onError: (error) => {
      showErrorToast(error, 'Failed to update activity assignments');
    },
  });
}

/** Remove the flag for an activity on a given team. */
export function useRemoveActivityFlag(options?: { onSuccess?: () => void }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      activityId,
      teamId,
    }: {
      activityId: number;
      teamId: number;
      assigneeName?: string;
    }) => removeActivityFlag(activityId, teamId),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['activities'] });
      void qc.invalidateQueries({ queryKey: ['activity', vars.activityId] });
      scheduleLiveActivityRefresh(qc, {
        source: 'local',
        activityId: vars.activityId,
      });
      toast.success(
        vars.assigneeName
          ? `Activity unassigned from ${vars.assigneeName}`
          : 'Activity unassigned'
      );
      options?.onSuccess?.();
    },
    onError: (error) => {
      showErrorToast(error, 'Failed to unassign activity');
    },
  });
}

/** Remove a single assignee flag for an activity/team pair. */
export function useRemoveAssigneeActivityFlag(options?: {
  onSuccess?: () => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      activityId,
      teamId,
      assigneeId,
    }: {
      activityId: number;
      teamId: number;
      assigneeId: number;
      assigneeName?: string;
      suppressSuccessToast?: boolean;
    }) => removeAssigneeActivityFlag(activityId, teamId, assigneeId),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['activities'] });
      void qc.invalidateQueries({ queryKey: ['activity', vars.activityId] });
      scheduleLiveActivityRefresh(qc, {
        source: 'local',
        activityId: vars.activityId,
      });
      if (!vars.suppressSuccessToast) {
        toast.success(
          vars.assigneeName
            ? `Activity unassigned from ${vars.assigneeName}`
            : 'Activity unassigned'
        );
      }
      options?.onSuccess?.();
    },
    onError: (error) => {
      showErrorToast(error, 'Failed to unassign activity');
    },
  });
}
