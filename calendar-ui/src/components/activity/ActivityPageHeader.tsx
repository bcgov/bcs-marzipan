import { History, Star, UserX } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { formatActivityDisplayIdForUi } from '@corpcal/shared';
import type { ActivityFlagResponse } from '@corpcal/shared/api/types';
import {
  ActivityFlagAssigneeStack,
  activityFlagAssigneeTooltip,
  uniqueActivityFlagsByAssignee,
} from '@/components/activity/activities/ActivityFlagAssigneeStack';
import { ActivityFlagIcon } from '@/components/activity/activities/ActivityFlagIcon';
import { AssignActivityModal } from '@/components/activity/activities/AssignActivityModal';
import { SharedWithPopover } from '@/components/activity/ActivityTable/cells/SharedWithPopover';
import {
  ACTIVITY_OVERVIEW_ICON_MUTED_CLASS,
  ACTIVITY_WATCHLIST_ICON_ACTIVE_CLASS,
} from '@/components/activity/ActivityTable/overviewIconsLayout';
import { Badge, getActivityStatusBadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyableText } from '@/components/ui/copyable-text';
import {
  CORP_PACIFIC_TIME_ZONE,
  formatLongDate,
  formatPacificTimeWithAbbrev,
  formatRelativeTime,
  isSamePacificCalendarDay,
} from '@/lib/datetime-utils';
import { formatDisplayValue } from '@/lib/formatDisplayValue';
import { cn } from '@/lib/utils';

type ActivityPageHeaderProps = {
  displayId: string;
  currentUserId?: number | null;
  title: string;
  categories: string[];
  leadMinistry?: string | null;
  activityStatus?: unknown;
  lastUpdatedDateTime?: string | null;
  createdDateTime?: string | null;
  onHistoryClick?: () => void;
  /** Flags for activities assigned to the current user's teams. */
  flags?: ActivityFlagResponse[];
  canFlag?: boolean;
  onFlagSync?: (
    teamId: number,
    assigneeIds: number[],
    note?: string,
    assigneeNames?: string[],
    displayTeamPerAssignee?: Record<number, number | null>
  ) => void;
  /** Called when a non-flagging user removes their own assignment. */
  onFlagUnassign?: (
    teamId: number,
    assigneeId: number,
    assigneeName?: string
  ) => void;
  isFlagPending?: boolean;
  isFavourite?: boolean;
  onFavouriteToggle?: () => void;
  isFavouriteToggling?: boolean;
  /** Shared-with team display names for the header shares indicator. */
  sharedWith?: string[];
  visibility?: string | null;
  leadTeamDisplayName?: string | null;
  unshareAction?: {
    teamLabel: string;
    disabled: boolean;
    disabledReason?: string;
    onClick: () => void;
    isPending: boolean;
  };
};

/**
 * Header block for view/edit activity pages: displayId, title, categories, status, timestamps, History button.
 */
export function ActivityPageHeader({
  displayId,
  currentUserId,
  title,
  categories,
  leadMinistry,
  activityStatus,
  lastUpdatedDateTime,
  createdDateTime,
  onHistoryClick,
  flags,
  canFlag,
  onFlagSync,
  onFlagUnassign,
  isFlagPending,
  isFavourite,
  onFavouriteToggle,
  isFavouriteToggling,
  sharedWith,
  visibility,
  leadTeamDisplayName,
  unshareAction,
}: ActivityPageHeaderProps): ReactElement {
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const statusDisplay = formatDisplayValue(activityStatus);
  let updatedLabel: string | null = null;
  if (
    lastUpdatedDateTime &&
    createdDateTime &&
    lastUpdatedDateTime !== createdDateTime
  ) {
    const d = new Date(lastUpdatedDateTime);
    updatedLabel = isSamePacificCalendarDay(d, new Date())
      ? `today at ${formatPacificTimeWithAbbrev(d)}`
      : formatRelativeTime(d);
  }

  const sortedFlags = flags ?? [];
  const assignedFlags = uniqueActivityFlagsByAssignee(sortedFlags);
  const isFlagged = assignedFlags.length > 0;
  const currentUserFlag =
    currentUserId == null
      ? null
      : (sortedFlags.find((flag) => flag.assigneeId === currentUserId) ?? null);
  const flaggedLabel = activityFlagAssigneeTooltip(sortedFlags);
  const needsWideFlagButton = isFlagged && assignedFlags.length > 1;
  const displayIdUiLabel = formatActivityDisplayIdForUi(displayId);

  const iconButtonClassName = 'shrink-0';
  const headerActionIconClassName = 'text-icon-muted-foreground size-4';
  const timestampClassName = 'text-muted-foreground text-xs sm:text-sm';
  const showSharingIndicator = sharedWith != null;
  const showActionButtons =
    canFlag ||
    isFlagged ||
    unshareAction != null ||
    onFavouriteToggle ||
    onHistoryClick ||
    showSharingIndicator;

  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 sm:gap-x-12 sm:gap-y-1">
      <div className="col-start-1 row-start-1 w-fit justify-self-start">
        <span title={displayId}>
          <CopyableText
            text={displayId}
            copyLabel="Copy display ID"
            className="text-md text-muted-foreground hover:text-foreground -ml-2 px-2 py-1"
          >
            {displayIdUiLabel}
          </CopyableText>
        </span>
      </div>

      {statusDisplay !== '' ? (
        <div className="col-start-2 row-start-1 self-start justify-self-end">
          <Badge
            size="md"
            variant={getActivityStatusBadgeVariant(statusDisplay)}
          >
            {statusDisplay}
          </Badge>
        </div>
      ) : null}

      <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-1">
        <h1 className="text-lg font-bold">{title}</h1>
        {categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {categories.map((cat, idx) => (
              <Badge
                key={idx}
                variant="default"
                className="bg-primary hover:bg-primary"
              >
                {cat}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="col-span-2 row-start-3 self-end sm:col-span-1 sm:col-start-1">
        {leadMinistry ? (
          <div className="text-muted-foreground text-sm">{leadMinistry}</div>
        ) : null}
      </div>

      <div className="col-start-1 row-start-4 self-center sm:col-start-2 sm:row-start-2 sm:self-auto sm:text-right">
        <div className={timestampClassName}>
          {updatedLabel ? <div>Updated {updatedLabel}</div> : null}
          <div>
            Created{' '}
            {createdDateTime
              ? formatLongDate(new Date(createdDateTime), {
                  timeZone: CORP_PACIFIC_TIME_ZONE,
                })
              : ''}
          </div>
        </div>
      </div>

      {showActionButtons && (
        <div className="col-start-2 row-start-4 flex items-center gap-2 self-center sm:col-start-2 sm:row-start-3 sm:mt-auto sm:self-end sm:justify-self-end">
          {canFlag && onFlagSync && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={
                isFlagged
                  ? `Assigned to ${flaggedLabel} — click to edit`
                  : 'Assign activity'
              }
              aria-label={
                isFlagged
                  ? `Assigned to ${flaggedLabel} — click to edit`
                  : 'Assign activity'
              }
              onClick={() => setAssignModalOpen(true)}
              disabled={isFlagPending}
              className={cn(
                iconButtonClassName,
                needsWideFlagButton && 'w-auto px-1'
              )}
            >
              {!isFlagged ? (
                <ActivityFlagIcon
                  assigneeName={null}
                  assigneeFlagColour={null}
                />
              ) : (
                <ActivityFlagAssigneeStack
                  flags={sortedFlags}
                  reverseStackOrder
                />
              )}
            </Button>
          )}
          {!canFlag && currentUserFlag && onFlagUnassign && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={`Assigned to ${currentUserFlag.assigneeName} — click to unassign`}
              aria-label={`Assigned to ${currentUserFlag.assigneeName} — click to unassign`}
              onClick={() =>
                onFlagUnassign(
                  currentUserFlag.teamId,
                  currentUserFlag.assigneeId,
                  currentUserFlag.assigneeName
                )
              }
              disabled={isFlagPending}
              className={iconButtonClassName}
            >
              <ActivityFlagIcon
                assigneeName={currentUserFlag.assigneeName}
                assigneeFlagColour={currentUserFlag.assigneeFlagColour}
              />
            </Button>
          )}
          {unshareAction && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              title={
                unshareAction.disabled && unshareAction.disabledReason
                  ? unshareAction.disabledReason
                  : `Unshare ${unshareAction.teamLabel}`
              }
              aria-label={
                unshareAction.disabled && unshareAction.disabledReason
                  ? unshareAction.disabledReason
                  : `Unshare ${unshareAction.teamLabel}`
              }
              onClick={unshareAction.onClick}
              disabled={unshareAction.disabled || unshareAction.isPending}
              className={cn(iconButtonClassName, 'px-2')}
            >
              <UserX className={headerActionIconClassName} aria-hidden />
              <span className="ml-1.5 hidden sm:inline">
                Unshare {unshareAction.teamLabel}
              </span>
            </Button>
          )}
          {showSharingIndicator && (
            <SharedWithPopover
              teamNames={sharedWith}
              visibility={visibility}
              leadTeamDisplayName={leadTeamDisplayName}
              headerActions
            />
          )}
          {onFavouriteToggle && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={isFavourite ? 'Remove from watchlist' : 'Add to watchlist'}
              aria-label={
                isFavourite ? 'Remove from watchlist' : 'Add to watchlist'
              }
              aria-pressed={isFavourite}
              onClick={onFavouriteToggle}
              disabled={isFavouriteToggling}
              className={iconButtonClassName}
            >
              <Star
                className={cn(
                  headerActionIconClassName,
                  isFavourite
                    ? ACTIVITY_WATCHLIST_ICON_ACTIVE_CLASS
                    : ACTIVITY_OVERVIEW_ICON_MUTED_CLASS
                )}
                fill={isFavourite ? 'currentColor' : 'none'}
                aria-hidden
              />
            </Button>
          )}
          {onHistoryClick && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="View history"
              onClick={onHistoryClick}
              className={iconButtonClassName}
            >
              <History className={headerActionIconClassName} />
            </Button>
          )}
        </div>
      )}

      {canFlag && onFlagSync && (
        <AssignActivityModal
          open={assignModalOpen}
          onOpenChange={setAssignModalOpen}
          flags={flags ?? []}
          isSubmitting={isFlagPending ?? false}
          onSync={(
            teamId,
            assigneeIds,
            note,
            assigneeNames,
            displayTeamPerAssignee
          ) => {
            onFlagSync(
              teamId,
              assigneeIds,
              note,
              assigneeNames,
              displayTeamPerAssignee
            );
            setAssignModalOpen(false);
          }}
          displayId={displayId}
        />
      )}
    </div>
  );
}
