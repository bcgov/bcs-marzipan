/**
 * Shared constants and class names for data tables (Users, Teams, Calendar Entries).
 * Use these to keep table layout and styling consistent and avoid drift.
 */

/**
 * Viewport-based table height: reserve space for everything except the scroll container
 * (page padding, pagination, filters/header/tabs/summary, borders) so {@link SidebarInset}
 * does not scroll. Tune this single offset if parent scroll appears after layout changes.
 */
const TABLE_SCROLL_PAGE_OFFSET = '24.25rem';

/** Upper bound for the scroll area on very tall viewports. */
const TABLE_SCROLL_VIEWPORT_MAX = '1200px';

/** Print preview toolbar (h-9) below the same chrome as data tables. */
const REPORT_PRINT_PREVIEW_TOOLBAR = '2.25rem';

const TABLE_SCROLL_VIEWPORT_HEIGHT = `calc(100svh - var(--header-height, 3.5rem) - ${TABLE_SCROLL_PAGE_OFFSET})`;

/** Scroll area height for data tables. Used by TableScrollContainer so Users table and EventTable (Calendar Entries) share the same height and behavior. */
export const TABLE_SCROLL_HEIGHT = `max(240px, min(${TABLE_SCROLL_VIEWPORT_MAX}, ${TABLE_SCROLL_VIEWPORT_HEIGHT}))`;

/** Print preview scroll height; same viewport reserve as {@link TABLE_SCROLL_HEIGHT} minus the preview toolbar row (h-9). */
export const REPORT_PRINT_PREVIEW_SCROLL_HEIGHT = `max(240px, min(${TABLE_SCROLL_VIEWPORT_MAX}, calc(${TABLE_SCROLL_VIEWPORT_HEIGHT} - ${REPORT_PRINT_PREVIEW_TOOLBAR})))`;

/** Min-width for filter/sort dropdown and popover panels. Use as className (e.g. with cn()) so base components stay flexible. */
export const FILTER_PANEL_MIN_WIDTH = 'min-w-[180px]';

/** Outer wrapper: rounded border, fixed height, flex column. Constrained so table scrolls inside, not page. */
export const tableContainer =
  'flex min-w-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white';

/** Inner scrollable div (assign ref for scrollTo). Bounded so horizontal scroll is inside this div. */
/* [overflow-y:scroll] can be removed if causing layout shift */
export const tableScrollWrapper =
  'min-h-0 min-w-0 w-full max-w-full flex-1 overflow-auto [overflow-y:scroll]';

/** Base table element; add min-w-[Npx] per table if needed */
export const tableTable = 'w-full table-fixed border-collapse';

/** Sticky header row */
export const tableThead =
  'sticky top-0 z-10 border-b border-slate-200 bg-accent shadow-[0_1px_0_0_rgba(0,0,0,0.05)]';

/** Header cell: 12px vertical / 16px horizontal padding (py-3 px-4), content aligned top */
export const tableTh =
  'px-4 py-3 text-left text-sm font-medium text-slate-700 align-top';

/** Body row */
export const tableBodyRow = 'border-b border-slate-100 hover:bg-accent/30';

/** Body cell: 12px vertical / 16px horizontal padding (py-3 px-4), content aligned top. Matches Users table. */
export const tableTd = 'px-4 py-3 align-top';

/** ActivityTable (Activities) column widths in pixels. minSize/maxSize used for layout bounds. */
export const ACTIVITY_TABLE_COLUMN_WIDTHS = {
  overview: { size: 300, minSize: 300, maxSize: 440 },
  summary: { size: 300, minSize: 300, maxSize: 440 },
  scheduling: { size: 280, minSize: 280, maxSize: 360 },
  leads: { size: 180, minSize: 180, maxSize: 240 },
  materials: { size: 200, minSize: 200, maxSize: 240 },
  status: { size: 160, minSize: 160, maxSize: 240 },
} as const;

export type ActivityTableColumnKey = keyof typeof ACTIVITY_TABLE_COLUMN_WIDTHS;

/** Returns size, minSize, maxSize for a given ActivityTable column (for spreading into column defs). */
export function getActivityColumnSizes(key: ActivityTableColumnKey): {
  size: number;
  minSize: number;
  maxSize: number;
} {
  const w = ACTIVITY_TABLE_COLUMN_WIDTHS[key];
  return { size: w.size, minSize: w.minSize, maxSize: w.maxSize };
}
