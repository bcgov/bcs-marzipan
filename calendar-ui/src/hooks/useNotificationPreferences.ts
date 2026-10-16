import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  NotificationPreferences,
  NotificationPreferencesUpdate,
} from '@corpcal/shared/schemas';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/api/notificationsApi';

export const NOTIFICATION_PREFERENCES_QUERY_KEY = [
  'notifications',
  'preferences',
] as const;

export function useNotificationPreferences(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
    queryFn: getNotificationPreferences,
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (body: NotificationPreferencesUpdate) =>
      updateNotificationPreferences(body),
    onSuccess: (data: NotificationPreferences) => {
      queryClient.setQueryData(NOTIFICATION_PREFERENCES_QUERY_KEY, data);
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    save: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
