import type {
  NotificationBulkActionResult,
  NotificationPage,
} from '@corpcal/shared/api/types';

import { createLogger } from '../lib/logger';
import api from './axios';

const logger = createLogger('NotificationsAPI');

export async function listNotifications(params?: {
  includeRead?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<NotificationPage> {
  const includeRead = params?.includeRead ?? true;
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;

  logger.debug('Listing notifications', { includeRead, page, pageSize });

  const res = await api.get<{
    success: boolean;
    data: NotificationPage;
  }>('/notifications', {
    params: { includeRead, page, pageSize },
  });

  return res.data.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  logger.debug('Getting unread notification count');

  const res = await api.get<{
    success: boolean;
    data: { count: number };
  }>('/notifications/unread-count');

  return res.data.data.count;
}

export async function markNotificationRead(recipientId: number): Promise<void> {
  logger.debug('Mark notification read', { recipientId });
  await api.patch(`/notifications/${recipientId}/read`);
}

export async function dismissNotification(recipientId: number): Promise<void> {
  logger.debug('Dismiss notification', { recipientId });
  await api.patch(`/notifications/${recipientId}/dismiss`);
}

export async function markAllNotificationsRead(): Promise<NotificationBulkActionResult> {
  logger.debug('Mark all notifications read');
  const res = await api.patch<{
    success: boolean;
    data: NotificationBulkActionResult;
  }>('/notifications/read-all');
  return res.data.data;
}

export async function dismissAllNotifications(): Promise<NotificationBulkActionResult> {
  logger.debug('Dismiss all notifications');
  const res = await api.patch<{
    success: boolean;
    data: NotificationBulkActionResult;
  }>('/notifications/dismiss-all');
  return res.data.data;
}
