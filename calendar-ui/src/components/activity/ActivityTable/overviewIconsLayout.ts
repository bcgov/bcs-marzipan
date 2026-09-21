import { cn } from '@/lib/utils';

/** 24px hit target; size-4 glyphs match activity page header actions. */
export const GRID_A_OVERVIEW_ACTION_HITBOX_CLASS =
  'hover:bg-muted focus-visible:ring-ring inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';

export const GRID_A_OVERVIEW_ACTION_ICON_CLASS = 'size-4';

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
