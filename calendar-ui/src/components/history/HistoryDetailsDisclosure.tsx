import { useId, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { historyDetailsAriaLabel } from './history-details-label';
import { HistoryDetailsTrigger } from './HistoryDetailsTrigger';

type HistoryDetailsDisclosureProps = {
  changeCount: number;
  hasNote: boolean;
  expanded: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  children: ReactNode;
  className?: string;
};

export function HistoryDetailsDisclosure({
  changeCount,
  hasNote,
  expanded,
  onExpandedChange,
  children,
  className,
}: HistoryDetailsDisclosureProps) {
  const panelId = useId();
  const panelLabel = historyDetailsAriaLabel(changeCount, hasNote);

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-label={panelLabel}
        onClick={() => onExpandedChange?.(!expanded)}
        className="group/trigger focus-visible:ring-ring/50 inline-flex w-fit max-w-full cursor-pointer rounded-md border-0 bg-transparent p-0 py-1 outline-none focus-visible:ring-[3px]"
      >
        <HistoryDetailsTrigger
          changeCount={changeCount}
          hasNote={hasNote}
          expanded={expanded}
        />
      </button>

      <div
        id={panelId}
        role="region"
        aria-label={panelLabel}
        aria-hidden={!expanded}
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="min-h-0 overflow-hidden" inert={!expanded || undefined}>
          <div className="space-y-2 pt-1 pb-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
