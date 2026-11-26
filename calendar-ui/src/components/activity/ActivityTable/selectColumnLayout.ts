/** Grid A bulk-select column layout tokens. */

export const GRID_A_SELECT_COLUMN_CELL_CLASS = 'overflow-visible px-0';

/** Select column header: vertical center for bulk checkbox (overrides tableTh align-top). */
export const GRID_A_SELECT_COLUMN_HEADER_CELL_CLASS = `${GRID_A_SELECT_COLUMN_CELL_CLASS} align-middle`;

export const GRID_A_SELECT_COLUMN_WIDTH_PX = 52;

const selectCheckboxAlignBase = 'flex w-full justify-start pl-3';

/** Header checkbox + menu trigger row. */
export const GRID_A_SELECT_CHECKBOX_HEADER_ALIGN_CLASS = `${selectCheckboxAlignBase} min-h-5 -translate-y-0.5 items-center`;

/** Body checkbox row (top-aligned with grid content). */
export const GRID_A_SELECT_CHECKBOX_ROW_ALIGN_CLASS = `${selectCheckboxAlignBase} items-start`;

/** Body row hit target (24px wide for a consistent click band). */
export const GRID_A_SELECT_CHECKBOX_HIT_CLASS =
  'inline-flex h-6 min-w-6 items-center justify-start';

/** Header checkbox: tight to the 16px control; menu trigger owns trailing slack. */
export const GRID_A_SELECT_CHECKBOX_HEADER_HIT_CLASS =
  'inline-flex h-6 shrink-0 items-center justify-start';

/**
 * Header menu trigger: fills trailing column width so the chevron hit target
 * includes slack to the right of the checkbox (do not use row h-6 or it sits low vs text-sm titles).
 */
export const GRID_A_SELECT_CHECKBOX_HEADER_TRIGGER_CLASS =
  'inline-flex min-h-6 min-w-0 flex-1 cursor-pointer items-center justify-center border-0 bg-transparent p-0';
