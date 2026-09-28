import { useState } from 'react';

import { InlineTextDiff } from '@/components/ui/InlineTextDiff';
import { isNarrativeDiffField } from '@/lib/narrative-diff-fields';
import {
  buildTextDiffAriaLabel,
  buildTextDiffSegments,
  isEmptyDisplayValue,
} from '@/lib/text-diff';
import { cn } from '@/lib/utils';

const PREVIEW_CHARS = 48;

type HistoryTransitionChangeProps = {
  field: string;
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

function NarrativeDiffContent({
  label,
  oldValue,
  newValue,
}: {
  label: string;
  oldValue: string;
  newValue: string;
}) {
  const segments = buildTextDiffSegments(oldValue, newValue);
  const showOldSide = !isEmptyDisplayValue(oldValue);
  const showNewSide = !isEmptyDisplayValue(newValue);

  return (
    <span
      aria-label={buildTextDiffAriaLabel(label, segments)}
      className="wrap-anywhere whitespace-pre-wrap"
    >
      {showOldSide ? (
        <>
          <InlineTextDiff
            oldValue={oldValue}
            newValue={newValue}
            mode="words"
            side="old"
          />
          {showNewSide ? (
            <>
              {' '}
              <span aria-hidden>→</span>{' '}
            </>
          ) : null}
        </>
      ) : null}
      {showNewSide ? (
        <InlineTextDiff
          oldValue={oldValue}
          newValue={newValue}
          mode="words"
          side="new"
        />
      ) : null}
    </span>
  );
}

export function HistoryTransitionChange({
  field,
  label,
  oldValue,
  newValue,
}: HistoryTransitionChangeProps) {
  const [expanded, setExpanded] = useState(false);
  const needsExpand = transitionNeedsExpand(oldValue, newValue);
  const showFullText = expanded || !needsExpand;
  const useDiff = isNarrativeDiffField(field) && showFullText;

  const toggleLabel = expanded
    ? `Show less ${label} change`
    : `Show more ${label} change`;

  const displayOld = showFullText ? oldValue : previewPart(oldValue);
  const displayNew = showFullText ? newValue : previewPart(newValue);

  return (
    <div className="text-foreground min-w-0 text-[13px] leading-[18px]">
      <span className="font-semibold">{label}:</span>{' '}
      {useDiff ? (
        <NarrativeDiffContent
          label={label}
          oldValue={oldValue}
          newValue={newValue}
        />
      ) : (
        <span
          className={cn('wrap-anywhere', showFullText && 'whitespace-pre-wrap')}
        >
          <span className="text-muted-foreground">{displayOld}</span>{' '}
          <span aria-hidden>→</span> <span>{displayNew}</span>
        </span>
      )}
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
    </div>
  );
}
