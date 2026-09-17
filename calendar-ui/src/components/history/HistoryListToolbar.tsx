import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { HISTORY_LIST_HORIZONTAL_PADDING_CLASSNAME } from './history-list-layout';

type HistoryListToolbarProps = {
  summary: ReactNode;
  expandAll?: ReactNode;
  className?: string;
};

export function HistoryListToolbar({
  summary,
  expandAll,
  className,
}: HistoryListToolbarProps) {
  return (
    <div
      className={cn(
        'flex min-h-9 items-center justify-between gap-4',
        HISTORY_LIST_HORIZONTAL_PADDING_CLASSNAME,
        className
      )}
    >
      <div className="min-w-0 flex-1">{summary}</div>
      {expandAll ? <div className="shrink-0">{expandAll}</div> : null}
    </div>
  );
}
