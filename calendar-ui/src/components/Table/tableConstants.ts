/**
 * Shared constants and class names for data tables (Users, Teams, Calendar Entries).
 * Use these to keep table layout and styling consistent and avoid drift.
 */

/** Scroll area height for data tables. Used by TableScrollContainer so Users table and EventTable (Calendar Entries) share the same height and behavior. */
export const TABLE_SCROLL_HEIGHT =
  'max(240px, min(600px, 60vh, 100vh - 400px))';

/** Outer wrapper: rounded border, fixed height, flex column. Constrained so table scrolls inside, not page. */
export const tableContainer =
  'flex min-w-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white';

/** Inner scrollable div (assign ref for scrollTo). Bounded so horizontal scroll is inside this div. */
export const tableScrollWrapper =
  'min-h-0 min-w-0 w-full max-w-full flex-1 overflow-auto';

/** Base table element; add min-w-[Npx] per table if needed */
export const tableTable = 'w-full table-fixed border-collapse';

/** Sticky header row */
export const tableThead =
  'sticky top-0 z-10 border-b border-slate-200 bg-slate-50 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]';

/** Header cell: 12px vertical / 16px horizontal padding (py-3 px-4), content aligned top */
export const tableTh =
  'px-4 py-3 text-left text-sm font-medium text-slate-700 align-top';

/** Body row */
export const tableBodyRow = 'border-b border-slate-100 hover:bg-slate-50/50';

/** Body cell: 12px vertical / 16px horizontal padding (py-3 px-4), content aligned top. Matches Users table. */
export const tableTd = 'px-4 py-3 align-top';

/** EventTable (Calendar Entries) column widths in pixels. Update here to change all at once. */
export const EVENT_TABLE_COLUMN_WIDTHS = {
  overview: 300,
  summary: 300,
  scheduling: 280,
  leads: 180,
  materials: 200,
  status: 160,
} as const;
