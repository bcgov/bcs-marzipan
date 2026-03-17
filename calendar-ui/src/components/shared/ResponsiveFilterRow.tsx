import {
  ChevronDownIcon,
  ChevronRight,
  Copy,
  Pencil,
  Save,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  forwardRef,
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

import { FILTER_PANEL_MIN_WIDTH } from '@/components/table/tableConstants';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  FilterTrigger,
  filterTriggerStyles,
} from '@/components/users/FilterTrigger';
import { useElementWidth } from '@/hooks/useElementWidth';
import { useSubPopoverHover } from '@/hooks/useSubPopoverHover';
import { cn } from '@/lib/utils';

const PLACEHOLDER_SAVED_FILTERS = [
  'Saved filter 1',
  'Saved filter 2',
  'Saved filter 3',
];

const SLOT_GAP_PX = 8;
const OVERFLOW_BUTTON_RESERVE_PX = 110;
const TRAILING_GROUP_OFFSET_PX = 32;
/** Min change in container width (px) before re-measuring. Avoids resize loop from small reflows. */
const WIDTH_CHANGE_THRESHOLD_PX = 10;
/** Debounce (ms) for ResizeObserver to avoid rapid re-measure during resize. */
const RESIZE_DEBOUNCE_MS = 80;

/** Renders one slot inline: Trigger + Popover + panel. */
function InlineFilterSlot({ slot }: { slot: ResponsiveFilterSlot }) {
  const { label, panel, triggerProps } = slot;
  const trigger = (
    <FilterTrigger
      label={label}
      active={triggerProps.active}
      count={triggerProps.count}
      onClear={triggerProps.onClear}
      clearAriaLabel={triggerProps.clearAriaLabel}
      disabled={triggerProps.disabled}
    />
  );
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className={cn(
          FILTER_PANEL_MIN_WIDTH,
          'max-h-[min(80vh,400px)] w-auto overflow-y-auto p-0'
        )}
        align="start"
      >
        {panel}
      </PopoverContent>
    </Popover>
  );
}

const OverflowFilterRow = forwardRef<
  HTMLButtonElement,
  {
    labelWithCount: string;
    triggerProps: ResponsiveFilterSlotTriggerProps;
  } & ComponentPropsWithoutRef<'button'>
>(function OverflowFilterRow(
  { labelWithCount, triggerProps, className, ...buttonProps },
  ref
) {
  const handleClearClick = useCallback(
    (e: MouseEvent<HTMLSpanElement>) => {
      e.preventDefault();
      e.stopPropagation();
      triggerProps.onClear();
    },
    [triggerProps]
  );
  const handleClearPointerDown = useCallback(
    (e: PointerEvent<HTMLSpanElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'data-[state=open]:bg-accent hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between gap-2 py-2 pr-4 pl-6 text-sm outline-none select-none',
        className
      )}
      {...buttonProps}
    >
      <span className="truncate">{labelWithCount}</span>
      <span className="flex shrink-0 items-center gap-1">
        {triggerProps.active && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClearClick}
            onPointerDown={handleClearPointerDown}
            className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex shrink-0 cursor-pointer items-center justify-center rounded p-0.5 align-middle"
            aria-label={triggerProps.clearAriaLabel}
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronRight className="text-muted-foreground h-4 w-4" />
      </span>
    </button>
  );
});

/** Overflow filter slot with sub-popover that opens on hover (mouse) or click/keyboard. */
function OverflowFilterPopover({
  entry,
  isOpen,
  onOpenChange,
}: {
  entry: ResponsiveFilterSlot;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { label, panel, triggerProps } = entry;
  const labelWithCount =
    triggerProps.active && triggerProps.count > 0
      ? `${label} (${triggerProps.count})`
      : label;
  const subPopoverHover = useSubPopoverHover(isOpen, onOpenChange);

  return (
    <Popover open={isOpen} onOpenChange={subPopoverHover.onOpenChange}>
      <PopoverTrigger asChild>
        <OverflowFilterRow
          labelWithCount={labelWithCount}
          triggerProps={triggerProps}
          {...subPopoverHover.triggerPointerHandlers}
        />
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className={cn(
          FILTER_PANEL_MIN_WIDTH,
          'max-h-[min(80vh,400px)] w-auto overflow-y-auto p-0'
        )}
        sideOffset={2}
        {...subPopoverHover.contentPointerHandlers}
      >
        {panel}
      </PopoverContent>
    </Popover>
  );
}

export interface ResponsiveFilterSlotTriggerProps {
  active: boolean;
  count: number;
  onClear: () => void;
  clearAriaLabel: string;
  disabled?: boolean;
}

export interface ResponsiveFilterSlot {
  key: string;
  label: string;
  /** Panel content only (no trigger, no scroll/border wrapper). Same in inline and overflow. */
  panel: ReactNode;
  /** Used for both inline trigger and overflow SubTrigger row (label, count, Clear). */
  triggerProps: ResponsiveFilterSlotTriggerProps;
}

export interface ResponsiveFilterRowProps {
  /** Ordered list of filter slots (panel + triggerProps). */
  slots: ResponsiveFilterSlot[];
  /** Label for the overflow trigger when some filters are visible inline. Default "More filters". */
  overflowTriggerLabel?: string;
  /** Label when no filters are visible inline (single "Filters" button). Default "Filters". */
  overflowTriggerLabelWhenAlone?: string;
  /** Class name for the overflow trigger button (e.g. h-10 for alignment). */
  overflowTriggerClassName?: string;
  /** Optional content rendered after the overflow trigger (e.g. Clear filters button). Shown only when some filters are visible inline; when only the Filters trigger is visible, use onClearAll instead. */
  trailingContent?: ReactNode;
  /** When provided and only the Filters trigger is visible (no inline slots), clicking the clear icon in the trigger calls this. Mirrors FilterTrigger clear behavior. */
  onClearAll?: () => void;
  /** Width in px to reserve for trailing content when measuring. */
  reservedWidthForTrailing?: number;
  /** Class name for the row container. */
  className?: string;
  /** Class name for the inner flex container that holds visible slots. */
  containerClassName?: string;
}

/**
 * Renders as many slot contents as fit in one row; the rest are moved into a
 * "More filters" (or "Filters" when none visible) popover with a Filters accordion,
 * My saved filters, and Save current filter. Uses ResizeObserver and layout measurement to compute how many slots fit.
 */
export function ResponsiveFilterRow({
  slots,
  overflowTriggerLabel = 'More filters',
  overflowTriggerLabelWhenAlone = 'Filters',
  overflowTriggerClassName,
  trailingContent,
  onClearAll,
  reservedWidthForTrailing,
  className,
  containerClassName,
}: ResponsiveFilterRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useElementWidth(containerRef, {
    minChange: WIDTH_CHANGE_THRESHOLD_PX,
    debounceMs: RESIZE_DEBOUNCE_MS,
  });
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const [filtersAccordionOpen, setFiltersAccordionOpen] = useState(false);
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);

  const count = slots.length;

  useEffect(() => {
    if (containerWidth > 0) setVisibleCount(null);
  }, [containerWidth]);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node || count === 0) {
      setVisibleCount(count);
      return;
    }
    if (containerWidth === 0) {
      setVisibleCount(0);
      return;
    }
    if (visibleCount !== null) return;

    const measureRow = node.querySelector<HTMLElement>(
      '[data-responsive-filter-row-measure="true"]'
    );
    if (!measureRow) {
      setVisibleCount(0);
      return;
    }

    const slotWrappers = measureRow.querySelectorAll<HTMLElement>(
      '[data-responsive-filter-slot="true"]'
    );
    const trailingReserve = reservedWidthForTrailing ?? 0;
    const availableWidth =
      containerWidth -
      TRAILING_GROUP_OFFSET_PX -
      OVERFLOW_BUTTON_RESERVE_PX -
      trailingReserve;

    let used = 0;
    let fitCount = 0;
    for (let i = 0; i < slotWrappers.length; i++) {
      const w = slotWrappers[i].offsetWidth;
      const need = used + (i > 0 ? SLOT_GAP_PX : 0) + w;
      if (need > availableWidth) break;
      used = need;
      fitCount = i + 1;
    }

    // Only treat fitCount 0 as invalid when layout is likely not ready (first slot has no width yet)
    const firstSlotWidth = slotWrappers[0]?.offsetWidth ?? -1;
    if (
      fitCount === 0 &&
      count > 0 &&
      slotWrappers.length > 0 &&
      firstSlotWidth === 0
    ) {
      fitCount = count;
    }

    // UX: show 0 inline when only 1–2 would fit; use single "Filters" button instead
    const displayCount = fitCount >= 3 ? fitCount : 0;

    setVisibleCount(displayCount);
  }, [visibleCount, containerWidth, count, reservedWidthForTrailing]);

  const finalVisible =
    visibleCount == null ? count : Math.min(Math.max(0, visibleCount), count);
  const visibleSlotEntries = slots.slice(0, finalVisible);
  const overflowSlotEntries = slots.slice(finalVisible);
  const hasOverflow = overflowSlotEntries.length > 0;

  const triggerLabel =
    finalVisible === 0 ? overflowTriggerLabelWhenAlone : overflowTriggerLabel;

  const overflowActiveCount = overflowSlotEntries.reduce(
    (sum, entry) =>
      sum + (entry.triggerProps.active ? entry.triggerProps.count : 0),
    0
  );
  const overflowTriggerActive = overflowActiveCount > 0;
  const triggerLabelWithCount = overflowTriggerActive
    ? `${triggerLabel} (${overflowActiveCount})`
    : triggerLabel;

  const showClearInTrigger =
    finalVisible === 0 && overflowTriggerActive && onClearAll != null;
  const handleClearAllClick = useCallback(
    (e: MouseEvent<HTMLSpanElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onClearAll?.();
    },
    [onClearAll]
  );
  const handleClearAllPointerDown = useCallback(
    (e: PointerEvent<HTMLSpanElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  if (count === 0) {
    return (
      <div
        ref={containerRef}
        className={cn('flex min-w-0 flex-1 items-center', className)}
      />
    );
  }

  const minWidthWhenMeasuring =
    visibleCount === null
      ? TRAILING_GROUP_OFFSET_PX +
        OVERFLOW_BUTTON_RESERVE_PX +
        (reservedWidthForTrailing ?? 0)
      : undefined;

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex min-w-0 flex-1 items-center justify-start',
        visibleCount === null && 'min-h-10',
        className
      )}
      style={
        minWidthWhenMeasuring != null
          ? { minWidth: minWidthWhenMeasuring }
          : undefined
      }
    >
      {visibleCount === null ? (
        <div
          data-responsive-filter-row-measure="true"
          className={cn(
            'flex flex-nowrap items-center gap-2 overflow-hidden',
            containerClassName
          )}
          style={{ visibility: 'hidden', position: 'absolute' }}
        >
          {slots.map((slot) => (
            <div
              key={slot.key}
              data-responsive-filter-slot="true"
              className="shrink-0"
            >
              <InlineFilterSlot slot={slot} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-10 shrink-0 items-center">
          <div
            className={cn(
              'flex flex-nowrap items-center gap-2',
              finalVisible > 0 && 'pr-8',
              containerClassName
            )}
          >
            {visibleSlotEntries.map((entry) => (
              <div key={entry.key} className="shrink-0">
                <InlineFilterSlot slot={entry} />
              </div>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    filterTriggerStyles.base,
                    'shrink-0 gap-1.5',
                    showClearInTrigger ? 'justify-between' : 'justify-start',
                    overflowTriggerActive
                      ? filterTriggerStyles.active
                      : filterTriggerStyles.inactive,
                    overflowTriggerClassName
                  )}
                  aria-label={
                    hasOverflow
                      ? finalVisible === 0
                        ? `${triggerLabel}; ${overflowSlotEntries.length} filters`
                        : `${triggerLabel}; ${overflowSlotEntries.length} more filters`
                      : `${triggerLabel}; saved filters and save current filter`
                  }
                >
                  <span className="flex min-w-0 shrink items-center gap-1.5">
                    <SlidersHorizontal
                      className={cn(
                        'h-4 w-4 shrink-0',
                        overflowTriggerActive ? 'opacity-100' : 'opacity-70'
                      )}
                    />
                    <span className="truncate">{triggerLabelWithCount}</span>
                  </span>
                  {showClearInTrigger && (
                    <span
                      role="button"
                      tabIndex={0}
                      onPointerDown={handleClearAllPointerDown}
                      onClick={handleClearAllClick}
                      className={filterTriggerStyles.clearIcon}
                      aria-label="Clear all filters"
                    >
                      <X className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className={cn(
                  FILTER_PANEL_MIN_WIDTH,
                  'flex max-h-[min(80vh,400px)] w-auto flex-col overflow-hidden p-0'
                )}
              >
                {hasOverflow && (
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <button
                      type="button"
                      className="hover:bg-accent hover:text-accent-foreground flex w-full cursor-default items-center gap-2 px-4 py-2 text-sm font-medium outline-none"
                      onClick={() => setFiltersAccordionOpen((prev) => !prev)}
                      aria-expanded={filtersAccordionOpen}
                    >
                      Filters
                      <ChevronDownIcon
                        className={cn(
                          'ml-auto size-4 transition-transform duration-200',
                          filtersAccordionOpen && 'rotate-180'
                        )}
                      />
                    </button>
                    {filtersAccordionOpen && (
                      <div>
                        {overflowSlotEntries.map((entry) => (
                          <OverflowFilterPopover
                            key={entry.key}
                            entry={entry}
                            isOpen={openFilterKey === entry.key}
                            onOpenChange={(open) =>
                              setOpenFilterKey(open ? entry.key : null)
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {hasOverflow && <div className="border-t" />}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent flex w-full items-center justify-between px-4 py-2 text-sm outline-none"
                    >
                      My saved filters
                      <ChevronRight className="text-muted-foreground ml-auto h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    align="start"
                    className="max-h-60 w-64 overflow-x-hidden overflow-y-auto p-0"
                    sideOffset={2}
                  >
                    <div className="grid grid-cols-[1fr_auto]">
                      {PLACEHOLDER_SAVED_FILTERS.map((label, i) => (
                        <Fragment key={i}>
                          <button
                            type="button"
                            className="hover:bg-accent hover:text-accent-foreground min-w-0 truncate py-2 pr-2 pl-4 text-left text-sm outline-none"
                            aria-label={`Apply ${label}`}
                          >
                            {label}
                          </button>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent flex w-8 shrink-0 items-center justify-center py-2 outline-none"
                                aria-label={`Actions for ${label}`}
                              >
                                <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              side="right"
                              align="start"
                              className="min-w-48 p-1"
                              sideOffset={2}
                            >
                              <button
                                type="button"
                                className="hover:bg-accent hover:text-accent-foreground flex w-full flex-col items-start gap-0 rounded-sm py-2 pr-2 pl-2 text-sm outline-none"
                              >
                                <span className="flex items-center gap-2">
                                  <Save className="size-4 shrink-0" />
                                  Update
                                </span>
                                <span className="text-muted-foreground pl-6 text-xs">
                                  To currently applied filters
                                </span>
                              </button>
                              <button
                                type="button"
                                className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-sm py-2 pr-2 pl-2 text-sm outline-none"
                              >
                                <Copy className="size-4" />
                                Duplicate
                              </button>
                              <button
                                type="button"
                                className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-sm py-2 pr-2 pl-2 text-sm outline-none"
                              >
                                <Pencil className="size-4" />
                                Rename
                              </button>
                              <button
                                type="button"
                                className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2 rounded-sm py-2 pr-2 pl-2 text-sm outline-none"
                              >
                                <Trash2 className="size-4" />
                                Delete saved filter
                              </button>
                            </PopoverContent>
                          </Popover>
                        </Fragment>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <button
                  type="button"
                  className="hover:bg-accent hover:text-accent-foreground w-full px-4 py-2 text-left text-sm outline-none"
                >
                  Save current filter
                </button>
              </PopoverContent>
            </Popover>
            {reservedWidthForTrailing != null ? (
              finalVisible > 0 ? (
                (trailingContent ?? (
                  <span
                    className="shrink-0"
                    style={{ width: reservedWidthForTrailing }}
                    aria-hidden
                  />
                ))
              ) : (
                <span
                  className="shrink-0"
                  style={{ width: reservedWidthForTrailing }}
                  aria-hidden
                />
              )
            ) : finalVisible > 0 ? (
              trailingContent
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
