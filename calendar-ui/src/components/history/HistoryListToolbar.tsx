import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type HistoryListToolbarProps = {
  summary: ReactNode;
  className?: string;
};

export function HistoryListToolbar({
  summary,
  className,
}: HistoryListToolbarProps) {
  return <div className={cn('min-w-0 space-y-1', className)}>{summary}</div>;
}
