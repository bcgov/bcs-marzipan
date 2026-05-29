import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import { useElementWidth } from '@/hooks/useElementWidth';
import { cn } from '@/lib/utils';

import { Badge, type BadgeProps } from './badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

export interface BadgeGroupItem {
  key: string | number;
  label: string;
  variant?: BadgeProps['variant'];
  className?: string;
  style?: CSSProperties;
}

export interface BadgeGroupProps {
  /** Items to render as badges in row-capped layout. */
  items: BadgeGroupItem[];
  /** Maximum number of wrapped badge rows visible before overflow is collapsed. */
  maxLines: number;
  /** Approximate row height in pixels used for cap measurement. */
  lineHeight?: number;
  /** Default badge variant when an item does not provide one. */
  badgeVariant?: BadgeProps['variant'];
  /** Default badge className when an item does not provide one. */
  badgeClassName?: string;
  /** Class name for the badge container. */
  containerClassName?: string;
  /** Class name for the overflow (+N) badge itself. */
  overflowBadgeClassName?: string;
  /** Override variant for the overflow (+N) badge. If not set, derived from the first visible/item variant so it matches the grouped badges. */
  overflowBadgeVariant?: BadgeProps['variant'];
  /** Optional explicit visible item count override (primarily for deterministic testing). */
  visibleCountOverride?: number;
}

/**
 * BadgeGroup renders badges within a fixed number of wrapped rows and collapses
 * overflow into a "+N" badge. The overflow trigger is keyboard-focusable so
 * hidden badges remain reachable without a mouse.
 */
export function BadgeGroup({
  items,
  maxLines,
  lineHeight = 24,
  badgeVariant = 'outline',
  badgeClassName,
  containerClassName,
  overflowBadgeClassName,
  overflowBadgeVariant: overflowBadgeVariantProp,
  visibleCountOverride,
}: BadgeGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useElementWidth(containerRef);
  const prevContainerWidthRef = useRef(0);
  const prevContentSignatureRef = useRef<string>(null);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);

  const finalVisibleCount =
    visibleCountOverride != null
      ? Math.max(0, Math.min(visibleCountOverride, items.length))
      : visibleCount == null
        ? items.length
        : Math.min(visibleCount, items.length);
  const visibleItems = useMemo(
    () => items.slice(0, finalVisibleCount),
    [items, finalVisibleCount]
  );
  const overflowItems = useMemo(
    () => items.slice(finalVisibleCount),
    [items, finalVisibleCount]
  );
  const overflowCount = overflowItems.length;

  // Derive overflow badge appearance from the grouped badges so "+N" matches their color.
  const overflowBadgeVariant: BadgeProps['variant'] =
    overflowBadgeVariantProp ??
    visibleItems[0]?.variant ??
    items[0]?.variant ??
    badgeVariant;
  const overflowBadgeItemClassName =
    visibleItems[0]?.className ?? items[0]?.className ?? badgeClassName;

  // Reset visible count only when content (length + keys) or line cap actually change, not on new array reference.
  const contentSignature = `${items.length}:${items.map((i) => i.key).join(',')}`;
  const layoutSignature = `${contentSignature}:${maxLines}:${lineHeight}`;
  useEffect(() => {
    if (visibleCountOverride != null) return;
    const signatureChanged =
      prevContentSignatureRef.current !== layoutSignature;
    prevContentSignatureRef.current = layoutSignature;

    if (signatureChanged) {
      setVisibleCount(null);
    }
  }, [layoutSignature, visibleCountOverride]);

  // Re-measure when container is resized. Do NOT reset on 0 -> non-zero: useLayoutEffect runs
  // first and sets visibleCount; this effect runs after and would clear it, leaving us stuck in measuring state.
  useEffect(() => {
    if (visibleCountOverride != null) return;
    const prev = prevContainerWidthRef.current;
    if (prev !== containerWidth) {
      prevContainerWidthRef.current = containerWidth;
      if (prev > 0 && containerWidth > 0) {
        setVisibleCount(null);
      }
    }
  }, [containerWidth, visibleCountOverride]);

  useLayoutEffect(() => {
    if (visibleCountOverride != null) return;
    const node = containerRef.current;
    if (!node) return;
    if (containerWidth === 0) return;

    if (visibleCount == null) {
      const badgeNodes = Array.from(
        node.querySelectorAll<HTMLElement>('[data-badge-item="true"]')
      );
      const rowTops: number[] = [];
      let fitCount = 0;

      for (const badgeNode of badgeNodes) {
        const badgeTop = badgeNode.offsetTop;
        const hasRow = rowTops.some(
          (rowTop) => Math.abs(rowTop - badgeTop) <= 1
        );
        if (!hasRow) rowTops.push(badgeTop);
        if (rowTops.length > maxLines) break;
        fitCount += 1;
      }

      // Reserve one slot for the +N trigger when overflow exists.
      const nextVisibleCount =
        fitCount < items.length ? Math.max(0, fitCount - 1) : fitCount;
      setVisibleCount(nextVisibleCount);
      return;
    }

    if (overflowCount > 0 && visibleCount > 0) {
      const measureNodes = Array.from(
        node.querySelectorAll<HTMLElement>('[data-badge-group-measure="true"]')
      );
      const rowTops: number[] = [];
      for (const measureNode of measureNodes) {
        const top = measureNode.offsetTop;
        if (!rowTops.some((rowTop) => Math.abs(rowTop - top) <= 1)) {
          rowTops.push(top);
        }
      }
      if (rowTops.length > maxLines) {
        setVisibleCount((current) =>
          current == null ? 0 : Math.max(current - 1, 0)
        );
      }
    }
  }, [
    visibleCount,
    overflowCount,
    maxLines,
    items.length,
    containerWidth,
    visibleCountOverride,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn('flex flex-wrap items-center gap-1', containerClassName)}
      style={
        visibleCount == null && visibleCountOverride == null
          ? { maxHeight: maxLines * lineHeight, overflow: 'hidden' }
          : undefined
      }
    >
      {visibleItems.map((item) => (
        <Badge
          key={item.key}
          data-badge-item="true"
          data-badge-group-measure="true"
          variant={item.variant ?? badgeVariant}
          className={cn(badgeClassName, item.className)}
          style={item.style}
        >
          {item.label}
        </Badge>
      ))}

      {overflowCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                data-no-row-nav
                aria-label={`Show ${overflowCount} more badges`}
                data-badge-group-measure="true"
                className="focus-visible:ring-ring shrink-0 cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Badge
                  variant={overflowBadgeVariant}
                  className={cn(
                    'h-auto min-h-5 text-xs',
                    overflowBadgeItemClassName,
                    overflowBadgeClassName
                  )}
                >
                  +{overflowCount}
                </Badge>
              </button>
            </TooltipTrigger>
            <TooltipContent
              data-no-row-nav
              side="top"
              align="start"
              variant="light"
              className="max-w-xs text-sm text-slate-600"
            >
              <ul className="list-inside list-none space-y-0.5 text-left">
                {overflowItems.map((item) => (
                  <li key={item.key}>{item.label}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
