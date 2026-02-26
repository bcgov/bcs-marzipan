import type { SortColumnConfig } from '@/components/Table/SortDropdown';
import { SortIndicator } from '@/components/Table/SortIndicator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SortableColumnHeaderProps {
  /** Column title shown in the header (e.g. "Overview", "Scheduling"). */
  title: string;
  /** Sort key id for this column (e.g. "activityId", "startDate"). */
  sortColumnId: string;
  /** Column configs used to resolve the tooltip label when this column is active. */
  sortColumns: SortColumnConfig[];
  effectiveSortKey: string;
  effectiveSortDirection: 'asc' | 'desc';
  /** Optional class for the sort indicator icon. */
  indicatorClassName?: string;
}

/**
 * Renders a table header with a title and sort indicator. When this column is
 * the active sort, the indicator is wrapped in a tooltip showing "Sorted by {label}".
 */
export function SortableColumnHeader({
  title,
  sortColumnId,
  sortColumns,
  effectiveSortKey,
  effectiveSortDirection,
  indicatorClassName = 'h-4 w-4',
}: SortableColumnHeaderProps) {
  const label =
    sortColumns.find((c) => c.id === sortColumnId)?.label ?? sortColumnId;
  const indicator = (
    <SortIndicator
      columnId={sortColumnId}
      sortKey={effectiveSortKey}
      sortDirection={effectiveSortDirection}
      className={indicatorClassName}
    />
  );
  const isActive = effectiveSortKey === sortColumnId;

  return (
    <span className="inline-flex items-center gap-1">
      {title}
      {isActive ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">{indicator}</span>
          </TooltipTrigger>
          <TooltipContent>Sorted by {label}</TooltipContent>
        </Tooltip>
      ) : (
        indicator
      )}
    </span>
  );
}
