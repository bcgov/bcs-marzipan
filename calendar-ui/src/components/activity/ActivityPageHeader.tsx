import { History, Star } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import type { ActivityFlagResponse } from '@corpcal/shared/api/types';
import { ActivityFlagIcon } from '@/components/activity/activities/ActivityFlagIcon';
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
  onFlagAssign?: (
    teamId: number,
    assigneeId: number,
    note?: string,
    assigneeName?: string
  ) => void;
  /** Called when the user removes the assignment. Available to all users, not just admins. */
  onFlagUnassign?: (teamId: number, assigneeName?: string) => void;
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
  onFlagAssign,
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
  const isFlagged = sortedFlags.length > 0;
  const hasSingleFlag = sortedFlags.length === 1;
  const currentFlag = hasSingleFlag ? sortedFlags[0] : null;

  const iconButtonClassName = 'shrink-0 shadow-none';
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
          {canFlag && onFlagAssign && onFlagUnassign && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              title={
                isFlagged
                  ? `Assigned to ${currentFlag?.assigneeName ?? 'teammate'} — click to reassign`
                  : 'Assign activity'
              }
              aria-label={
                isFlagged
                  ? `Assigned to ${currentFlag?.assigneeName ?? 'teammate'} — click to reassign`
                  : 'Assign activity'
              }
              onClick={() => setAssignModalOpen(true)}
              disabled={isFlagPending}
              className={iconButtonClassName}
            >
              <ActivityFlagIcon
                assigneeName={isFlagged ? currentFlag?.assigneeName : null}
                assigneeFlagColour={currentFlag?.assigneeFlagColour}
              />
            </Button>
          )}
          {!canFlag && isFlagged && currentFlag && onFlagUnassign && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              title={`Assigned to ${currentFlag.assigneeName} — click to unassign`}
              aria-label={`Assigned to ${currentFlag.assigneeName} — click to unassign`}
              onClick={() =>
                onFlagUnassign(currentFlag.teamId, currentFlag.assigneeName)
              }
              disabled={isFlagPending}
              className={iconButtonClassName}
            >
              <ActivityFlagIcon
                assigneeName={currentFlag.assigneeName}
                assigneeFlagColour={currentFlag.assigneeFlagColour}
              />
            </Button>
          )}
          {onFavouriteToggle && (
            <Button
              type="button"
              variant="outline"
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
              variant="outline"
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

      {canFlag && onFlagAssign && onFlagUnassign && (
        <AssignActivityModal
          open={assignModalOpen}
          onOpenChange={setAssignModalOpen}
          flags={flags ?? []}
          isSubmitting={isFlagPending ?? false}
          onAssign={(teamId, assigneeId, note, assigneeName) => {
            onFlagAssign(teamId, assigneeId, note, assigneeName);
            setAssignModalOpen(false);
          }}
          onUnassign={(teamId, assigneeName) => {
            onFlagUnassign(teamId, assigneeName);
            setAssignModalOpen(false);
          }}
          displayId={displayId}
        />
      )}
    </div>
  );
}
