import type { ReactNode } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type HistoryDetailBadgeProps = {
  children: ReactNode;
  expanded?: boolean;
};

function HistoryDetailBadge({ children, expanded }: HistoryDetailBadgeProps) {
  return (
    <span
      className={cn(
        buttonVariants({ variant: 'default', size: 'xs' }),
        'rounded-full px-2.5',
        'group-hover/trigger:bg-primary/90',
        expanded && 'bg-primary/90'
      )}
    >
      {children}
    </span>
  );
}

type HistoryDetailsTriggerProps = {
  changeCount: number;
  hasNote: boolean;
  expanded?: boolean;
};

export function HistoryDetailsTrigger({
  changeCount,
  hasNote,
  expanded = false,
}: HistoryDetailsTriggerProps) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {changeCount > 0 ? (
        <HistoryDetailBadge expanded={expanded}>
          {changeCount} change{changeCount === 1 ? '' : 's'}
        </HistoryDetailBadge>
      ) : null}
      {hasNote ? (
        <HistoryDetailBadge expanded={expanded}>Note</HistoryDetailBadge>
      ) : null}
    </span>
  );
}
