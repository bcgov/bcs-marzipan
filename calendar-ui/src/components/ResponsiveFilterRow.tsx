import { Copy, Pencil, Save, SlidersHorizontal, Trash2, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FilterTrigger } from '@/components/users/FilterTrigger';
import { useIsMobile } from '@/hooks/use-mobile';
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

/** Renders one slot for inline: Trigger + DropdownMenu or Popover + panel. */
function InlineFilterSlot({ slot }: { slot: ResponsiveFilterSlot }) {
  const { label, panel, triggerProps, wrapper } = slot;
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
  const contentClassName =
    wrapper === 'dropdown'
      ? 'max-h-[min(80vh,400px)] overflow-y-auto p-1'
      : 'w-auto p-0';
  if (wrapper === 'popover') {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className={contentClassName} align="start">
          {panel}
        </PopoverContent>
      </Popover>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className={contentClassName} align="start">
        {panel}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OverflowFilterSubTrigger({
  labelWithCount,
  triggerProps,
}: {
  labelWithCount: string;
  triggerProps: ResponsiveFilterSlotTriggerProps;
}) {
  const handleClearClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      triggerProps.onClear();
    },
    [triggerProps]
  );
  const handleClearPointerDown = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  return (
    <DropdownMenuSubTrigger className="data-[state=open]:bg-accent flex w-full items-center justify-between gap-2 rounded-none px-4 py-2">
      <span className="truncate">{labelWithCount}</span>
      {triggerProps.active && (
        <button
          type="button"
          onClick={handleClearClick}
          onPointerDown={handleClearPointerDown}
          className="text-muted-foreground hover:text-foreground hover:bg-accent shrink-0 rounded p-0.5"
          aria-label={triggerProps.clearAriaLabel}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </DropdownMenuSubTrigger>
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
  /** Inline only: whether to wrap panel in DropdownMenu or Popover. */
  wrapper: 'dropdown' | 'popover';
}

export interface ResponsiveFilterRowProps {
  /** Ordered list of filter slots (panel + triggerProps + wrapper). */
  slots: ResponsiveFilterSlot[];
  /** Label for the overflow trigger when some filters are visible inline. Default "More filters". */
  overflowTriggerLabel?: string;
  /** Label when no filters are visible inline (single "Filters" button). Default "Filters". */
  overflowTriggerLabelWhenAlone?: string;
  /** Class name for the overflow trigger button (e.g. h-10 for alignment). */
  overflowTriggerClassName?: string;
  /** Optional content rendered after the overflow trigger (e.g. Clear filters button). */
  trailingContent?: ReactNode;
  /** Width in px to reserve for trailing content when measuring. */
  reservedWidthForTrailing?: number;
  /** Class name for the row container. */
  className?: string;
  /** Class name for the inner flex container that holds visible slots. */
  containerClassName?: string;
}

/**
 * Renders as many slot contents as fit in one row; the rest are moved into a
 * "More filters" (or "Filters" when none visible) dropdown with an All filters accordion,
 * My saved filters, and Save current filter. Uses ResizeObserver and layout measurement to compute how many slots fit.
 */
export function ResponsiveFilterRow({
  slots,
  overflowTriggerLabel = 'More filters',
  overflowTriggerLabelWhenAlone = 'Filters',
  overflowTriggerClassName,
  trailingContent,
  reservedWidthForTrailing,
  className,
  containerClassName,
}: ResponsiveFilterRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const prevContainerWidthRef = useRef(0);
  const isMobile = useIsMobile();

  const count = slots.length;

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    setContainerWidth(node.clientWidth);

    if (typeof ResizeObserver === 'undefined') return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const debouncedUpdateWidth = () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        timeoutId = null;
        const current = containerRef.current;
        if (current) setContainerWidth(current.clientWidth);
      }, RESIZE_DEBOUNCE_MS);
    };

    const observer = new ResizeObserver(debouncedUpdateWidth);
    observer.observe(node);

    return () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (containerWidth === 0) return;
    const prev = prevContainerWidthRef.current;
    if (prev === containerWidth) return;
    const delta = Math.abs(containerWidth - prev);
    const pastThreshold =
      delta >= WIDTH_CHANGE_THRESHOLD_PX || prev === 0 || visibleCount === null;
    prevContainerWidthRef.current = containerWidth;
    if (pastThreshold) {
      setVisibleCount(null);
    }
  }, [containerWidth, visibleCount]);

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-10 shrink-0 justify-start gap-1.5 font-normal',
                    isMobile ? 'min-w-10 px-2' : 'min-w-[100px]',
                    overflowTriggerActive
                      ? 'border-primary bg-primary text-primary-foreground hover:opacity-90'
                      : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
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
                  <SlidersHorizontal className="h-4 w-4 shrink-0 opacity-70" />
                  {isMobile ? (
                    <span className="sr-only">{triggerLabelWithCount}</span>
                  ) : (
                    <span>{triggerLabelWithCount}</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="flex max-h-[min(80vh,400px)] w-[380px] flex-col overflow-hidden p-0"
              >
                {hasOverflow && (
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem
                        value="all-filters"
                        className="border-b last:border-b-0"
                      >
                        <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline [&[data-state=open]>svg]:rotate-180">
                          All filters
                        </AccordionTrigger>
                        <AccordionContent className="px-0 pt-0 pb-0">
                          {overflowSlotEntries.map((entry) => {
                            const { label, panel, triggerProps } = entry;
                            const labelWithCount =
                              triggerProps.active && triggerProps.count > 0
                                ? `${label} (${triggerProps.count})`
                                : label;
                            return (
                              <DropdownMenuSub key={entry.key}>
                                <OverflowFilterSubTrigger
                                  labelWithCount={labelWithCount}
                                  triggerProps={triggerProps}
                                />
                                <DropdownMenuSubContent className="max-h-[min(80vh,400px)] w-[320px] overflow-y-auto p-0">
                                  <div className="p-4">{panel}</div>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            );
                          })}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
                {hasOverflow && <DropdownMenuSeparator />}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="px-4 py-2">
                    My saved filters
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="grid max-h-60 w-64 grid-cols-[1fr_auto] overflow-x-hidden overflow-y-auto p-0">
                    {PLACEHOLDER_SAVED_FILTERS.flatMap((label, i) => [
                      <DropdownMenuItem
                        key={`${i}-item`}
                        className="min-w-0 rounded-none border-0 py-2"
                        onSelect={(e) => e.preventDefault()}
                        aria-label={`Apply ${label}`}
                      >
                        {label}
                      </DropdownMenuItem>,
                      <DropdownMenuSub key={`${i}-sub`}>
                        <DropdownMenuSubTrigger
                          className="w-8 shrink-0 justify-center rounded-none px-1 py-2"
                          aria-label={`Actions for ${label}`}
                        >
                          <span className="sr-only">Actions for {label}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="min-w-48">
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="flex flex-col items-start gap-0 py-2"
                          >
                            <span className="flex items-center gap-2">
                              <Save className="size-4 shrink-0" />
                              Update
                            </span>
                            <span className="text-muted-foreground pl-6 text-xs">
                              To currently applied filters
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Copy className="size-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Pencil className="size-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="size-4" />
                            Delete saved filter
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>,
                    ])}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem
                  className="px-4 py-2"
                  onSelect={(e) => e.preventDefault()}
                >
                  Save current filter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {reservedWidthForTrailing != null
              ? (trailingContent ?? (
                  <span
                    className="shrink-0"
                    style={{ width: reservedWidthForTrailing }}
                    aria-hidden
                  />
                ))
              : trailingContent}
          </div>
        </div>
      )}
    </div>
  );
}
