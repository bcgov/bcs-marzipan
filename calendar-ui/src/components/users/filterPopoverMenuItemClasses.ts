import { cn } from '@/lib/utils';

/**
 * Shared keyboard focus ring for filter popover menus. Inset keeps the ring
 * inside the control so it is not clipped by overflow on popover/scroll parents.
 */
export const filterPopoverMenuItemFocusRingClass =
  'rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring';

/**
 * Standard in-panel menu row: hover + focus background + ring.
 * Use for overflow menu rows, nested popover menu actions, “Clear all” in lists, etc.
 */
export const filterPopoverMenuItemClass = cn(
  filterPopoverMenuItemFocusRingClass,
  'hover:bg-accent/70 hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground'
);

/**
 * Destructive row (e.g. delete saved filter).
 */
export const filterPopoverMenuItemDestructiveClass = cn(
  filterPopoverMenuItemFocusRingClass,
  'text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:text-destructive'
);

/**
 * PopoverTrigger row that opens a nested sub-popover (Leads sections, Translations
 * languages, overflow slot rows, saved-filter actions chevron).
 */
export const filterPopoverSubmenuTriggerClass = cn(
  filterPopoverMenuItemClass,
  'cursor-default select-none data-[state=open]:bg-accent'
);

/**
 * Clear (X) control beside the chevron on overflow / split trigger rows.
 */
export const filterPopoverSplitClearIconClass = cn(
  filterPopoverMenuItemFocusRingClass,
  'text-muted-foreground hover:text-foreground hover:bg-accent inline-flex shrink-0 cursor-pointer items-center justify-center p-0.5 align-middle focus-visible:bg-accent focus-visible:text-accent-foreground'
);
