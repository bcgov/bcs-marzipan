/** Grid A bulk-select column layout tokens. */

export const GRID_A_SELECT_COLUMN_CELL_CLASS = 'overflow-visible px-0';

export const GRID_A_SELECT_COLUMN_WIDTH_PX = 52;

const selectCheckboxAlignBase = 'flex w-full justify-start pl-3';

/** Header checkbox + menu trigger row. */
export const GRID_A_SELECT_CHECKBOX_HEADER_ALIGN_CLASS = `${selectCheckboxAlignBase} mt-0.5 min-h-5 items-center`;

/** Body checkbox row (top-aligned with grid content). */
export const GRID_A_SELECT_CHECKBOX_ROW_ALIGN_CLASS = `${selectCheckboxAlignBase} items-start`;

/** Row hit target; checkbox flush-left to match the header control. */
export const GRID_A_SELECT_CHECKBOX_HIT_CLASS =
  'inline-flex h-6 min-w-6 items-center justify-start';

/** Header menu trigger (compact; do not use row h-6 or it sits low vs text-sm titles). */
export const GRID_A_SELECT_CHECKBOX_HEADER_TRIGGER_CLASS =
  'inline-flex shrink-0 cursor-pointer items-center justify-start gap-px border-0 bg-transparent p-0';
