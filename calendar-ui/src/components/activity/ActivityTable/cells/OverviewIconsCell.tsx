import { Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  ActivityFlagAssigneeStack,
  activityFlagAssigneeTooltip,
  uniqueActivityFlagsByAssignee,
} from '@/components/activity/activities/ActivityFlagAssigneeStack';
import { ActivityFlagPopover } from '@/components/activity/activities/ActivityFlagPopover';
import {
  ACTIVITY_OVERVIEW_ICON_MUTED_CLASS,
  ACTIVITY_WATCHLIST_ICON_ACTIVE_CLASS,
  GRID_A_OVERVIEW_ACTION_HITBOX_CLASS,
  GRID_A_OVERVIEW_ACTION_ICON_CLASS,
  GRID_A_OVERVIEW_ACTIONS_ROW_CLASS,
  gridOverviewFlagTriggerClassName,
} from '@/components/activity/ActivityTable/overviewIconsLayout';
import { cn } from '@/lib/utils';

import type { ActivityTableRow } from '../activityTableRow';
import { ActivityDisplayIdCopy } from './ActivityDisplayIdCopy';
import { GRID_A_SHARE_COUNT_BADGE_MIN_ROW_WIDTH_PX } from './sharedWithIndicatorCopy';
import { SharedWithPopover } from './SharedWithPopover';

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
 * Compact identity row for Grid A: activity ID, watchlist, shares, and flag (rightmost).
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
  const assignedFlags = uniqueActivityFlagsByAssignee(row.flags);
  const hasAssignedUsers = assignedFlags.length > 0;
  const assignedTooltip = activityFlagAssigneeTooltip(row.flags);
  const showFlagControl = canFlag || hasAssignedUsers;

  const overviewFlagTriggerClassName =
    gridOverviewFlagTriggerClassName(hasAssignedUsers);

  const actionsRowRef = useRef<HTMLDivElement>(null);
  const [showShareCountBadge, setShowShareCountBadge] = useState(true);

  useEffect(() => {
    const el = actionsRowRef.current;
    if (!el) return;

    const update = (width: number) => {
      setShowShareCountBadge(
        width >= GRID_A_SHARE_COUNT_BADGE_MIN_ROW_WIDTH_PX
      );
    };

    update(el.getBoundingClientRect().width);

    const observer = new ResizeObserver(([entry]) => {
      update(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const flagStackTrigger = hasAssignedUsers ? (
    <span
      title={assignedTooltip}
      aria-label={assignedTooltip}
      className="inline-flex"
    >
      <ActivityFlagAssigneeStack flags={row.flags} reverseStackOrder />
    </span>
  ) : undefined;

  const flagSlot = showFlagControl ? (
    <span className="inline-flex min-h-6 shrink-0 items-center justify-center">
      {hasAssignedUsers && canFlag ? (
        <ActivityFlagPopover
          activityId={row.id}
          flags={row.flags}
          readOnly={!canFlag}
          onSync={onFlagSync}
          isPending={flagPending}
          triggerClassName={overviewFlagTriggerClassName}
          triggerContent={flagStackTrigger}
        />
      ) : hasAssignedUsers ? (
        <span
          data-no-row-nav
          onClick={(e) => e.stopPropagation()}
          title={assignedTooltip}
          aria-label={assignedTooltip}
          className="inline-flex min-h-6 min-w-6 items-center justify-center"
        >
          {flagStackTrigger}
        </span>
      ) : canFlag ? (
        <ActivityFlagPopover
          activityId={row.id}
          flags={row.flags}
          readOnly={!canFlag}
          onSync={onFlagSync}
          isPending={flagPending}
          triggerClassName={overviewFlagTriggerClassName}
        />
      ) : null}
    </span>
  ) : null;

  return (
    <div className="flex min-w-0 items-center gap-4 text-xs font-semibold text-slate-900">
      <span
        data-no-row-nav
        onClick={(e) => e.stopPropagation()}
        className="shrink-0"
      >
        <ActivityDisplayIdCopy displayId={displayIdText} variant="subtle" />
      </span>

      <div ref={actionsRowRef} className={GRID_A_OVERVIEW_ACTIONS_ROW_CLASS}>
        <button
          type="button"
          data-no-row-nav
          onClick={(e) => {
            e.stopPropagation();
            onFavouriteToggle();
          }}
          disabled={favouriteToggling}
          title={isFavourite ? 'Remove from watchlist' : 'Add to watchlist'}
          aria-label={
            isFavourite ? 'Remove from watchlist' : 'Add to watchlist'
          }
          aria-pressed={isFavourite}
          className={GRID_A_OVERVIEW_ACTION_HITBOX_CLASS}
        >
          <Star
            className={cn(
              GRID_A_OVERVIEW_ACTION_ICON_CLASS,
              isFavourite
                ? ACTIVITY_WATCHLIST_ICON_ACTIVE_CLASS
                : ACTIVITY_OVERVIEW_ICON_MUTED_CLASS
            )}
            fill={isFavourite ? 'currentColor' : 'none'}
            aria-hidden
          />
        </button>
        <SharedWithPopover
          teamNames={row.sharedWith}
          visibility={row.visibility}
          leadTeamDisplayName={row.leadTeamDisplayName}
          showShareCountBadge={showShareCountBadge}
          gridOverviewActions
        />
        {flagSlot}
      </div>
    </div>
  );
}
