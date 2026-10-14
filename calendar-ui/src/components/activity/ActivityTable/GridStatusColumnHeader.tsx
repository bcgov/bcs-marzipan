import {
  COLUMN_SORT_DROPDOWN_DATA_ATTR,
  ColumnSortDropdown,
} from '@/components/table/ColumnSortDropdown';
import { SortIndicator } from '@/components/table/SortIndicator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  ACTIVITY_SORT_COLUMNS,
  STATUS_COLUMN_SORT_KEYS,
} from './activityTableSortColumns';

export interface GridStatusColumnHeaderProps {
  effectiveSortKey: string;
  effectiveSortDirection: 'asc' | 'desc';
  onSortChange: (key: string | null, direction: 'asc' | 'desc') => void;
}

/** Status column header with multi-key sort dropdown for Grid A. */
export function GridStatusColumnHeader({
  effectiveSortKey,
  effectiveSortDirection,
  onSortChange,
}: GridStatusColumnHeaderProps) {
  const statusSortKeys: string[] = [...STATUS_COLUMN_SORT_KEYS];
  const isStatusSortActive = statusSortKeys.includes(effectiveSortKey);
  const statusLabel = isStatusSortActive
    ? (ACTIVITY_SORT_COLUMNS.find((c) => c.id === effectiveSortKey)?.label ??
      effectiveSortKey)
    : null;
  const sortIndicator = (
    <SortIndicator
      columnId={statusSortKeys}
      sortKey={effectiveSortKey}
      sortDirection={effectiveSortDirection}
      className="h-4 w-4"
    />
  );

  return (
    <span className="inline-flex items-center gap-1">
      Status
      <span className="inline-flex items-center gap-0.5">
        {isStatusSortActive && statusLabel ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">{sortIndicator}</span>
            </TooltipTrigger>
            <TooltipContent>Sorted by {statusLabel}</TooltipContent>
          </Tooltip>
        ) : (
          sortIndicator
        )}
        <ColumnSortDropdown
          sortKeys={statusSortKeys}
          columns={ACTIVITY_SORT_COLUMNS}
          effectiveSortKey={effectiveSortKey}
          effectiveSortDirection={effectiveSortDirection}
          onSortChange={onSortChange}
          triggerClassName="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
          iconClassName="text-slate-400"
          ariaLabel="Sort Status column by"
        />
      </span>
    </span>
  );
}

/** Returns true when a click target should not trigger header sort. */
export function isGridHeaderSortBlocked(target: EventTarget | null): boolean {
  return Boolean(
    (target as HTMLElement | null)?.closest(
      `[${COLUMN_SORT_DROPDOWN_DATA_ATTR}]`
    )
  );
}
