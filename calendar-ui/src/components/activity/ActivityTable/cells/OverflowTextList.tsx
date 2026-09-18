import { useEffect, useRef, useState } from 'react';

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
  const contentRef = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);

  const itemsSignature = items.join('\u0000');

  useEffect(() => {
    setVisibleCount(items.length);
  }, [itemsSignature, maxLines, items.length]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || visibleCount <= 1) return;
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 16;
    const maxHeight = lineHeight * maxLines + 1;
    if (el.scrollHeight > maxHeight) {
      setVisibleCount((current) => Math.max(1, current - 1));
    }
  }, [visibleCount, maxLines, itemsSignature]);

  if (items.length === 0) return null;

  const visibleItems = items.slice(0, visibleCount);
  const hiddenItems = items.slice(visibleCount);

  return (
    <span className={cn('inline', className)}>
      <span ref={contentRef} className="inline">
        {visibleItems.join(separator)}
      </span>
      {hiddenItems.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              data-no-row-nav
              onClick={(e) => e.stopPropagation()}
              aria-label={`Show ${hiddenItems.length} more`}
              className="focus-visible:ring-ring ml-1 cursor-pointer border-0 bg-transparent p-0 text-inherit underline decoration-dotted underline-offset-2 focus-visible:ring-2 focus-visible:outline-none"
            >
              +{hiddenItems.length}
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
