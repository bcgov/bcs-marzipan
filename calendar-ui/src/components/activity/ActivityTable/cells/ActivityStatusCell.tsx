import { Badge, getActivityStatusBadgeVariant } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { ActivityTableRow } from '../activityTableRow';
import { LookAheadStatusBadge } from './LookAheadStatusBadge';

export interface ActivityStatusCellProps {
  row: ActivityTableRow;
  /** Inline places both badges on one wrapped row; stacked puts LA underneath. */
  orientation?: 'inline' | 'stacked';
  className?: string;
}

/** Activity status badge followed by the look-ahead section/status badge. */
export function ActivityStatusCell({
  row,
  orientation = 'inline',
  className,
}: ActivityStatusCellProps) {
  return (
    <div
      className={cn(
        'flex gap-1',
        orientation === 'stacked'
          ? 'flex-col items-start'
          : 'flex-nowrap items-center',
        className
      )}
    >
      <Badge variant={getActivityStatusBadgeVariant(row.activityStatus)}>
        {row.activityStatus}
      </Badge>
      <LookAheadStatusBadge
        status={row.lookAheadStatus}
        section={row.lookAheadSection}
      />
    </div>
  );
}
