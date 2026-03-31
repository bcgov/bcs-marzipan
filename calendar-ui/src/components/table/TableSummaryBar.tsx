import { X } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface BooleanFilter {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** When true, checkbox is disabled and not editable. */
  disabled?: boolean;
  /** Shown only when disabled is true; directs user why the control is disabled. */
  disabledTooltip?: string;
}

const DEFAULT_MAX_VISIBLE_FILTER_TYPES = 3;

interface TableSummaryBarProps {
  count: number;
  singularLabel: string;
  pluralLabel?: string;
  filters?: BooleanFilter[];
  /** Shown after the count when a saved filter is the active selection. */
  appliedSavedFilterName?: string | null;
  /**
   * Active filter dimension labels (e.g. Category, Date). Ignored when
   * `appliedSavedFilterName` is set. Hidden on small screens; use `onClearFilters` for mobile.
   */
  appliedFilterTypeLabels?: string[];
  /** Defaults to 3; remainder summarized as “+n more”. */
  maxVisibleFilterTypes?: number;
  /** When set, renders a compact “Clear filters” control for all breakpoints. */
  onClearFilters?: () => void;
  className?: string;
}

export function TableSummaryBar({
  count,
  singularLabel,
  pluralLabel,
  filters = [],
  appliedSavedFilterName = null,
  appliedFilterTypeLabels = [],
  maxVisibleFilterTypes = DEFAULT_MAX_VISIBLE_FILTER_TYPES,
  onClearFilters,
  className,
}: TableSummaryBarProps) {
  const label =
    count === 1 ? singularLabel : (pluralLabel ?? singularLabel + 's');

  const maxTypes = Math.max(1, maxVisibleFilterTypes);
  const typeLabels =
    appliedSavedFilterName != null ? [] : appliedFilterTypeLabels;
  const visibleTypeCount = Math.min(typeLabels.length, maxTypes);
  const overflowTypeCount = typeLabels.length - visibleTypeCount;
  const filteringOnText =
    typeLabels.length === 0
      ? ''
      : overflowTypeCount > 0
        ? `${typeLabels.slice(0, visibleTypeCount).join(', ')}, +${overflowTypeCount} more`
        : typeLabels.join(', ');
  const filterParenthetical =
    typeLabels.length === 0 ? '' : `(Filtering by: ${filteringOnText})`;

  return (
    <div
      className={cn(
        'text-foreground mb-0 flex min-h-9 flex-wrap items-center justify-between gap-4 text-sm',
        className
      )}
    >
      <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span className="shrink-0">
            Showing {count} {label}
          </span>
          {appliedSavedFilterName ? (
            <span className="text-stone-500" aria-live="polite">
              (Filtering by: {appliedSavedFilterName})
            </span>
          ) : filteringOnText ? (
            <>
              <span className="sr-only text-stone-500 md:hidden">
                {filterParenthetical}
              </span>
              <span className="hidden min-w-0 text-stone-500 md:inline">
                {filterParenthetical}
              </span>
            </>
          ) : null}
        </span>
        {onClearFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0 text-sm font-normal transition-colors outline-none focus-visible:ring-[3px]"
            aria-label="Clear all filters"
          >
            <X className="size-3 shrink-0" aria-hidden />
            Clear all filters
          </button>
        ) : null}
      </span>
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          {filters.map((filter) => {
            const isDisabled = filter.disabled === true;
            const labelClassName = cn(
              'text-foreground flex items-center gap-2 text-sm',
              isDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
            );
            const labelContent = (
              <>
                <Checkbox
                  checked={filter.checked}
                  onCheckedChange={(v) => filter.onCheckedChange(v === true)}
                  aria-label={filter.label}
                  className="border-input"
                  disabled={isDisabled}
                />
                {filter.label}
              </>
            );
            return (
              <span key={filter.id}>
                {isDisabled && filter.disabledTooltip ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className={labelClassName}>{labelContent}</label>
                    </TooltipTrigger>
                    <TooltipContent>{filter.disabledTooltip}</TooltipContent>
                  </Tooltip>
                ) : (
                  <label className={labelClassName}>{labelContent}</label>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
