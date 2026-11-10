/**
 * Shared visual styles for multi-select value chips (combobox, freeform combobox,
 * saved filter dialogs). Matches the combobox `ComboboxChip` defaults.
 *
 * In narrow columns, long values ellipsize once the label is wrapped with
 * `CHIP_LABEL_CLASSES` inside this flex row.
 */
export const CHIP_LABEL_MAX_WIDTH_CLASS = 'max-w-[16rem]';

export const CHIP_VISUAL_CLASSES =
  'bg-muted text-foreground flex h-[calc(--spacing(6))] w-fit max-w-full min-w-0 items-center justify-start gap-1 rounded-sm px-1.5 text-sm font-medium truncate';

export const CHIP_LEAD_CHIP_RING_CLASSES = 'ring-1 ring-primary/25';

/**
 * Flex child around the chip label text so `text-overflow: ellipsis` applies (required with the flex shell above).
 */
export const CHIP_LABEL_CLASSES = `min-w-0 flex-1 truncate ${CHIP_LABEL_MAX_WIDTH_CLASS}`;

export const CHIP_LEAD_BADGE_CLASSES =
  'bg-primary/15 text-primary shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium';

/** Read-only secondary role (e.g. Joint). */
export const CHIP_OUTLINE_ROLE_BADGE_CLASSES =
  'border-border text-foreground shrink-0 rounded border bg-transparent px-1.5 py-0.5 text-[10px] font-medium';

/** Edit-mode role trigger (Joint / Set lead) before opening the set-lead popover. */
export const CHIP_OUTLINE_ROLE_BADGE_INTERACTIVE_CLASSES =
  'border-border text-foreground hover:bg-accent hover:border-primary/40 focus-visible:ring-ring shrink-0 cursor-pointer rounded border bg-transparent px-1.5 py-0.5 text-[10px] font-medium focus-visible:ring-2 focus-visible:outline-none';
