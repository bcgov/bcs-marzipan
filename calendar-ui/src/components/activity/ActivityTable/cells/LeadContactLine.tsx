import { User } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { ActivityTableRow } from '../activityTableRow';
import { ACTIVITY_GRID_ROW_ICON_TOP_CLASS } from './activityGridRowIcons';

export interface LeadContactLineProps {
  row: ActivityTableRow;
  /** Prefix the line with "Lead: " (Comms column). */
  variant?: 'labelled' | 'plain';
  className?: string;
}

/**
 * Lead comms contact: user icon and "Lead: …" in the Comms column, or name only
 * when plain.
 */
export function LeadContactLine({
  row,
  variant = 'labelled',
  className,
}: LeadContactLineProps) {
  if (!row.commsLeadName) return null;

  const teamLabel = row.leadTeamDisplayName;
  const additionalComms = row.commsContactsCount - 1;

  const textBlock = (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-0 text-xs text-slate-600">
      {variant === 'labelled' && (
        <span className="shrink-0 text-slate-500">Lead:</span>
      )}
      <span className="font-medium text-slate-900">{row.commsLeadName}</span>
      {teamLabel && <span>{teamLabel}</span>}
      {additionalComms > 0 && <span>+{additionalComms}</span>}
    </div>
  );

  if (variant === 'plain') {
    return (
      <div
        className={cn('flex flex-wrap items-center gap-x-1 gap-y-0', className)}
      >
        {textBlock}
      </div>
    );
  }

  return (
    <div className={cn('flex items-start gap-1.5', className)}>
      <User className={ACTIVITY_GRID_ROW_ICON_TOP_CLASS} aria-hidden />
      {textBlock}
    </div>
  );
}
