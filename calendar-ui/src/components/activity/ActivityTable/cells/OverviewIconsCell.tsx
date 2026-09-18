import { Star } from 'lucide-react';
import { useMemo } from 'react';

import {
  ActivityFlagIcon,
  ActivityFlagOverflowIcon,
} from '@/components/activity/activities/ActivityFlagIcon';
import { ActivityFlagPopover } from '@/components/activity/activities/ActivityFlagPopover';
import { CopyableText } from '@/components/ui/copyable-text';

import type { ActivityTableRow } from '../activityTableRow';
import { SharedWithPopover } from './SharedWithPopover';

const MAX_VISIBLE_FLAG_ICONS = 3;

export interface OverviewIconsCellProps {
  row: ActivityTableRow;
  canFlag: boolean;
  isFavourite: boolean;
  onFavouriteToggle: () => void;
  favouriteToggling: boolean;
  onFlagSync: (
    teamId: number,
    assigneeIds: number[],
    assigneeNames?: string[],
    displayTeamPerAssignee?: Record<number, number | null>
  ) => void;
  flagPending: boolean;
}

/**
 * Compact identity row for Grid A: activity ID, flag
 * assignments, watchlist toggle, and a read-only shares indicator.
 */
export function OverviewIconsCell({
  row,
  canFlag,
  isFavourite,
  onFavouriteToggle,
  favouriteToggling,
  onFlagSync,
  flagPending,
}: OverviewIconsCellProps) {
  const displayIdText = row.displayId ?? String(row.id);

  const assignedFlags = useMemo(() => {
    const uniqueFlags = new Map<number, ActivityTableRow['flags'][number]>();
    row.flags.forEach((flag) => {
      if (!uniqueFlags.has(flag.assigneeId)) {
        uniqueFlags.set(flag.assigneeId, flag);
      }
    });
    return Array.from(uniqueFlags.values());
  }, [row.flags]);

  const visibleAssignedFlags = assignedFlags.slice(0, MAX_VISIBLE_FLAG_ICONS);
  const overflowAssignedCount = Math.max(
    assignedFlags.length - MAX_VISIBLE_FLAG_ICONS,
    0
  );
  const assignedTooltip = assignedFlags
    .map((flag) => flag.assigneeName)
    .join(', ');
  const hasAssignedUsers = assignedFlags.length > 0;

  const flagIcons = (
    <div className="flex items-center">
      {visibleAssignedFlags.map((flag, index) => (
        <span
          key={`${flag.teamId}:${flag.assigneeId}`}
          className={index > 0 ? '-ml-0.5' : undefined}
          style={{ zIndex: index + 1 }}
        >
          <ActivityFlagIcon
            assigneeName={flag.assigneeName}
            assigneeFlagColour={flag.assigneeFlagColour}
          />
        </span>
      ))}
      {overflowAssignedCount > 0 ? (
        <span
          className={visibleAssignedFlags.length > 0 ? '-ml-0.5' : undefined}
          style={{ zIndex: visibleAssignedFlags.length + 1 }}
        >
          <ActivityFlagOverflowIcon extraCount={overflowAssignedCount} />
        </span>
      ) : null}
    </div>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 text-xs font-semibold text-slate-900">
      <span
        data-no-row-nav
        onClick={(e) => e.stopPropagation()}
        className="inline-flex"
      >
        <CopyableText
          text={displayIdText}
          copyLabel="Copy activity ID"
          variant="minimal"
          copiedTooltipContent="Activity ID copied"
        >
          {displayIdText}
        </CopyableText>
      </span>

      {hasAssignedUsers && canFlag ? (
        <ActivityFlagPopover
          activityId={row.id}
          flags={row.flags}
          readOnly={!canFlag}
          onSync={onFlagSync}
          isPending={flagPending}
          triggerContent={
            <span
              title={assignedTooltip}
              aria-label={assignedTooltip}
              className="inline-flex"
            >
              {flagIcons}
            </span>
          }
        />
      ) : hasAssignedUsers ? (
        <span
          data-no-row-nav
          onClick={(e) => e.stopPropagation()}
          title={assignedTooltip}
          aria-label={assignedTooltip}
          className="inline-flex"
        >
          {flagIcons}
        </span>
      ) : canFlag ? (
        <ActivityFlagPopover
          activityId={row.id}
          flags={row.flags}
          readOnly={!canFlag}
          onSync={onFlagSync}
          isPending={flagPending}
        />
      ) : null}

      <button
        type="button"
        data-no-row-nav
        onClick={(e) => {
          e.stopPropagation();
          onFavouriteToggle();
        }}
        disabled={favouriteToggling}
        title={isFavourite ? 'Remove from watchlist' : 'Add to watchlist'}
        aria-label={isFavourite ? 'Remove from watchlist' : 'Add to watchlist'}
        aria-pressed={isFavourite}
        className="hover:bg-muted focus-visible:ring-ring inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Star
          className={
            isFavourite ? 'size-4 text-amber-500' : 'size-4 text-slate-400'
          }
          fill={isFavourite ? 'currentColor' : 'none'}
          aria-hidden
        />
      </button>

      <SharedWithPopover teamNames={row.sharedWith} />
    </div>
  );
}
