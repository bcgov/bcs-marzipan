import { Flag, History, Star } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import type { ActivityFlagResponse } from '@corpcal/shared/api/types';
import { AssignActivityModal } from '@/components/activity/activities/AssignActivityModal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  leadOrg?: string | null;
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
  leadOrg,
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
  const currentFlag = sortedFlags[0] ?? null;

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1">
        <CopyableText
          text={displayId}
          copyLabel="Copy display ID"
          className="text-md text-muted-foreground hover:text-foreground mb-1.5 -ml-2 px-2 py-1"
        >
          {displayId}
        </CopyableText>
        <h1 className="text-lg font-bold">{title}</h1>
        {categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((cat, idx) => (
              <Badge key={idx} variant="default" className="bg-primary">
                {cat}
              </Badge>
            ))}
          </div>
        )}
        {leadOrg && (
          <div className="text-muted-foreground mt-3 text-sm">{leadOrg}</div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2 text-right">
        {statusDisplay !== '' ? (
          <Badge variant={getActivityStatusBadgeVariant(statusDisplay)}>
            {statusDisplay}
          </Badge>
        ) : null}
        <div className="text-muted-foreground text-xs sm:text-sm">
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
        <div className="flex items-center gap-1">
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
              className="relative shrink-0"
            >
              {isFlagged && currentFlag ? (
                <>
                  <Avatar size="sm" className="size-full">
                    <AvatarFallback className="text-[10px] font-medium">
                      {currentFlag.assigneeName
                        .split(' ')
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Flag
                    className="absolute -right-0.5 -bottom-0.5 size-2.5 fill-[color:var(--flag-button-icon)] text-[color:var(--flag-button-icon)]"
                    aria-hidden
                  />
                </>
              ) : (
                <Flag className="h-4 w-4" />
              )}
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
              className="relative shrink-0"
            >
              <Avatar size="sm" className="size-full">
                <AvatarFallback className="text-[10px] font-medium">
                  {currentFlag.assigneeName
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Flag
                className="absolute -right-0.5 -bottom-0.5 size-2.5 fill-[color:var(--flag-button-icon)] text-[color:var(--flag-button-icon)]"
                aria-hidden
              />
            </Button>
          )}
        </div>
        {(onFavouriteToggle || onHistoryClick) && (
          <div className="flex items-center gap-2">
            {onFavouriteToggle && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                title={
                  isFavourite ? 'Remove from favourites' : 'Add to favourites'
                }
                onClick={onFavouriteToggle}
                disabled={isFavouriteToggling}
                className="shrink-0"
              >
                <Star
                  className="h-4 w-4"
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
                className="shrink-0"
              >
                <History className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

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
