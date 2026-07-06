import { History, Star } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import type { ActivityFlagResponse } from '@corpcal/shared/api/types';
import {
  ActivityFlagIcon,
  ActivityFlagOverflowIcon,
} from '@/components/activity/activities/ActivityFlagIcon';
import { AssignActivityModal } from '@/components/activity/activities/AssignActivityModal';
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

type ActivityPageHeaderProps = {
  displayId: string;
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
    assigneeNames?: string[]
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
};

/**
 * Header block for view/edit activity pages: displayId, title, categories, status, timestamps, History button.
 */
export function ActivityPageHeader({
  displayId,
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

  const sortedFlags =
    flags == null ? [] : [...flags].sort((a, b) => a.teamId - b.teamId);
  const stackedFlags = [...sortedFlags].reverse();
  const visibleStackedFlags = stackedFlags.slice(0, 3);
  const overflowFlagCount = Math.max(stackedFlags.length - 3, 0);
  const isFlagged = sortedFlags.length > 0;
  const iconFlag = sortedFlags[0] ?? null;
  const flaggedLabel = sortedFlags.map((f) => f.assigneeName).join(', ');

  const iconButtonClassName = 'shrink-0';
  const multiFlagButtonClassName = 'mr-3 h-10 shrink-0 px-2 pr-4';
  const headerActionIconClassName = 'text-muted-foreground size-4';
  const timestampClassName = 'text-muted-foreground text-xs sm:text-sm';
  const showActionButtons =
    canFlag || isFlagged || onFavouriteToggle || onHistoryClick;

  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 sm:gap-x-12 sm:gap-y-1">
      <div className="col-start-1 row-start-1 w-fit justify-self-start">
        <CopyableText
          text={displayId}
          copyLabel="Copy display ID"
          className="text-md text-muted-foreground hover:text-foreground -ml-2 px-2 py-1"
        >
          {displayId}
        </CopyableText>
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
              className={
                isFlagged ? multiFlagButtonClassName : iconButtonClassName
              }
            >
              {isFlagged ? (
                <span className="flex items-center pr-1.5">
                  {visibleStackedFlags.map((flag, index) => (
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
                  {overflowFlagCount > 0 ? (
                    <span
                      className={
                        visibleStackedFlags.length > 0 ? '-ml-0.5' : undefined
                      }
                      style={{ zIndex: visibleStackedFlags.length + 1 }}
                    >
                      <ActivityFlagOverflowIcon
                        extraCount={overflowFlagCount}
                      />
                    </span>
                  ) : null}
                </span>
              ) : (
                <ActivityFlagIcon
                  assigneeName={null}
                  assigneeFlagColour={null}
                />
              )}
            </Button>
          )}
          {!canFlag && isFlagged && iconFlag && onFlagUnassign && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={`Assigned to ${flaggedLabel} — click to unassign`}
              aria-label={`Assigned to ${flaggedLabel} — click to unassign`}
              onClick={() =>
                onFlagUnassign(
                  iconFlag.teamId,
                  iconFlag.assigneeId,
                  iconFlag.assigneeName
                )
              }
              disabled={isFlagPending}
              className={iconButtonClassName}
            >
              <ActivityFlagIcon
                assigneeName={iconFlag.assigneeName}
                assigneeFlagColour={iconFlag.assigneeFlagColour}
              />
            </Button>
          )}
          {onFavouriteToggle && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={isFavourite ? 'Remove from watchlist' : 'Add to watchlist'}
              onClick={onFavouriteToggle}
              disabled={isFavouriteToggling}
              className={iconButtonClassName}
            >
              <Star
                className={headerActionIconClassName}
                fill={isFavourite ? 'currentColor' : 'none'}
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
          onSync={(teamId, assigneeIds, note, assigneeNames) => {
            onFlagSync(teamId, assigneeIds, note, assigneeNames);
            setAssignModalOpen(false);
          }}
          displayId={displayId}
        />
      )}
    </div>
  );
}
