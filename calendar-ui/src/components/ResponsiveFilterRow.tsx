import { SlidersHorizontal } from 'lucide-react';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const SLOT_GAP_PX = 8;
const OVERFLOW_BUTTON_RESERVE_PX = 110;
const TRAILING_GROUP_OFFSET_PX = 32;
/** Min available width (px) above which a measured fitCount of 0 is treated as invalid (e.g. layout not ready). */
const MIN_AVAILABLE_WIDTH_TO_TRUST_ZERO = 200;

export interface ResponsiveFilterSlot {
  key: string;
  label: string;
  content: ReactNode;
}

export interface ResponsiveFilterRowProps {
  /** Ordered list of filter slots (key, label, content). Same content is used inline and in the popover accordion. */
  slots: ResponsiveFilterSlot[];
  /** Label for the overflow trigger when some filters are visible inline. Default "More filters". */
  overflowTriggerLabel?: string;
  /** Label when no filters are visible inline (single "Filters" button). Default "Filters". */
  overflowTriggerLabelWhenAlone?: string;
  /** Class name for the overflow trigger button (e.g. h-10 for alignment). */
  overflowTriggerClassName?: string;
  /** Optional content rendered after the overflow trigger (e.g. Clear filters button). Keeps a consistent gap from the last visible filter. */
  trailingContent?: ReactNode;
  /** Width in px to reserve for trailing content when measuring. When set, a spacer is rendered when trailingContent is null so layout stays stable. */
  reservedWidthForTrailing?: number;
  /** Class name for the row container. */
  className?: string;
  /** Class name for the inner flex container that holds visible slots. */
  containerClassName?: string;
  /**
   * Active count per slot (same order as slots). Used to show the number of applied filters
   * that are currently in the "More filters" popover on the trigger (e.g. "More filters (3)").
   * Updates as slots move in/out of the popover on resize.
   */
  slotActiveCounts?: number[];
}

/**
 * Renders as many slot contents as fit in one row; the rest are moved into a
 * "More filters" (or "Filters" when none visible) popover with accordion sections.
 * Uses ResizeObserver and layout measurement to compute how many slots fit.
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
  slotActiveCounts,
}: ResponsiveFilterRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const prevContainerWidthRef = useRef(0);

  const count = slots.length;
  const slotContents = slots.map((s) => s.content);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateWidth = () => {
      setContainerWidth(node.clientWidth);
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const prev = prevContainerWidthRef.current;
    if (prev !== containerWidth) {
      prevContainerWidthRef.current = containerWidth;
      if (containerWidth > 0) {
        setVisibleCount(null);
      }
    }
  }, [containerWidth]);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node || count === 0) {
      setVisibleCount(count);
      return;
    }
    if (containerWidth === 0) {
      setVisibleCount(count);
      return;
    }
    if (visibleCount !== null) return;

    const measureRow = node.querySelector<HTMLElement>(
      '[data-responsive-filter-row-measure="true"]'
    );
    if (!measureRow) return;

    const slotWrappers = measureRow.querySelectorAll<HTMLElement>(
      '[data-responsive-filter-slot="true"]'
    );
    const trailingReserve = reservedWidthForTrailing ?? 0;
    const availableWidth =
      containerWidth -
      TRAILING_GROUP_OFFSET_PX -
      (count > 1 ? OVERFLOW_BUTTON_RESERVE_PX : 0) -
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

    // Don't trust fitCount 0 when we have slots and space (avoids stuck "filters disappear" from bad measurement)
    if (
      fitCount === 0 &&
      count > 0 &&
      (availableWidth > MIN_AVAILABLE_WIDTH_TO_TRUST_ZERO ||
        (slotWrappers.length > 0 && slotWrappers[0].offsetWidth === 0))
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

  const overflowActiveCount =
    slotActiveCounts && slotActiveCounts.length === count
      ? slotActiveCounts
          .slice(finalVisible)
          .reduce((sum, n) => sum + (typeof n === 'number' ? n : 0), 0)
      : 0;
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

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex min-w-0 flex-1 items-center justify-start',
        className
      )}
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
          {slotContents.map((content, i) => (
            <div
              key={slots[i].key}
              data-responsive-filter-slot="true"
              className="shrink-0"
            >
              {content}
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
                {entry.content}
              </div>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {hasOverflow && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-10 min-w-[100px] shrink-0 justify-start gap-1.5 font-normal',
                      overflowTriggerActive
                        ? 'border-primary bg-primary text-primary-foreground hover:opacity-90'
                        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
                      overflowTriggerClassName
                    )}
                    aria-label={
                      finalVisible === 0
                        ? `${triggerLabel}; ${overflowSlotEntries.length} filters`
                        : `${triggerLabel}; ${overflowSlotEntries.length} more filters`
                    }
                  >
                    <SlidersHorizontal className="h-4 w-4 shrink-0 opacity-70" />
                    <span>{triggerLabelWithCount}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="flex max-h-[min(80vh,400px)] w-[380px] flex-col overflow-hidden p-0"
                >
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <Accordion type="multiple" className="w-full">
                      {overflowSlotEntries.map((entry) => (
                        <AccordionItem
                          key={entry.key}
                          value={entry.key}
                          className="border-b last:border-b-0"
                        >
                          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline [&[data-state=open]>svg]:rotate-180">
                            {entry.label}
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pt-0 pb-3">
                            {entry.content}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </PopoverContent>
              </Popover>
            )}
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
