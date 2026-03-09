import { ChevronDown } from 'lucide-react';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const SLOT_GAP_PX = 8;
const OVERFLOW_BUTTON_RESERVE_PX = 110;
const TRAILING_GROUP_OFFSET_PX = 32;

export interface ResponsiveFilterRowProps {
  /** Ordered list of filter components (or any React nodes) to show in the row. */
  children: ReactNode[];
  /** Label for the overflow trigger when some filters are hidden. Default "All filters". */
  overflowTriggerLabel?: string;
  /** Class name for the overflow trigger button (e.g. h-10 for alignment). */
  overflowTriggerClassName?: string;
  /** Optional content rendered after "All filters" (e.g. Clear filters button). Keeps a consistent gap from the last visible filter and from "All filters". */
  trailingContent?: ReactNode;
  /** Width in px to reserve for trailing content when measuring. When set, a spacer is rendered when trailingContent is null so layout stays stable. */
  reservedWidthForTrailing?: number;
  /** Class name for the row container. */
  className?: string;
  /** Class name for the inner flex container that holds visible slots. */
  containerClassName?: string;
}

/**
 * Renders as many children as fit in one row; the rest are moved into an
 * "All filters" dropdown. Uses ResizeObserver and layout measurement to
 * compute how many slots fit. Reusable for any list of filter-like components.
 */
export function ResponsiveFilterRow({
  children,
  overflowTriggerLabel = 'All filters',
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

  const count = children.length;
  const slots = count === 0 ? [] : children;

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
      if (prev > 0 && containerWidth > 0) {
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

    setVisibleCount(Math.max(0, fitCount));
  }, [visibleCount, containerWidth, count, reservedWidthForTrailing]);

  const finalVisible =
    visibleCount == null ? count : Math.min(Math.max(0, visibleCount), count);
  const visibleSlots = slots.slice(0, finalVisible);
  const overflowSlots = slots.slice(finalVisible);
  const hasOverflow = overflowSlots.length > 0;

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
          {slots.map((child, i) => (
            <div
              key={i}
              data-responsive-filter-slot="true"
              className="shrink-0"
            >
              {child}
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
            {visibleSlots.map((child, i) => (
              <div key={i} className="shrink-0">
                {child}
              </div>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {hasOverflow && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      'border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 min-w-[100px] shrink-0 justify-between gap-1 font-normal',
                      overflowTriggerClassName
                    )}
                    aria-label={`${overflowTriggerLabel}; ${overflowSlots.length} more filters`}
                  >
                    <span>{overflowTriggerLabel}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="max-h-[min(80vh,400px)] min-w-[200px] overflow-y-auto p-2"
                >
                  <div className="flex flex-col gap-2">
                    {overflowSlots.map((child, i) => (
                      <div key={i} className="shrink-0">
                        {child}
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
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
