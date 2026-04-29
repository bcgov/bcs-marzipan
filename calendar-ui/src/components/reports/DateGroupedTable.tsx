import { Fragment } from 'react';

import type { ActivityResponse } from '@corpcal/shared/api/types';
import { plainTextFromActivityRichField } from '@corpcal/shared/utils';
import { ActivityRichTextContent } from '@/components/ui/activity-rich-text-content';
import { parseDateOnlyString } from '@/lib/datetime-utils';
import { sortLookAheadActivities } from '@/lib/look-ahead-sort';
import { cn } from '@/lib/utils';

import { Badge } from '../ui/badge';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '–';
  const d = parseDateOnlyString(dateStr);
  return d.toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateStr: string | null, timeStr: string | null): string {
  if (timeStr) {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h ?? '0', 10);
    const minute = m ?? '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${minute} ${ampm}`;
  }
  if (dateStr) {
    const d = parseDateOnlyString(dateStr);
    return d.toLocaleTimeString('en-CA', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  return '–';
}

interface DateGroupedTableProps {
  activities: ActivityResponse[];
  className?: string;
}

export function DateGroupedTable({
  activities,
  className,
}: DateGroupedTableProps) {
  const sorted = sortLookAheadActivities(activities);

  let lastDateKey: string | null = null;

  return (
    <div
      className={cn('border-border overflow-auto rounded-md border', className)}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-border bg-muted/50 border-b">
            <th className="px-4 py-2 text-left font-medium">Time</th>
            <th className="px-4 py-2 text-left font-medium">Status</th>
            <th className="px-4 py-2 text-left font-medium">
              Activity Details
            </th>
            <th className="px-4 py-2 text-left font-medium">Ref #</th>
            <th className="px-4 py-2 text-left font-medium">MIN</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((activity) => {
            const dateKey = activity.startDate ?? '';
            const showDateHeader = dateKey !== lastDateKey;
            if (showDateHeader) lastDateKey = dateKey;

            return (
              <Fragment key={activity.id}>
                {showDateHeader && (
                  <tr className="border-border bg-muted/30 border-b font-semibold">
                    <td colSpan={5} className="px-4 py-2">
                      {formatDate(activity.startDate)}
                    </td>
                  </tr>
                )}
                <tr className="border-border hover:bg-muted/20 border-b">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {formatTime(activity.startDate, activity.startTime)}
                  </td>
                  <td className="px-4 py-2">
                    {activity.lookAheadStatus &&
                    activity.lookAheadStatus !== 'none' ? (
                      <Badge
                        variant={
                          activity.lookAheadStatus === 'new'
                            ? 'info'
                            : 'warning'
                        }
                      >
                        {activity.lookAheadStatus === 'new' ? 'NEW' : 'CHANGED'}
                      </Badge>
                    ) : (
                      '–'
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div>
                      {activity.title && (
                        <span className="font-medium">{activity.title}</span>
                      )}
                      {plainTextFromActivityRichField(
                        activity.executiveSummary ?? ''
                      ).length > 0 && (
                        <div className="text-muted-foreground mt-1 text-xs">
                          <ActivityRichTextContent
                            value={activity.executiveSummary}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="text-muted-foreground px-4 py-2">
                    {activity.displayId ?? '–'}
                  </td>
                  <td className="text-muted-foreground px-4 py-2">
                    {activity.displayId
                      ? (activity.displayId.split('-')[0] ?? '–')
                      : '–'}
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="text-muted-foreground px-4 py-8 text-center">
          No activities in this section.
        </div>
      )}
    </div>
  );
}
