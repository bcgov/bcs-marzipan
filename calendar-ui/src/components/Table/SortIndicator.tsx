import { ArrowDown, ArrowUp } from 'lucide-react';

interface SortIndicatorProps {
  columnId: string;
  sortKey: string | null;
  sortDirection: 'asc' | 'desc';
  className?: string;
}

/**
 * Renders an up or down arrow when this column is the active sort column; otherwise returns null.
 * Use next to table header content to show current sort state.
 */
export function SortIndicator({
  columnId,
  sortKey,
  sortDirection,
  className,
}: SortIndicatorProps) {
  if (sortKey !== columnId) return null;
  const Icon = sortDirection === 'asc' ? ArrowUp : ArrowDown;
  return (
    <Icon
      className={className}
      aria-hidden
      aria-label={`Sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
    />
  );
}
