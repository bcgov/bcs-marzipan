import { cn } from '@/lib/utils';

import type { ActivityTableRow } from '../activityTableRow';

export interface LeadContactLineProps {
  row: ActivityTableRow;
  className?: string;
}

/** Comms contact in the status column: owner label and truncated person name. */
export function LeadContactLine({ row, className }: LeadContactLineProps) {
  const name = row.commsContactName;
  if (!name) return null;

  return (
    <div
      className={cn(
        'text-foreground flex min-w-0 overflow-hidden text-xs',
        className
      )}
      title={`Owner: ${name}`}
    >
      <span className="flex min-w-0 flex-1 items-baseline gap-x-1 overflow-hidden">
        <span className="shrink-0 whitespace-nowrap">Owner:</span>
        <span className="min-w-0 truncate" title={name}>
          {name}
        </span>
      </span>
    </div>
  );
}
