import { ArrowDown, ArrowUp } from 'lucide-react';

interface SortIndicatorProps {
  /** Single column id, or array of ids for columns that map multiple sort keys (arrow shows when sortKey matches any). */
  columnId: string | string[];
  sortKey: string | null;
  sortDirection: 'asc' | 'desc';
  className?: string;
}

function isSortKeyActive(
  sortKey: string | null,
  columnId: string | string[]
): boolean {
  if (!sortKey) return false;
  return Array.isArray(columnId)
    ? columnId.includes(sortKey)
    : sortKey === columnId;
}

/**
 * Renders an up or down arrow when this column is the active sort column; otherwise returns null.
 * Use next to table header content to show current sort state.
 * For columns with multiple sort keys, pass columnId as an array so the arrow shows when any of those keys is active.
 */
export function SortIndicator({
  columnId,
  sortKey,
  sortDirection,
  className,
}: SortIndicatorProps) {
  if (!isSortKeyActive(sortKey, columnId)) return null;
  const Icon = sortDirection === 'asc' ? ArrowUp : ArrowDown;
  return (
    <Icon
      className={className}
      aria-hidden
      aria-label={`Sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
    />
  );
}
