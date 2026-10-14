import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react';

import { FILTER_PANEL_MIN_WIDTH } from '@/components/table/tableConstants';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type SortLevel = { key: string; direction: 'asc' | 'desc' };

export interface SortColumnConfig {
  id: string;
  label: string;
  defaultDirection?: 'asc' | 'desc';
  /** When set, used for the sort trigger suffix instead of A–Z / Newest. */
  directionLabels?: { asc: string; desc: string };
  /** Tie-breaker sort levels applied when this column is primary (under the hood). */
  tieBreakers?: SortLevel[];
}

interface SortDropdownProps {
  columns: SortColumnConfig[];
  sortKey: string | null;
  sortDirection: 'asc' | 'desc';
  onSortChange: (key: string | null, direction: 'asc' | 'desc') => void;
  /** Default sort when none selected (used for initial display). */
  defaultSortKey: string;
  defaultSortDirection: 'asc' | 'desc';
  /** When set, use this string as the trigger button label instead of the dynamic column + direction. */
  triggerLabel?: string;
  /** When true, do not append direction (e.g. "Newest", "A–Z") to the trigger label. */
  hideDirectionLabel?: boolean;
  triggerClassName?: string;
  ariaLabel?: string;
}

function directionLabel(
  column: SortColumnConfig,
  direction: 'asc' | 'desc'
): string {
  if (column.directionLabels) {
    return column.directionLabels[direction];
  }
  const isDateLike = column.defaultDirection === 'desc';
  if (isDateLike) {
    return direction === 'desc' ? 'Newest' : 'Oldest';
  }
  return direction === 'asc' ? 'A–Z' : 'Z–A';
}

export function SortDropdown({
  columns,
  sortKey,
  sortDirection,
  onSortChange,
  defaultSortKey,
  defaultSortDirection,
  triggerLabel: triggerLabelProp,
  hideDirectionLabel = false,
  triggerClassName,
  ariaLabel = 'Sort by',
}: SortDropdownProps) {
  const effectiveKey = sortKey ?? defaultSortKey;
  const effectiveDirection =
    sortKey !== null ? sortDirection : defaultSortDirection;
  const activeColumn = columns.find((c) => c.id === effectiveKey);
  const triggerLabel =
    triggerLabelProp != null
      ? triggerLabelProp
      : activeColumn
        ? hideDirectionLabel
          ? activeColumn.label
          : `${activeColumn.label} ${directionLabel(activeColumn, effectiveDirection)}`
        : 'Sort by';

  const SortIcon = effectiveDirection === 'asc' ? ArrowUp : ArrowDown;

  const handleSelect = (col: SortColumnConfig) => {
    const isActive = effectiveKey === col.id;
    if (isActive) {
      onSortChange(col.id, effectiveDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(col.id, col.defaultDirection ?? 'asc');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-10 justify-between gap-2 font-normal',
            triggerClassName
          )}
          aria-label={
            activeColumn
              ? `${ariaLabel} ${activeColumn.label}, ${effectiveDirection === 'asc' ? 'ascending' : 'descending'}`
              : ariaLabel
          }
        >
          <SortIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(FILTER_PANEL_MIN_WIDTH, 'w-56')}
      >
        {columns.map((col) => {
          const isActive = effectiveKey === col.id;
          const direction = isActive
            ? effectiveDirection
            : (col.defaultDirection ?? 'asc');
          const SortIcon = direction === 'asc' ? ArrowUp : ArrowDown;
          return (
            <DropdownMenuItem
              key={col.id}
              onSelect={(e) => {
                // Keep sort menu open so user can toggle asc/desc without auto-closing
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
