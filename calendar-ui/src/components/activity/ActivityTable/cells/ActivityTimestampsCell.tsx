import {
  defaultUserColourKeyForUserId,
  type UserColourKey,
} from '@corpcal/shared';
import { UserColouredAvatar } from '@/components/users/UserColouredAvatar';
import {
  CORP_PACIFIC_TIME_ZONE,
  formatExactDate,
  formatRelativeTime,
} from '@/lib/datetime-utils';
import { cn } from '@/lib/utils';

import type { ActivityTableRow } from '../activityTableRow';
import { getInitialsFromName } from '../activityTableRowDisplay';

type UserMapEntry = {
  name: string;
  jobTitle?: string | null;
  userColourKey?: UserColourKey;
};

function UserAvatar({
  userMap,
  userId,
  fallbackName,
  compact = false,
}: {
  userMap: Map<string, UserMapEntry>;
  userId: number;
  fallbackName: string;
  compact?: boolean;
}) {
  const entry = userMap.get(String(userId));
  const userName = entry?.name || fallbackName;
  const userColourKey =
    entry?.userColourKey ?? defaultUserColourKeyForUserId(userId);

  return (
    <UserColouredAvatar
      userColourKey={userColourKey}
      initials={getInitialsFromName(userName)}
      size={compact ? 'xs' : 'sm'}
      title={userName}
      decorative
    />
  );
}

export interface ActivityTimestampsCellProps {
  row: ActivityTableRow;
  userMap: Map<string, UserMapEntry>;
  /** Show the avatar of the user who last updated the activity. */
  showUpdatedByAvatar?: boolean;
  className?: string;
}

/**
 * Updated and created timestamps in the same formats as the current grid:
 * relative for "Updated", exact Pacific date for "Created".
 */
export function ActivityTimestampsCell({
  row,
  userMap,
  showUpdatedByAvatar = true,
  className,
}: ActivityTimestampsCellProps) {
  const updatedDate = formatRelativeTime(new Date(row.lastUpdatedDateTime), {
    short: true,
  });
  const createdDate = formatExactDate(new Date(row.createdDateTime), {
    includeYear: true,
    timeZone: CORP_PACIFIC_TIME_ZONE,
  });

  const editLock = row.editLock;
  const editorDisplayName =
    editLock != null
      ? (userMap.get(String(editLock.userId))?.name ?? editLock.username)
      : null;

  const editingLineLabel =
    editLock != null && editorDisplayName != null
      ? `${editorDisplayName} is editing`
      : null;

  return (
    <div
      className={cn(
        'text-foreground flex w-full min-w-0 flex-col gap-0 text-xs',
        className
      )}
    >
      {editLock != null && editorDisplayName != null ? (
        <div
          className="flex w-full min-w-0 items-center gap-x-1 font-medium text-amber-700"
          title={editingLineLabel ?? undefined}
        >
          <UserAvatar
            userMap={userMap}
            userId={editLock.userId}
            fallbackName={editLock.username}
            compact
          />
          <span className="flex min-w-0 flex-1 items-baseline gap-x-1 overflow-hidden">
            <span className="min-w-0 truncate" title={editorDisplayName}>
              {editorDisplayName}
            </span>
            <span className="shrink-0 whitespace-nowrap">is editing</span>
          </span>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-1 gap-y-0">
        <span>Updated {updatedDate}</span>
        {showUpdatedByAvatar ? (
          <UserAvatar
            userMap={userMap}
            userId={row.lastUpdatedBy}
            fallbackName="Unknown"
          />
        ) : null}
      </div>
      <span>Created {createdDate}</span>
    </div>
  );
}
