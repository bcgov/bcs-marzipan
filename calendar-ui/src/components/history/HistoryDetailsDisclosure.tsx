import { useId, type ReactNode } from 'react';

import {
  historyDetailsBadgeLabel,
  historyDetailsHideLabel,
  historyDetailsShowLabel,
} from './history-details-label';
import { HistoryBadgeTrigger } from './HistoryBadgeTrigger';

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
  const badgeLabel = historyDetailsBadgeLabel(changeCount, hasNote);
  const triggerLabel = expanded
    ? historyDetailsHideLabel(changeCount, hasNote)
    : historyDetailsShowLabel(changeCount, hasNote);

  return (
    <div className={className}>
      {expanded ? (
        <>
          <div
            id={panelId}
            role="region"
            aria-label={badgeLabel}
            className="space-y-2 pt-1 pb-1"
          >
            {children}
          </div>
          <HistoryBadgeTrigger
            label={triggerLabel}
            expanded={expanded}
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => onExpandedChange?.(!expanded)}
          />
        </>
      ) : (
        <HistoryBadgeTrigger
          label={triggerLabel}
          expanded={expanded}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => onExpandedChange?.(!expanded)}
        />
      )}
    </div>
  );
}
