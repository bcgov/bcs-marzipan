import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

import type { ActivityTableRow } from '../activityTableRow';
import { getInitialsFromName } from '../activityTableRowDisplay';

export interface LeadContactLineProps {
  row: ActivityTableRow;
  /** Prefix the line with "Lead: " and show the avatar (Grid A status column). */
  variant?: 'labelled' | 'plain';
  className?: string;
}

/**
 * Lead comms contact, rendered as "Lead: JS Jane Smith HLTH Comms" in Grid A
 * and "Jane Smith HLTH Comms" when rendered without the lead prefix.
 */
export function LeadContactLine({
  row,
  variant = 'labelled',
  className,
}: LeadContactLineProps) {
  if (!row.commsLeadName) return null;

  const teamLabel = row.leadTeamDisplayName;
  const additionalComms = row.commsContactsCount - 1;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-1 gap-y-0 text-xs text-slate-600',
        className
      )}
    >
      {variant === 'labelled' && (
        <>
          <span className="text-slate-500">Lead:</span>
          <Avatar className="size-[18px]" title={row.commsLeadName}>
            <AvatarFallback className="text-[10px] leading-none">
              {getInitialsFromName(row.commsLeadName)}
            </AvatarFallback>
          </Avatar>
        </>
      )}
      <span className="font-medium text-slate-900">{row.commsLeadName}</span>
      {teamLabel && <span>{teamLabel}</span>}
      {additionalComms > 0 && <span>+{additionalComms}</span>}
    </div>
  );
}
