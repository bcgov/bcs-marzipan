import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  CORP_PACIFIC_TIME_ZONE,
  formatExactDate,
  formatRelativeTime,
} from '@/lib/datetime-utils';
import { cn } from '@/lib/utils';

import type { ActivityTableRow } from '../activityTableRow';
import { getInitialsFromName } from '../activityTableRowDisplay';

function UpdatedByAvatar({
  userMap,
  lastUpdatedBy,
}: {
  userMap: Map<string, { name: string; jobTitle?: string | null }>;
  lastUpdatedBy: number;
}) {
  const userName = userMap.get(String(lastUpdatedBy))?.name || 'Unknown';
  return (
    <Avatar size="sm" title={userName}>
      <AvatarFallback>{getInitialsFromName(userName)}</AvatarFallback>
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

  return (
    <div
      className={cn('flex flex-col gap-0 text-xs text-slate-500', className)}
    >
      <div className="flex items-center gap-1.5">
        <span>Updated {updatedDate}</span>
        {showUpdatedByAvatar ? (
          <UpdatedByAvatar
            userMap={userMap}
            lastUpdatedBy={row.lastUpdatedBy}
          />
        ) : null}
      </div>
      <span>Created {createdDate}</span>
    </div>
  );
}
