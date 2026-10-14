import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NotificationPage } from '@corpcal/shared/api/types';
import {
  dismissAllNotifications,
  dismissNotification,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notificationsApi';
import { showErrorToast } from '@/lib/error-toast';

export const NOTIFICATIONS_LIST_QUERY_KEY = ['notifications', 'list'] as const;
export const NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY = [
  'notifications',
  'unread-count',
] as const;

const EMPTY_NOTIFICATION_PAGE: NotificationPage = {
  items: [],
  page: 1,
  pageSize: 20,
  totalItems: 0,
  hasNext: false,
};

interface UseNotificationsOptions {
  includeRead?: boolean;
  page?: number;
  pageSize?: number;
  enableUnreadPolling?: boolean;
}

export function applyOptimisticMarkRead(
  page: NotificationPage,
  recipientId: number,
  readAtIso: string
): NotificationPage {
  return {
    ...page,
    items: page.items.map((item) =>
      item.recipientId === recipientId && item.status === 'unread'
        ? {
            ...item,
            status: 'read',
            readAt: readAtIso,
          }
        : item
    ),
  };
}

export function applyOptimisticDismiss(
  page: NotificationPage,
  recipientId: number
): NotificationPage {
  const nextItems = page.items.filter(
    (item) => item.recipientId !== recipientId
  );
  if (nextItems.length === page.items.length) {
    return page;
  }

  const nextTotalItems = Math.max(0, page.totalItems - 1);
  return {
    ...page,
    items: nextItems,
    totalItems: nextTotalItems,
    hasNext: page.page * page.pageSize < nextTotalItems,
  };
}

export function applyOptimisticMarkAllRead(
  page: NotificationPage,
  readAtIso: string
): NotificationPage {
  return {
    ...page,
    items: page.items.map((item) =>
      item.status === 'unread'
        ? {
            ...item,
            status: 'read',
            readAt: readAtIso,
          }
        : item
    ),
  };
}

export function applyOptimisticDismissAll(
  page: NotificationPage
): NotificationPage {
  return {
    ...page,
    items: [],
    totalItems: 0,
    hasNext: false,
  };
}

function hasUnreadRecipient(
  pages: Array<[readonly unknown[], NotificationPage | undefined]>,
  recipientId: number
): boolean {
  return pages.some(([, pageData]) =>
    pageData?.items.some(
      (item) => item.recipientId === recipientId && item.status === 'unread'
    )
  );
}

export function useNotifications(options?: UseNotificationsOptions) {
  const queryClient = useQueryClient();
  const includeRead = options?.includeRead ?? true;
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;

  const listQuery = useQuery({
    queryKey: [...NOTIFICATIONS_LIST_QUERY_KEY, includeRead, page, pageSize],
    queryFn: () => listNotifications({ includeRead, page, pageSize }),
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });

  const unreadCountQuery = useQuery({
    queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
    queryFn: getUnreadNotificationCount,
    staleTime: 10_000,
    refetchInterval: options?.enableUnreadPolling === false ? false : 20_000,
    refetchOnWindowFocus: true,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: NOTIFICATIONS_LIST_QUERY_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
    });
  };

  const markReadMutation = useMutation({
    mutationFn: (recipientId: number) => markNotificationRead(recipientId),
    onMutate: async (recipientId: number) => {
      await queryClient.cancelQueries({
        queryKey: NOTIFICATIONS_LIST_QUERY_KEY,
      });
      await queryClient.cancelQueries({
        queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
      });

      const previousListData = queryClient.getQueriesData<NotificationPage>({
        queryKey: NOTIFICATIONS_LIST_QUERY_KEY,
      });
      const previousUnreadCount = queryClient.getQueryData<number>(
        NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY
      );
      const readAtIso = new Date().toISOString();

      queryClient.setQueriesData<NotificationPage>(
        { queryKey: NOTIFICATIONS_LIST_QUERY_KEY },
        (old) =>
          old ? applyOptimisticMarkRead(old, recipientId, readAtIso) : old
      );

      if (
        previousUnreadCount != null &&
        hasUnreadRecipient(previousListData, recipientId)
      ) {
        queryClient.setQueryData(
          NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
          Math.max(0, previousUnreadCount - 1)
        );
      }

      return { previousListData, previousUnreadCount };
    },
    onSuccess: () => invalidate(),
    onError: (error, _recipientId, context) => {
      if (context?.previousListData) {
        context.previousListData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousUnreadCount != null) {
        queryClient.setQueryData(
          NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
          context.previousUnreadCount
        );
      }
      showErrorToast(error, 'Failed to mark notification read');
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (recipientId: number) => dismissNotification(recipientId),
    onMutate: async (recipientId: number) => {
      await queryClient.cancelQueries({
        queryKey: NOTIFICATIONS_LIST_QUERY_KEY,
      });
      await queryClient.cancelQueries({
        queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
      });

      const previousListData = queryClient.getQueriesData<NotificationPage>({
        queryKey: NOTIFICATIONS_LIST_QUERY_KEY,
      });
      const previousUnreadCount = queryClient.getQueryData<number>(
        NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY
      );

      queryClient.setQueriesData<NotificationPage>(
        { queryKey: NOTIFICATIONS_LIST_QUERY_KEY },
        (old) => (old ? applyOptimisticDismiss(old, recipientId) : old)
      );

      if (
        previousUnreadCount != null &&
        hasUnreadRecipient(previousListData, recipientId)
      ) {
        queryClient.setQueryData(
          NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
          Math.max(0, previousUnreadCount - 1)
        );
      }

      return { previousListData, previousUnreadCount };
    },
    onSuccess: () => invalidate(),
    onError: (error, _recipientId, context) => {
      if (context?.previousListData) {
        context.previousListData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousUnreadCount != null) {
        queryClient.setQueryData(
          NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
          context.previousUnreadCount
        );
      }
      showErrorToast(error, 'Failed to dismiss notification');
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: NOTIFICATIONS_LIST_QUERY_KEY,
      });
      await queryClient.cancelQueries({
        queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
      });

      const previousListData = queryClient.getQueriesData<NotificationPage>({
        queryKey: NOTIFICATIONS_LIST_QUERY_KEY,
      });
      const previousUnreadCount = queryClient.getQueryData<number>(
        NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY
      );
      const readAtIso = new Date().toISOString();

      queryClient.setQueriesData<NotificationPage>(
        { queryKey: NOTIFICATIONS_LIST_QUERY_KEY },
        (old) => (old ? applyOptimisticMarkAllRead(old, readAtIso) : old)
      );
      queryClient.setQueryData(NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY, 0);

      return { previousListData, previousUnreadCount };
    },
    onSuccess: () => invalidate(),
    onError: (error, _variables, context) => {
      if (context?.previousListData) {
        context.previousListData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousUnreadCount != null) {
        queryClient.setQueryData(
          NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
          context.previousUnreadCount
        );
      }
      showErrorToast(error, 'Failed to mark all notifications read');
    },
  });

  const dismissAllMutation = useMutation({
    mutationFn: dismissAllNotifications,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: NOTIFICATIONS_LIST_QUERY_KEY,
      });
      await queryClient.cancelQueries({
        queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
      });

      const previousListData = queryClient.getQueriesData<NotificationPage>({
        queryKey: NOTIFICATIONS_LIST_QUERY_KEY,
      });
      const previousUnreadCount = queryClient.getQueryData<number>(
        NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY
      );

      queryClient.setQueriesData<NotificationPage>(
        { queryKey: NOTIFICATIONS_LIST_QUERY_KEY },
        (old) => (old ? applyOptimisticDismissAll(old) : old)
      );
      queryClient.setQueryData(NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY, 0);

      return { previousListData, previousUnreadCount };
    },
    onSuccess: () => invalidate(),
    onError: (error, _variables, context) => {
      if (context?.previousListData) {
        context.previousListData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousUnreadCount != null) {
        queryClient.setQueryData(
          NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
          context.previousUnreadCount
        );
      }
      showErrorToast(error, 'Failed to dismiss all notifications');
    },
  });

  return {
    notificationPage: listQuery.data ?? EMPTY_NOTIFICATION_PAGE,
    notifications: (listQuery.data ?? EMPTY_NOTIFICATION_PAGE).items,
    unreadCount: unreadCountQuery.data ?? 0,
    isLoading: listQuery.isLoading || unreadCountQuery.isLoading,
    markRead: markReadMutation.mutateAsync,
    dismiss: dismissMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutateAsync,
    dismissAll: dismissAllMutation.mutateAsync,
    isMutating:
      markReadMutation.isPending ||
      dismissMutation.isPending ||
      markAllReadMutation.isPending ||
      dismissAllMutation.isPending,
    invalidate,
  };
}
