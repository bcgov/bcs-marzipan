import { cn } from '@/lib/utils';

/** 24px hit target; size-4 glyphs match activity page header actions. */
export const GRID_A_OVERVIEW_ACTION_HITBOX_CLASS =
  'hover:bg-muted focus-visible:ring-ring inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';

export const GRID_A_OVERVIEW_ACTION_ICON_CLASS = 'size-4';

export const ACTIVITY_OVERVIEW_ICON_MUTED_CLASS = 'text-icon-muted-foreground';

/** Share icon when the activity has explicit shares. */
export const ACTIVITY_OVERVIEW_ICON_ACTIVE_CLASS = 'text-primary';

/** Watchlist star when favourited (filled). */
export const ACTIVITY_WATCHLIST_ICON_ACTIVE_CLASS = 'text-amber-500';

/** Compact count badge on share icons when the activity has shares. */
export const ACTIVITY_SHARE_COUNT_BADGE_CLASS =
  'pointer-events-none absolute -right-0.5 -bottom-0.5 flex h-3 min-w-3 items-center justify-center rounded-full bg-primary px-0.5 text-[8px] font-semibold leading-none text-primary-foreground';

/** Activity page header action row (size-9 ghost icon buttons). */
export const ACTIVITY_HEADER_ACTION_HITBOX_CLASS =
  'hover:bg-accent focus-visible:ring-ring inline-flex size-9 shrink-0 cursor-default items-center justify-center rounded-md border-0 bg-transparent p-0 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none';

/** Actions grow right from a fixed left edge (star) for row-to-row alignment. */
export const GRID_A_OVERVIEW_ACTIONS_ROW_CLASS =
  'flex min-w-0 flex-1 items-center justify-start gap-1.5';

/** Flag popover trigger styling aligned with other Grid A overview actions. */
export function gridOverviewFlagTriggerClassName(hasAssignedStack: boolean) {
  return cn(
    GRID_A_OVERVIEW_ACTION_HITBOX_CLASS,
    'font-normal hover:text-inherit',
    hasAssignedStack && 'h-6 min-h-6 min-w-6 w-auto px-1.5'
  );
}
