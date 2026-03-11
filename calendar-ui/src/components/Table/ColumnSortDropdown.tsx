import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react';

import type { SortColumnConfig } from '@/components/Table/SortDropdown';
import { FILTER_PANEL_MIN_WIDTH } from '@/components/Table/tableConstants';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/** Stops the table header click from firing when interacting with this control. */
export const COLUMN_SORT_DROPDOWN_DATA_ATTR = 'data-no-header-sort';

interface ColumnSortDropdownProps {
  /** Sort key ids that this column can be sorted by (subset of columns). */
  sortKeys: string[];
  /** Full column config to resolve labels and default directions. */
  columns: SortColumnConfig[];
  effectiveSortKey: string;
  effectiveSortDirection: 'asc' | 'desc';
  onSortChange: (key: string | null, direction: 'asc' | 'desc') => void;
  /** Applied to the trigger button (e.g. opacity-0 group-hover:opacity-100 for hover-reveal). */
  triggerClassName?: string;
  /** Applied to the ChevronDown icon (e.g. text-slate-400 for lighter fill). */
  iconClassName?: string;
  ariaLabel?: string;
}

/**
 * Dropdown shown next to the sort arrow for columns with multiple sort keys.
 * Lists only the options for this column; selecting one sets sort to that key (with its default direction).
 */
export function ColumnSortDropdown({
  sortKeys,
  columns,
  effectiveSortKey,
  effectiveSortDirection,
  onSortChange,
  triggerClassName,
  iconClassName,
  ariaLabel = 'Sort this column by',
}: ColumnSortDropdownProps) {
  const options = sortKeys
    .map((id) => columns.find((c) => c.id === id))
    .filter((c): c is SortColumnConfig => c != null);

  if (options.length === 0) return null;

  const handleSelect = (col: SortColumnConfig) => {
    const isActive = effectiveSortKey === col.id;
    if (isActive) {
      onSortChange(col.id, effectiveSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(col.id, col.defaultDirection ?? 'asc');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-6 w-6 shrink-0 transition-opacity',
            triggerClassName
          )}
          aria-label={ariaLabel}
          {...{ [COLUMN_SORT_DROPDOWN_DATA_ATTR]: true }}
          onClick={(e) => e.stopPropagation()}
        >
          <ChevronDown className={cn('h-4 w-4', iconClassName)} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn(FILTER_PANEL_MIN_WIDTH, 'w-48')}
      >
        {options.map((col) => {
          const isActive = effectiveSortKey === col.id;
          const direction = isActive
            ? effectiveSortDirection
            : (col.defaultDirection ?? 'asc');
          const SortIcon = direction === 'asc' ? ArrowUp : ArrowDown;
          return (
            <DropdownMenuItem
              key={col.id}
              onSelect={(e) => {
                e.preventDefault();
                handleSelect(col);
              }}
            >
              {isActive ? (
                <SortIcon className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <span className="w-4 shrink-0" aria-hidden />
              )}
              {col.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
