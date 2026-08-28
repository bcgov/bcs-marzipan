import { useState } from 'react';

import { ExpandableText } from '@/components/shared';
import { cn } from '@/lib/utils';

import { historyDetailsHasDisclosure } from './history-details-label';
import type { HistoryChangeViewModel } from './history-types';
import { HistoryDetailsDisclosure } from './HistoryDetailsDisclosure';

type HistoryChangeListProps = {
  changes: HistoryChangeViewModel[];
  note?: string | null;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  mode?: 'disclosure' | 'preview';
  previewLimit?: number;
  className?: string;
};

function ChangeRows({ changes }: { changes: HistoryChangeViewModel[] }) {
  return (
    <div className="space-y-1">
      {changes.map((change) =>
        change.kind === 'message' ? (
          <div key={change.key} className="text-foreground text-sm leading-5">
            {change.message}
          </div>
        ) : (
          <div key={change.key} className="text-foreground text-sm leading-5">
            <span className="font-medium">{change.label}:</span>{' '}
            <span className="text-muted-foreground">
              <ExpandableText text={change.oldValue} />
            </span>{' '}
            <span aria-hidden>→</span>{' '}
            <span>
              <ExpandableText text={change.newValue} />
            </span>
          </div>
        )
      )}
    </div>
  );
}

export function HistoryChangeList({
  changes,
  note,
  expanded = false,
  onExpandedChange,
  mode = 'disclosure',
  previewLimit = 5,
  className,
}: HistoryChangeListProps) {
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const hasNote = Boolean(note?.trim());
  const hasDisclosure = historyDetailsHasDisclosure(changes.length, hasNote);

  if (!hasDisclosure) return null;

  if (mode === 'preview') {
    const hasHidden = changes.length > previewLimit;
    const visibleChanges = previewExpanded
      ? changes
      : changes.slice(0, previewLimit);

    return (
      <div className={cn('space-y-2', className)}>
        {hasNote ? (
          <div className="text-foreground text-sm leading-5 whitespace-pre-wrap">
            {note}
          </div>
        ) : null}
        <ChangeRows changes={visibleChanges} />
        {hasHidden && (
          <button
            type="button"
            aria-expanded={previewExpanded}
            onClick={() => setPreviewExpanded((value) => !value)}
            className="text-primary cursor-pointer text-sm font-medium hover:underline"
          >
            {previewExpanded
              ? 'Show less'
              : `Show ${changes.length - previewLimit} more change${
                  changes.length - previewLimit === 1 ? '' : 's'
                }`}
          </button>
        )}
      </div>
    );
  }

  return (
    <HistoryDetailsDisclosure
      changeCount={changes.length}
      hasNote={hasNote}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      className={className}
    >
      {hasNote ? (
        <div className="text-foreground text-sm leading-5 whitespace-pre-wrap">
          {note}
        </div>
      ) : null}
      {changes.length > 0 ? <ChangeRows changes={changes} /> : null}
    </HistoryDetailsDisclosure>
  );
}
