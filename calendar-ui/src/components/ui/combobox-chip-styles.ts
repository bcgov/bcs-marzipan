/**
 * Shared visual styles for multi-select value chips (combobox, freeform combobox,
 * saved filter dialogs). Matches the combobox `ComboboxChip` defaults.
 *
 * In narrow columns, long values ellipsize once the label is wrapped with
 * `CHIP_LABEL_CLASSES` inside this flex row.
 */
export const CHIP_VISUAL_CLASSES =
  'bg-muted text-foreground flex h-[calc(--spacing(6))] w-fit max-w-full min-w-0 items-center justify-start gap-1 rounded-sm px-1.5 text-sm font-medium truncate';

/**
 * Flex child around the chip label text so `text-overflow: ellipsis` applies (required with the flex shell above).
 */
export const CHIP_LABEL_CLASSES = 'min-w-0 flex-1 truncate';
