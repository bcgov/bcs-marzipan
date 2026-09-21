import { Users } from 'lucide-react';

import {
  ACTIVITY_HEADER_ACTION_HITBOX_CLASS,
  ACTIVITY_OVERVIEW_ICON_ACTIVE_CLASS,
  ACTIVITY_OVERVIEW_ICON_MUTED_CLASS,
  ACTIVITY_SHARE_COUNT_BADGE_CLASS,
  GRID_A_OVERVIEW_ACTION_HITBOX_CLASS,
  GRID_A_OVERVIEW_ACTION_ICON_CLASS,
} from '@/components/activity/ActivityTable/overviewIconsLayout';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import {
  formatSharedWithCountBadge,
  sharedWithAriaLabel,
  sharedWithTooltipLines,
} from './sharedWithIndicatorCopy';

export interface SharedWithPopoverProps {
  /** Team display names the activity is shared with. */
  teamNames: string[];
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
 * Read-only shares and visibility indicator (tooltip on hover).
 */
export function SharedWithPopover({
  teamNames,
  visibility = null,
  leadTeamDisplayName = null,
  showShareCountBadge = true,
  gridOverviewActions = false,
  headerActions = false,
}: SharedWithPopoverProps) {
  const shareCount = teamNames.length;
  const hasShares = shareCount > 0;
  const ariaLabel = sharedWithAriaLabel(
    teamNames,
    visibility,
    leadTeamDisplayName
  );
  const tooltipLines = sharedWithTooltipLines(
    teamNames,
    visibility,
    leadTeamDisplayName
  );
  const badgeText = formatSharedWithCountBadge(shareCount);

  const hitboxClass = headerActions
    ? ACTIVITY_HEADER_ACTION_HITBOX_CLASS
    : gridOverviewActions
      ? GRID_A_OVERVIEW_ACTION_HITBOX_CLASS
      : 'hover:bg-muted focus-visible:ring-ring inline-flex size-5 shrink-0 cursor-default items-center justify-center rounded border-0 bg-transparent p-0 focus-visible:ring-2 focus-visible:outline-none';

  const iconClass =
    gridOverviewActions || headerActions
      ? GRID_A_OVERVIEW_ACTION_ICON_CLASS
      : 'size-4';

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <span
          data-no-row-nav
          onClick={(e) => e.stopPropagation()}
          tabIndex={0}
          aria-label={ariaLabel}
          className={cn(
            hitboxClass,
            'relative',
            hasShares
              ? ACTIVITY_OVERVIEW_ICON_ACTIVE_CLASS
              : ACTIVITY_OVERVIEW_ICON_MUTED_CLASS
          )}
        >
          <Users
            className={iconClass}
            fill={hasShares ? 'currentColor' : 'none'}
            aria-hidden
          />
          {showShareCountBadge && hasShares ? (
            <span className={ACTIVITY_SHARE_COUNT_BADGE_CLASS} aria-hidden>
              {badgeText}
            </span>
          ) : null}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs text-xs"
        data-no-row-nav
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-0.5">
          {tooltipLines.map((line, index) => (
            <p
              key={`${index}-${line}`}
              className={cn(
                index >= 2 && 'text-slate-600',
                index === 0 && 'font-medium text-slate-900'
              )}
            >
              {line}
            </p>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
