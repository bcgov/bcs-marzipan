import { useState } from 'react';

import { cn } from '@/lib/utils';

const PREVIEW_CHARS = 48;

type HistoryTransitionChangeProps = {
  label: string;
  oldValue: string;
  newValue: string;
};

function previewPart(value: string): string {
  if (value.length <= PREVIEW_CHARS) return value;
  return `${value.slice(0, PREVIEW_CHARS)}…`;
}

function transitionNeedsExpand(oldValue: string, newValue: string): boolean {
  return oldValue.length > PREVIEW_CHARS || newValue.length > PREVIEW_CHARS;
}

export function HistoryTransitionChange({
  label,
  oldValue,
  newValue,
}: HistoryTransitionChangeProps) {
  const [expanded, setExpanded] = useState(false);
  const needsExpand = transitionNeedsExpand(oldValue, newValue);

  const toggleLabel = expanded
    ? `Show less ${label} change`
    : `Show more ${label} change`;

  const displayOld = expanded ? oldValue : previewPart(oldValue);
  const displayNew = expanded ? newValue : previewPart(newValue);

  return (
    <div className="text-foreground min-w-0 text-[13px] leading-[18px]">
      <span className="font-semibold">{label}:</span>{' '}
      <span className={cn('wrap-anywhere', expanded && 'whitespace-pre-wrap')}>
        <span className="text-muted-foreground">{displayOld}</span>{' '}
        <span aria-hidden>→</span> <span>{displayNew}</span>
        {needsExpand ? (
          <>
            {' '}
            <button
              type="button"
              aria-expanded={expanded}
              aria-label={toggleLabel}
              onClick={(event) => {
                event.stopPropagation();
                setExpanded((value) => !value);
              }}
              className="text-primary shrink-0 cursor-pointer font-medium hover:underline"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          </>
        ) : null}
      </span>
    </div>
  );
}
