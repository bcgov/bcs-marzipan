import type { ActivityResponse } from '@corpcal/shared/api/types';
import { cn } from '@/lib/utils';

import { ReportRow } from './ReportRow';

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
      className={cn('border-border overflow-auto rounded-md border', className)}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-border bg-muted/50 border-b">
            <th className="w-1/6 px-4 py-3 text-left font-semibold text-slate-700">
              Date & Time
            </th>
            <th className="w-1/6 px-4 py-3 text-left font-semibold text-slate-700">
              Lead
            </th>
            <th className="w-1/2 px-4 py-3 text-left font-semibold text-slate-700">
              Activity Details
            </th>
            <th className="w-1/6 px-4 py-3 text-left font-semibold text-slate-700">
              Release
            </th>
            <th className="w-1/6 px-4 py-3 text-left font-semibold text-slate-700">
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
