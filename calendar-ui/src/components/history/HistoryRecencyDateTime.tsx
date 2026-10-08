import type { ReactNode } from 'react';

import { formatPacificRecencyDateTime } from '@/lib/datetime-utils';
import { cn } from '@/lib/utils';

type HistoryRecencyDateTimeProps = {
  timestamp: string;
  className?: string;
  now?: Date;
  invalidFallback?: ReactNode;
};

export function HistoryRecencyDateTime({
  timestamp,
  className,
  now,
  invalidFallback = null,
}: HistoryRecencyDateTimeProps) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return invalidFallback;
  }

  const { dateLine, timeLine } = formatPacificRecencyDateTime(date, now);

  return (
    <time
      dateTime={timestamp}
      className={cn('block min-w-[7rem] text-sm leading-snug', className)}
    >
      <span className="text-foreground block whitespace-nowrap">
        {dateLine}
      </span>
      {timeLine ? (
        <span className="text-muted-foreground block whitespace-nowrap">
          {timeLine}
        </span>
      ) : null}
    </time>
  );
}
