import { Info, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

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

const FILTER_POPOVER_SCROLL_CLASSNAME =
  'popover-list-scroll max-h-[min(var(--popover-list-max-height),var(--radix-popover-content-available-height))] overflow-y-auto';

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
    'text-stone-500 hover:text-stone-700 focus-visible:ring-ring/50 relative z-10 inline-flex size-4 shrink-0 cursor-pointer items-center justify-start rounded-sm border-0 bg-transparent p-0 outline-none focus-visible:ring-[3px]';

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
          <Info className="size-4 shrink-0" aria-hidden />
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

function buildFilterSummaryText(
  appliedSavedFilterName: string | null,
  appliedFilterTypeLabels: string[],
  maxVisibleFilterTypes: number
): {
  filterParenthetical: string;
  savedFilterParenthetical: string;
  showAdHocFilterSummary: boolean;
  showSavedFilterSummary: boolean;
} {
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
    typeLabels.length === 0 ? '' : `Filtering by: ${filteringOnText}`;
  const savedFilterParenthetical =
    appliedSavedFilterName != null
      ? `Filtering by: ${appliedSavedFilterName}`
      : '';

  return {
    filterParenthetical,
    savedFilterParenthetical,
    showAdHocFilterSummary:
      appliedSavedFilterName == null && typeLabels.length > 0,
    showSavedFilterSummary: appliedSavedFilterName != null,
  };
}

function FilterSummaryWithPopover({
  summaryText,
  filterDetailLines,
  filterPopoverScrollClassName,
  ariaLabel,
}: {
  summaryText: string;
  filterDetailLines: TableSummaryFilterDetailLine[];
  filterPopoverScrollClassName: string;
  ariaLabel: string;
}) {
  return (
    <span
      className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 leading-normal"
      aria-live="polite"
    >
      <FilterDetailPopover
        lines={filterDetailLines}
        scrollClassName={filterPopoverScrollClassName}
        ariaLabel={ariaLabel}
      />
      <span className="min-w-0 wrap-break-word">{summaryText}</span>
    </span>
  );
}

function FilterSummaryContent({
  filterParenthetical,
  savedFilterParenthetical,
  showSavedFilterSummary,
  showAdHocFilterSummary,
  filterDetailLines,
  filterPopoverScrollClassName,
  appliedSavedFilterName,
  onClearFilters,
}: {
  filterParenthetical: string;
  savedFilterParenthetical: string;
  showSavedFilterSummary: boolean;
  showAdHocFilterSummary: boolean;
  filterDetailLines: TableSummaryFilterDetailLine[];
  filterPopoverScrollClassName: string;
  appliedSavedFilterName: string | null;
  onClearFilters?: () => void;
}) {
  const showFilterRow =
    showSavedFilterSummary || showAdHocFilterSummary || onClearFilters != null;
  const showSummaryText = showSavedFilterSummary || showAdHocFilterSummary;

  if (!showFilterRow) {
    return null;
  }

  return (
    <div className="flex min-h-6 min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      {showSummaryText && filterDetailLines.length > 0 ? (
        <FilterSummaryWithPopover
          summaryText={
            showSavedFilterSummary
              ? savedFilterParenthetical
              : filterParenthetical
          }
          filterDetailLines={filterDetailLines}
          filterPopoverScrollClassName={filterPopoverScrollClassName}
          ariaLabel={
            showSavedFilterSummary
              ? `Filtering by ${appliedSavedFilterName}. Show filter details.`
              : `${filterParenthetical} Show filter details.`
          }
        />
      ) : null}
      {onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-normal transition-colors outline-none focus-visible:ring-[3px]"
          aria-label="Reset all"
        >
          <X className="size-3 shrink-0" aria-hidden />
          Reset all
        </button>
      ) : null}
    </div>
  );
}

export interface TableFilterSummaryProps {
  /** Shown when a saved filter is the active selection. */
  appliedSavedFilterName?: string | null;
  /** Active filter dimension labels (e.g. Category, Date). Ignored when `appliedSavedFilterName` is set. */
  appliedFilterTypeLabels?: string[];
  /** Defaults to 3; remainder summarized as “+n more”. */
  maxVisibleFilterTypes?: number;
  /** When set, renders a compact “Reset all” control for all breakpoints. */
  onClearFilters?: () => void;
  /**
   * When non-empty, an info control before the summary opens a read-only popover with one row
   * per active dimension (values may be truncated per activity table rules).
   */
  filterDetailLines?: TableSummaryFilterDetailLine[];
  className?: string;
}

export function TableFilterSummary({
  appliedSavedFilterName = null,
  appliedFilterTypeLabels = [],
  maxVisibleFilterTypes = DEFAULT_MAX_VISIBLE_FILTER_TYPES,
  onClearFilters,
  filterDetailLines = [],
  className,
}: TableFilterSummaryProps) {
  const {
    filterParenthetical,
    savedFilterParenthetical,
    showAdHocFilterSummary,
    showSavedFilterSummary,
  } = buildFilterSummaryText(
    appliedSavedFilterName,
    appliedFilterTypeLabels,
    maxVisibleFilterTypes
  );
  const effectiveDetailLines =
    filterDetailLines.length > 0
      ? filterDetailLines
      : appliedSavedFilterName
        ? [{ label: 'Saved filter', value: appliedSavedFilterName }]
        : [];

  return (
    <div className={cn('text-foreground min-h-6 shrink-0 text-xs', className)}>
      <FilterSummaryContent
        filterParenthetical={filterParenthetical}
        savedFilterParenthetical={savedFilterParenthetical}
        showSavedFilterSummary={showSavedFilterSummary}
        showAdHocFilterSummary={showAdHocFilterSummary}
        filterDetailLines={effectiveDetailLines}
        filterPopoverScrollClassName={FILTER_POPOVER_SCROLL_CLASSNAME}
        appliedSavedFilterName={appliedSavedFilterName}
        onClearFilters={onClearFilters}
      />
    </div>
  );
}

export function TableSummaryBooleanFilters({
  filters,
  className,
}: {
  filters: BooleanFilter[];
  className?: string;
}) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
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
  );
}

export interface TableContentSummaryProps {
  count: number;
  singularLabel: string;
  pluralLabel?: string;
  /** When false, omits the default “Showing N …” label (use `leading` instead). */
  showCount?: boolean;
  /** Replaces or supplements the default count label (e.g. bulk selection summary). */
  leading?: ReactNode;
  filters?: BooleanFilter[];
  /** Rendered beside the count label (e.g. Expand all). */
  countTrailing?: ReactNode;
  /** Right-aligned controls on the count row (e.g. Note button). */
  actions?: ReactNode;
  className?: string;
}

export function TableContentSummary({
  count,
  singularLabel,
  pluralLabel,
  showCount = true,
  leading,
  filters = [],
  countTrailing,
  actions,
  className,
}: TableContentSummaryProps) {
  const label =
    count === 1 ? singularLabel : (pluralLabel ?? singularLabel + 's');

  const showCountRow =
    showCount ||
    leading != null ||
    countTrailing != null ||
    actions != null ||
    filters.length > 0;

  if (!showCountRow) {
    return null;
  }

  return (
    <div
      className={cn(
        'text-foreground flex min-h-9 flex-wrap items-center justify-between gap-4 text-sm',
        className
      )}
    >
      <span className="inline-flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        {leading ??
          (showCount ? (
            <span className="shrink-0 leading-normal font-medium">
              Showing {count} {label}
            </span>
          ) : null)}
        {countTrailing ? (
          <span className="inline-flex shrink-0 items-center">
            {countTrailing}
          </span>
        ) : null}
      </span>
      <span className="inline-flex shrink-0 items-center gap-4">
        <TableSummaryBooleanFilters filters={filters} />
        {actions ? (
          <span className="inline-flex items-center">{actions}</span>
        ) : null}
      </span>
    </div>
  );
}

interface TableSummaryBarProps extends TableFilterSummaryProps {
  count: number;
  singularLabel: string;
  pluralLabel?: string;
  /** When false, renders filter/reset controls without the item-count label. */
  showCount?: boolean;
  filters?: BooleanFilter[];
  /** Rendered beside the count label on the second row (e.g. Expand all). */
  countTrailing?: ReactNode;
  /** Right-aligned controls on the count row (e.g. Note button). */
  actions?: ReactNode;
  className?: string;
}

export function TableSummaryBar({
  count,
  singularLabel,
  pluralLabel,
  showCount = true,
  filters = [],
  appliedSavedFilterName = null,
  appliedFilterTypeLabels = [],
  maxVisibleFilterTypes = DEFAULT_MAX_VISIBLE_FILTER_TYPES,
  onClearFilters,
  filterDetailLines = [],
  countTrailing,
  actions,
  className,
}: TableSummaryBarProps) {
  return (
    <div
      className={cn(
        'text-foreground mb-0 flex flex-col gap-1 text-sm',
        className
      )}
    >
      <TableFilterSummary
        appliedSavedFilterName={appliedSavedFilterName}
        appliedFilterTypeLabels={appliedFilterTypeLabels}
        maxVisibleFilterTypes={maxVisibleFilterTypes}
        onClearFilters={onClearFilters}
        filterDetailLines={filterDetailLines}
      />
      <TableContentSummary
        count={count}
        singularLabel={singularLabel}
        pluralLabel={pluralLabel}
        showCount={showCount}
        filters={filters}
        countTrailing={countTrailing}
        actions={actions}
      />
    </div>
  );
}
