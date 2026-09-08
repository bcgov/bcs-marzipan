import type { NotificationItem } from '@corpcal/shared/api/types';

export function getNotificationTargetPath(
  item: NotificationItem
): string | null {
  if (item.entityType === 'activity') {
    return `/activity/${item.entityId}`;
  }

  const details = item.details ?? {};
  const detailsUserId =
    typeof details.userId === 'number' ? details.userId : undefined;
  const detailsTeamId =
    typeof details.teamId === 'number' ? details.teamId : undefined;

  if (detailsUserId != null) {
    return `/users/${detailsUserId}`;
  }

  if (detailsTeamId != null) {
    return `/teams/${detailsTeamId}`;
  }

  if (item.entityType === 'team') {
    return `/teams/${item.entityId}`;
  }

  return null;
}
