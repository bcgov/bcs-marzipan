import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  NotificationPreferences,
  NotificationPreferencesUpdate,
} from '@corpcal/shared/schemas';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/api/notificationsApi';
import { useAuth } from '@/hooks/useAuth';

export const NOTIFICATION_PREFERENCES_QUERY_KEY = [
  'notifications',
  'preferences',
] as const;

export function useNotificationPreferences(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryKey = [...NOTIFICATION_PREFERENCES_QUERY_KEY, user?.id] as const;

  const query = useQuery({
    queryKey,
    queryFn: getNotificationPreferences,
    enabled: !!user && (options?.enabled ?? true),
    // Always revalidate when the modal opens so edits start from fresh data.
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const mutation = useMutation({
    mutationFn: (body: NotificationPreferencesUpdate) =>
      updateNotificationPreferences(body),
    onSuccess: (data: NotificationPreferences) => {
      queryClient.setQueryData(queryKey, data);
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    save: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
