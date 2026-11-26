import { GRID_A_SELECT_COLUMN_WIDTH_PX } from './selectColumnLayout';

/** Default column order and minimum widths (px) for Grid A. */

export const GRID_A_COLUMN_ORDER = [
  'select',
  'overview',
  'summary',
  'scheduling',
  'materials',
  'status',
] as const;

/** Columns users can show or hide; select and overview are always shown. */
export const GRID_A_HIDEABLE_COLUMNS = [
  { id: 'summary', label: 'Summary' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'materials', label: 'Comms' },
  { id: 'status', label: 'Status' },
] as const;

export const GRID_A_COLUMN_WIDTHS: Record<string, number> = {
  select: GRID_A_SELECT_COLUMN_WIDTH_PX,
  /** Stacked display ID + actions; category badges truncate within this width. */
  overview: 148,
  summary: 400,
  scheduling: 306,
  materials: 221,
  /** Status / LA badges wrap and truncate; timestamps stack beneath. */
  status: 236,
};

/** Default resize cap for Grid A columns without an explicit max. */
export const GRID_A_DEFAULT_MAX_COLUMN_WIDTH_PX = 900;

/** Per-column resize caps (overview is pinned; status content truncates). */
export const GRID_A_COLUMN_MAX_WIDTHS: Record<string, number> = {
  overview: 200,
  status: 280,
};

export function gridColumnMaxSize(columnId: string): number {
  return (
    GRID_A_COLUMN_MAX_WIDTHS[columnId] ?? GRID_A_DEFAULT_MAX_COLUMN_WIDTH_PX
  );
}

/** Clamp a width to Grid A min/max for a column id. */
export function clampGridColumnWidth(
  columnId: string,
  width: number,
  minWidths: Record<string, number> = GRID_A_COLUMN_WIDTHS
): number {
  const minSize = minWidths[columnId] ?? 80;
  const maxSize = gridColumnMaxSize(columnId);
  return Math.min(maxSize, Math.max(minSize, Math.round(width)));
}

export function clampGridColumnSizingRecord(
  sizing: Record<string, number>,
  minWidths: Record<string, number> = GRID_A_COLUMN_WIDTHS
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [id, size] of Object.entries(sizing)) {
    result[id] = clampGridColumnWidth(id, size, minWidths);
  }
  return result;
}

/** TanStack column size props using persisted width when available. */
export function gridColumnSize(
  columnId: string,
  defaultWidths: Record<string, number>,
  storedSizing: Record<string, number>
) {
  const minSize = defaultWidths[columnId] ?? 80;
  const maxSize = gridColumnMaxSize(columnId);
  const stored = storedSizing[columnId];
  const size =
    stored != null
      ? clampGridColumnWidth(columnId, stored, defaultWidths)
      : minSize;
  return {
    size,
    minSize,
    maxSize,
    enableResizing: true as const,
  };
}
