import { User } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { ActivityTableRow } from '../activityTableRow';
import { ACTIVITY_GRID_ROW_ICON_TOP_CLASS } from './activityGridRowIcons';

export interface LeadContactLineProps {
  row: ActivityTableRow;
  /** When plain, omit the user icon (name only). */
  variant?: 'labelled' | 'plain';
  className?: string;
}

/**
 * Comms contact in the Comms column: user icon and truncated person name.
 */
export function LeadContactLine({
  row,
  variant = 'labelled',
  className,
}: LeadContactLineProps) {
  const name = row.commsContactName;
  if (!name) return null;

  const nameEl = (
    <span className="min-w-0 truncate font-medium text-slate-900" title={name}>
      {name}
    </span>
  );

  if (variant === 'plain') {
    return <div className={cn('min-w-0', className)}>{nameEl}</div>;
  }

  return (
    <div className={cn('flex min-w-0 items-start gap-1.5', className)}>
      <User className={ACTIVITY_GRID_ROW_ICON_TOP_CLASS} aria-hidden />
      <div className="min-w-0 flex-1">{nameEl}</div>
    </div>
  );
}
