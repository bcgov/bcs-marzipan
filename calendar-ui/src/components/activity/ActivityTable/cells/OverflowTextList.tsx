import { useLayoutEffect, useRef, useState } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface OverflowTextListProps {
  items: string[];
  /** Wrapped lines shown before the remainder collapses into "+N". */
  maxLines: number;
  /** Separator between visible items. */
  separator?: string;
  className?: string;
}

function lineClampClass(maxLines: number): string | undefined {
  if (maxLines === 1) return 'line-clamp-1';
  if (maxLines === 2) return 'line-clamp-2';
  if (maxLines === 3) return 'line-clamp-3';
  return undefined;
}

/**
 * Comma-separated text capped to a number of wrapped lines, with the remainder
 * collapsed into a plain "+N" affordance (not a badge) that reveals the full
 * list on hover or focus.
 */
export function OverflowTextList({
  items,
  maxLines,
  separator = ', ',
  className,
}: OverflowTextListProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [clampLines, setClampLines] = useState(false);

  const itemsSignature = items.join('\u0000');

  useLayoutEffect(() => {
    setVisibleCount(items.length);
    setClampLines(false);
  }, [itemsSignature, maxLines, items.length]);

  useLayoutEffect(() => {
    const contentEl = contentRef.current;
    const containerEl = containerRef.current;
    if (!contentEl || items.length === 0) return;

    const lineHeight = parseFloat(getComputedStyle(contentEl).lineHeight) || 16;
    const maxHeight = lineHeight * maxLines + 1;
    const hiddenCount = items.length - visibleCount;

    const overflows =
      hiddenCount > 0 && containerEl
        ? containerEl.scrollHeight > maxHeight
        : contentEl.scrollHeight > maxHeight;

    if (overflows) {
      if (visibleCount > 1) {
        setVisibleCount((current) => Math.max(1, current - 1));
        setClampLines(false);
      } else {
        setClampLines(true);
      }
    } else {
      setClampLines(false);
    }
  }, [visibleCount, maxLines, itemsSignature, items.length]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      setVisibleCount(items.length);
      setClampLines(false);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length, itemsSignature]);

  if (items.length === 0) return null;

  const visibleItems = items.slice(0, visibleCount);
  const hiddenItems = items.slice(visibleCount);
  const clampClass = clampLines ? lineClampClass(maxLines) : undefined;
  const showOverflowAffordance = hiddenItems.length > 0;

  return (
    <span
      ref={containerRef}
      className={cn('inline-block max-w-full min-w-0', className)}
    >
      <span
        ref={contentRef}
        className={cn(
          'break-words text-inherit',
          showOverflowAffordance || clampClass
            ? 'inline'
            : 'inline-block max-w-full align-baseline',
          clampClass
        )}
      >
        {visibleItems.join(separator)}
      </span>
      {showOverflowAffordance && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              data-no-row-nav
              onClick={(e) => e.stopPropagation()}
              aria-label={`Show ${hiddenItems.length} more`}
              className="focus-visible:ring-ring inline cursor-pointer border-0 bg-transparent p-0 whitespace-nowrap text-inherit focus-visible:ring-2 focus-visible:outline-none"
            >
              {separator}+{hiddenItems.length}
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
              {hiddenItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}
