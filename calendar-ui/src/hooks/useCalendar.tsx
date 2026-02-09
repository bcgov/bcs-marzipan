// /hooks/useCalendar.ts (TanStack Query v5)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchActivities,
  fetchActivity,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../api/activitiesApi';
import type { ActivityResponse } from '@corpcal/shared/api/types';
import type { UpdateActivityRequest } from '@corpcal/shared/schemas';

// List
export function useActivityList() {
  return useQuery<ActivityResponse[]>({
    queryKey: ['activities'],
    queryFn: () => fetchActivities(),
    staleTime: 30_000, // optional: 30s freshness
  });
}

// Single by id
export function useActivity(id: number | undefined) {
  if (!id) {
    throw new Error('Activity ID is required');
  }
  return useQuery<ActivityResponse>({
    queryKey: ['activity', id],
    queryFn: () => fetchActivity(id),
    enabled: !!id, // don't run until id exists
  });
}

// Create
export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      // v5: invalidate with an options object
      void qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

// Update
export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateActivityRequest }) =>
      updateActivity(id, data),
    onSuccess: (_, vars) => {
      // refresh list and the specific item cache (if used)
      void qc.invalidateQueries({ queryKey: ['activities'] });
      void qc.invalidateQueries({ queryKey: ['activity', vars.id] });
    },
  });
}

// Delete
export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteActivity(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: ['activities'] });
      void qc.invalidateQueries({ queryKey: ['activity', id] });
    },
  });
}
