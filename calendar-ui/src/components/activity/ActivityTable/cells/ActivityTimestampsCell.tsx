import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  CORP_PACIFIC_TIME_ZONE,
  formatExactDate,
  formatRelativeTime,
} from '@/lib/datetime-utils';
import { cn } from '@/lib/utils';

import type { ActivityTableRow } from '../activityTableRow';
import { getInitialsFromName } from '../activityTableRowDisplay';

/** Compact avatar for inline “updated by” / editor rows in Grid A status column. */
const COMPACT_AVATAR_CLASS = 'size-[18px]';
const COMPACT_AVATAR_FALLBACK_CLASS = 'text-[10px] leading-none';

function UserAvatar({
  userMap,
  userId,
  fallbackName,
  compact = false,
}: {
  userMap: Map<string, { name: string; jobTitle?: string | null }>;
  userId: number;
  fallbackName: string;
  compact?: boolean;
}) {
  const userName = userMap.get(String(userId))?.name || fallbackName;
  return (
    <Avatar
      className={compact ? COMPACT_AVATAR_CLASS : undefined}
      size={compact ? undefined : 'sm'}
      title={userName}
    >
      <AvatarFallback
        className={compact ? COMPACT_AVATAR_FALLBACK_CLASS : undefined}
      >
        {getInitialsFromName(userName)}
      </AvatarFallback>
    </Avatar>
  );
}

export interface ActivityTimestampsCellProps {
  row: ActivityTableRow;
  userMap: Map<string, { name: string; jobTitle?: string | null }>;
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

  return (
    <div
      className={cn('text-foreground flex flex-col gap-0 text-xs', className)}
    >
      {editLock != null && editorDisplayName != null ? (
        <div className="inline-flex max-w-full min-w-0 items-center gap-x-1 font-medium text-amber-700">
          <UserAvatar
            userMap={userMap}
            userId={editLock.userId}
            fallbackName={editLock.username}
            compact
          />
          <span className="min-w-0 truncate">
            {editorDisplayName} is editing
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
