import type { ActivityResponse } from '@corpcal/shared/api/types';
import { cn } from '@/lib/utils';

import { ReportRow } from './ReportRow';

/** Sticky within the report section scroll area; opaque bg so rows don’t show through. */
const headerCell =
  'sticky top-0 z-10 border-b border-(--corpcal-table-border) bg-(--corpcal-table-header-bg) px-4 py-3 text-left text-sm font-semibold text-(--corpcal-table-header-fg) backdrop-blur-sm';

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
        'overflow-x-auto rounded-(--corpcal-table-radius) border border-(--corpcal-table-border) bg-(--corpcal-table-surface)',
        className
      )}
    >
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="border-b border-(--corpcal-table-border)">
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
        <div className="px-4 py-8 text-center text-(--corpcal-table-cell-muted-fg)">
          No activities to display.
        </div>
      )}
    </div>
  );
}
