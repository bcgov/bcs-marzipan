import { useState } from 'react';

import { ExpandableText } from '@/components/shared';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

import type { HistoryChangeViewModel } from './history-types';

type HistoryChangeListProps = {
  changes: HistoryChangeViewModel[];
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
  expanded = false,
  onExpandedChange,
  mode = 'disclosure',
  previewLimit = 5,
  className,
}: HistoryChangeListProps) {
  const [previewExpanded, setPreviewExpanded] = useState(false);
  if (changes.length === 0) return null;

  const countLabel = `${changes.length} change${changes.length === 1 ? '' : 's'}`;

  if (mode === 'preview') {
    const hasHidden = changes.length > previewLimit;
    const visibleChanges = previewExpanded
      ? changes
      : changes.slice(0, previewLimit);

    return (
      <div className={cn('space-y-2', className)}>
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
    <Accordion
      type="single"
      collapsible
      value={expanded ? 'changes' : ''}
      onValueChange={(value) => onExpandedChange?.(value === 'changes')}
      className={className}
    >
      <AccordionItem value="changes" className="border-none">
        <AccordionTrigger className="text-primary data-[state=open]:text-primary py-1 text-sm font-medium hover:no-underline">
          {countLabel}
        </AccordionTrigger>
        <AccordionContent className="pb-1">
          <ChangeRows changes={changes} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
