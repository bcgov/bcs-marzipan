/** Default column order and minimum widths (px) for Grid A. */

export const GRID_A_COLUMN_ORDER = [
  'select',
  'overview',
  'summary',
  'scheduling',
  'materials',
  'status',
] as const;

export const GRID_A_COLUMN_WIDTHS: Record<string, number> = {
  select: 44,
  overview: 254,
  summary: 400,
  scheduling: 306,
  materials: 221,
  status: 251,
};

/** TanStack column size props using persisted width when available. */
export function gridColumnSize(
  columnId: string,
  defaultWidths: Record<string, number>,
  storedSizing: Record<string, number>
) {
  const minSize = defaultWidths[columnId] ?? 80;
  const size = storedSizing[columnId] ?? minSize;
  return {
    size,
    minSize,
    maxSize: 900,
    enableResizing: true as const,
  };
}
