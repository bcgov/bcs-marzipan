import { Globe, GlobeOff, Users } from 'lucide-react';
import { useState } from 'react';

import {
  ACTIVITY_HEADER_ACTION_HITBOX_CLASS,
  ACTIVITY_OVERVIEW_ICON_ACTIVE_CLASS,
  ACTIVITY_OVERVIEW_ICON_MUTED_CLASS,
  ACTIVITY_SHARE_COUNT_BADGE_CLASS,
  GRID_A_OVERVIEW_ACTION_HITBOX_CLASS,
  GRID_A_OVERVIEW_ACTION_ICON_CLASS,
} from '@/components/activity/ActivityTable/overviewIconsLayout';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import {
  formatSharedWithCountBadge,
  isTeamRestrictedVisibility,
  sharedWithAriaLabel,
  sharedWithFormVisibilityDescription,
  sharedWithPopoverTitle,
} from './sharedWithIndicatorCopy';

export interface SharedWithPopoverProps {
  /** Team display names the activity is shared with. */
  teamNames: string[];
  /** Team ids parallel to `teamNames` when available (stable list keys). */
  teamIds?: number[];
  visibility?: string | null;
  leadTeamDisplayName?: string | null;
  /** When false, omits the lower-right share count badge (narrow overview row). */
  showShareCountBadge?: boolean;
  /** Grid A overview: Users icon in a 24px hit target. */
  gridOverviewActions?: boolean;
  /** Activity page header: Users icon in a size-9 hit target. */
  headerActions?: boolean;
}

/**
 * Read-only shares and visibility indicator (opens a popover on click).
 */
function sharedWithListEntries(
  teamNames: string[],
  teamIds?: number[]
): { key: string; name: string }[] {
  return teamNames.map((name, index) => ({
    name,
    key:
      teamIds?.[index] != null
        ? String(teamIds[index])
        : `${name}-${String(index)}`,
  }));
}

export function SharedWithPopover({
  teamNames,
  teamIds,
  visibility = null,
  leadTeamDisplayName = null,
  showShareCountBadge = true,
  gridOverviewActions = false,
  headerActions = false,
}: SharedWithPopoverProps) {
  const [open, setOpen] = useState(false);
  const shareCount = teamNames.length;
  const hasShares = shareCount > 0;
  const isRestricted = isTeamRestrictedVisibility(visibility);
  const popoverTitle = sharedWithPopoverTitle(shareCount);
  const visibilityDescription = sharedWithFormVisibilityDescription(
    visibility,
    leadTeamDisplayName
  );
  const ariaLabel = sharedWithAriaLabel(
    teamNames,
    visibility,
    leadTeamDisplayName
  );
  const badgeText = formatSharedWithCountBadge(shareCount);
  const sharedTeams = sharedWithListEntries(teamNames, teamIds);

  const hitboxClass = headerActions
    ? ACTIVITY_HEADER_ACTION_HITBOX_CLASS
    : gridOverviewActions
      ? GRID_A_OVERVIEW_ACTION_HITBOX_CLASS
      : 'hover:bg-muted focus-visible:ring-ring inline-flex size-5 shrink-0 cursor-default items-center justify-center rounded border-0 bg-transparent p-0 focus-visible:ring-2 focus-visible:outline-none';

  const iconClass =
    gridOverviewActions || headerActions
      ? GRID_A_OVERVIEW_ACTION_ICON_CLASS
      : 'size-4';

  const VisibilityIcon = isRestricted ? GlobeOff : Globe;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-no-row-nav
          onClick={(e) => e.stopPropagation()}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn(
            hitboxClass,
            'relative',
            hasShares
              ? ACTIVITY_OVERVIEW_ICON_ACTIVE_CLASS
              : ACTIVITY_OVERVIEW_ICON_MUTED_CLASS
          )}
        >
          <span className="relative inline-flex shrink-0">
            <Users className={iconClass} fill="none" aria-hidden />
            {showShareCountBadge && hasShares ? (
              <span className={ACTIVITY_SHARE_COUNT_BADGE_CLASS} aria-hidden>
                {badgeText}
              </span>
            ) : null}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 overflow-x-hidden p-0"
        align="start"
        side="top"
        data-no-row-nav
        onClick={(e) => e.stopPropagation()}
      >
        <p className="px-3 pt-3 pb-2 text-sm font-medium text-slate-900">
          {popoverTitle}
        </p>
        {hasShares ? (
          <ul
            className="popover-list-scroll text-foreground max-h-[min(var(--popover-list-max-height),var(--radix-popover-content-available-height))] list-none space-y-1 overflow-y-auto border-t px-3 py-2 text-sm"
            aria-label="Shared teams"
          >
            {sharedTeams.map((team) => (
              <li key={team.key} className="truncate">
                {team.name}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="border-t px-3 py-2">
          <p className="text-muted-foreground flex items-start gap-2 text-xs">
            <VisibilityIcon className="mt-px size-3.5 shrink-0" aria-hidden />
            <span>{visibilityDescription}</span>
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
