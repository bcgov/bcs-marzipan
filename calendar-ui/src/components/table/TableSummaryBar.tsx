import { Info, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

/** Lines shown in the optional “filtering by” detail popover (label + value per row). */
export interface TableSummaryFilterDetailLine {
  label: string;
  value: string;
}

const HOVER_CLOSE_DELAY_MS = 150;

function usePrefersHover(): boolean {
  const [value, setValue] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(hover: hover)').matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover)');
    const onChange = () => setValue(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return value;
}

function FilterDetailPopover({
  lines,
  scrollClassName,
  ariaLabel,
}: {
  lines: TableSummaryFilterDetailLine[];
  scrollClassName: string;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const prefersHover = usePrefersHover();
  const closeTimerRef = useRef<number | null>(null);

  const cancelScheduledClose = () => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleHoverOpen = () => {
    if (!prefersHover) return;
    cancelScheduledClose();
    setOpen(true);
  };

  const handleHoverScheduleClose = () => {
    if (!prefersHover) return;
    cancelScheduledClose();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, HOVER_CLOSE_DELAY_MS);
  };

  useEffect(
    () => () => {
      cancelScheduledClose();
    },
    []
  );

  const triggerClassName =
    'text-stone-500 hover:text-stone-700 focus-visible:ring-ring/50 relative z-10 -mr-1.5 inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-[3px]';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={triggerClassName}
          aria-label={ariaLabel}
          aria-expanded={open}
          onMouseEnter={handleHoverOpen}
          onMouseLeave={handleHoverScheduleClose}
        >
          <Info className="size-3.5 shrink-0" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 max-w-[min(20rem,100vw-1rem)] p-0"
        onMouseEnter={handleHoverOpen}
        onMouseLeave={handleHoverScheduleClose}
      >
        <div
          className={cn(
            scrollClassName,
            'flex flex-col gap-3 px-4 py-3 text-sm'
          )}
        >
          {lines.map((line, index) => (
            <p
              key={`${line.label}:${index}`}
              className="m-0 leading-snug wrap-break-word"
            >
              <span className="text-foreground font-normal">
                {line.label}:{' '}
              </span>
              <span className="text-muted-foreground">{line.value}</span>
            </p>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
  /** When set, renders a compact “Reset all filters” control for all breakpoints. */
  onClearFilters?: () => void;
  /**
   * When non-empty, an info control before the summary opens a read-only popover with one row
   * per active dimension (values may be truncated per activity table rules).
   */
  filterDetailLines?: TableSummaryFilterDetailLine[];
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
  filterDetailLines = [],
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
    typeLabels.length === 0 ? '' : `Filtered by: ${filteringOnText}`;
  const savedFilterParenthetical =
    appliedSavedFilterName != null
      ? `Filtered by: ${appliedSavedFilterName}`
      : '';
  const hasFilterDetailPopover = filterDetailLines.length > 0;
  const showAdHocFilterSummary = !appliedSavedFilterName && filteringOnText;
  const showSavedFilterSummary = appliedSavedFilterName != null;

  const filterPopoverScrollClassName =
    'popover-list-scroll max-h-[min(var(--popover-list-max-height),var(--radix-popover-content-available-height))] overflow-y-auto';

  return (
    <div
      className={cn(
        'text-foreground mb-0 flex min-h-9 flex-wrap items-center justify-between gap-4 text-sm',
        className
      )}
    >
      <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex min-h-9 min-w-0 flex-wrap items-center gap-x-1">
          <span className="shrink-0 leading-normal">
            Showing {count} {label}
          </span>
          {showSavedFilterSummary ? (
            hasFilterDetailPopover ? (
              <span
                className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-x-0 gap-y-1 leading-normal"
                aria-live="polite"
              >
                <FilterDetailPopover
                  lines={filterDetailLines}
                  scrollClassName={filterPopoverScrollClassName}
                  ariaLabel={`Filtered by ${appliedSavedFilterName}. Show filter details.`}
                />
                <span className="min-w-0 wrap-break-word">
                  {savedFilterParenthetical}
                </span>
              </span>
            ) : (
              <span className="leading-normal" aria-live="polite">
                {savedFilterParenthetical}
              </span>
            )
          ) : showAdHocFilterSummary ? (
            hasFilterDetailPopover ? (
              <span className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-x-0 gap-y-1 leading-normal">
                <FilterDetailPopover
                  lines={filterDetailLines}
                  scrollClassName={filterPopoverScrollClassName}
                  ariaLabel={`${filterParenthetical} Show filter details.`}
                />
                <span className="min-w-0 wrap-break-word">
                  {filterParenthetical}
                </span>
              </span>
            ) : (
              <>
                <span className="sr-only md:hidden">{filterParenthetical}</span>
                <span className="hidden min-w-0 leading-normal md:inline">
                  {filterParenthetical}
                </span>
              </>
            )
          ) : null}
        </span>
        {onClearFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-normal transition-colors outline-none focus-visible:ring-[3px]"
            aria-label="Reset all filters"
          >
            <X className="size-3 shrink-0" aria-hidden />
            Reset all filters
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
