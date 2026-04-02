import type { ActivityResponse } from '@corpcal/shared/api/types';
import { cn } from '@/lib/utils';

import { ReportRow } from './ReportRow';

/** Sticky within the report section scroll area; opaque bg so rows don’t show through. */
const headerCell =
  'bg-muted/95 text-foreground sticky top-0 z-10 border-b px-4 py-3 text-left text-sm font-semibold shadow-[0_1px_0_0_hsl(var(--border))] backdrop-blur-sm';

interface ReportTableProps {
  activities: ActivityResponse[];
  className?: string;
}

/**
 * Simple, flat table for Reports page.
 * Displays activities without date grouping.
 * Each activity is rendered as a rich row with 4 columns.
 *
 * Column structure:
 * 1. Date/Meta Info (date, time, premier requested, tags)
 * 2. Ministry Info (lead ministry, lead org)
 * 3. Main Activity Content (title, summary, categories)
 * 4. Additional Info (comms contact, status, look-ahead status)
 */
export function ReportTable({ activities, className }: ReportTableProps) {
  return (
    <div
      className={cn(
        'border-border overflow-x-auto rounded-md border',
        className
      )}
    >
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="border-border border-b">
            <th scope="col" className={cn(headerCell, 'w-1/6')}>
              Date & Time
            </th>
            <th scope="col" className={cn(headerCell, 'w-1/6')}>
              Lead
            </th>
            <th scope="col" className={cn(headerCell, 'w-1/2')}>
              Activity Details
            </th>
            <th scope="col" className={cn(headerCell, 'w-1/6')}>
              Release
            </th>
            <th scope="col" className={cn(headerCell, 'w-1/6')}>
              Activity ID
            </th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => (
            <ReportRow key={activity.id} activity={activity} />
          ))}
        </tbody>
      </table>

      {activities.length === 0 && (
        <div className="text-muted-foreground px-4 py-8 text-center">
          No activities to display.
        </div>
      )}
    </div>
  );
}
