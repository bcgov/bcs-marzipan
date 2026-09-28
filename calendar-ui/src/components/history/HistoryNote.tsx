import { useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { HistoryNoteIcon, HistoryNoteLeading } from './HistoryNoteIcon';

type HistoryNoteProps = {
  text: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
};

export function HistoryNote({
  text,
  expanded,
  onExpandedChange,
}: HistoryNoteProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [collapsible, setCollapsible] = useState(false);

  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const measure = () => {
      if (expanded) return;
      const next = element.scrollWidth > element.clientWidth + 1;
      setCollapsible(next);
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded, text]);

  return (
    <div
      className={cn(
        'text-foreground flex min-w-0 gap-1.5 text-[13px] leading-4.5',
        expanded ? 'items-start' : 'items-center'
      )}
    >
      {expanded ? <HistoryNoteLeading /> : <HistoryNoteIcon />}
      <div
        className={cn(
          'min-w-0 flex-1',
          !expanded && 'flex items-baseline gap-1'
        )}
      >
        <span
          ref={textRef}
          className={cn(
            'min-w-0',
            expanded ? 'block whitespace-pre-wrap' : 'flex-1 truncate'
          )}
        >
          {text}
        </span>
        {collapsible && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => onExpandedChange(!expanded)}
            className={cn(
              'text-primary cursor-pointer font-medium hover:underline',
              expanded ? 'mt-0.5 block' : 'shrink-0'
            )}
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </div>
  );
}
