import { Calendar, Clock, MapPin } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  formatDateRange,
  formatExactDate,
  formatTime12h,
  parseDateOnlyString,
} from '@/lib/datetime-utils';
import { cn } from '@/lib/utils';

import type { ActivityTableRow } from '../activityTableRow';
import {
  LIST_REVIEW_HIGHLIGHT_BG,
  rowHasAnyChangedPath,
  toSentenceCase,
} from '../activityTableRowDisplay';

export interface SchedulingCellCompactProps {
  row: ActivityTableRow;
  showReviewHighlights: boolean;
}

/**
 * Grid A scheduling column: date, time, and venue with the premier request
 * line on top. Government representatives are omitted so this cell stays short.
 */
export function SchedulingCellCompact({
  row,
  showReviewHighlights,
}: SchedulingCellCompactProps) {
  const dateStatusChanged =
    showReviewHighlights &&
    rowHasAnyChangedPath(row, ['dateStatusId', 'dateStatus']);
  const timeStatusChanged =
    showReviewHighlights &&
    rowHasAnyChangedPath(row, ['timeStatusId', 'timeStatus']);
  const premierChanged =
    showReviewHighlights &&
    rowHasAnyChangedPath(row, ['premierRequestedId', 'premierRequested']);

  const hasPremier =
    row.premierRequested != null && row.premierRequested.toLowerCase() !== 'no';

  const dateRangeText =
    row.startDate && row.endDate && row.endDate !== row.startDate
      ? formatDateRange(row.startDate, row.endDate)
      : row.startDate
        ? formatExactDate(parseDateOnlyString(row.startDate), {
            includeYear: 'auto',
          })
        : '';

  return (
    <div className="flex flex-col gap-0.5 text-[13px]">
      {hasPremier && (
        <Badge
          variant="primary"
          className={cn(
            'h-auto min-h-5 w-fit text-xs text-white',
            premierChanged && LIST_REVIEW_HIGHLIGHT_BG,
            premierChanged && 'border-transparent text-slate-900'
          )}
        >
          Premier: {row.premierRequested}
        </Badge>
      )}

      {row.startDate && (
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 shrink-0 text-slate-500" />
          <span>{dateRangeText}</span>
          <Badge
            variant="outline"
            className={cn(
              'h-auto min-h-5 border-slate-200 text-xs text-slate-600',
              dateStatusChanged && LIST_REVIEW_HIGHLIGHT_BG,
              dateStatusChanged && 'border-transparent'
            )}
          >
            {toSentenceCase(row.dateStatus)}
          </Badge>
        </div>
      )}

      {(row.allDay || row.startTime || row.timeStatus) && (
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 shrink-0 text-slate-500" />
          <span>
            {row.allDay
              ? 'All day'
              : row.startTime
                ? `${formatTime12h(row.startTime)}${row.endTime ? ` \u2013 ${formatTime12h(row.endTime)}` : ''}`
                : '--:-- \u2013 --:--'}
          </span>
          <Badge
            variant="outline"
            className={cn(
              'h-5 border-slate-200 text-xs text-slate-600',
              timeStatusChanged && LIST_REVIEW_HIGHLIGHT_BG,
              timeStatusChanged && 'border-transparent'
            )}
          >
            {toSentenceCase(row.timeStatus)}
          </Badge>
        </div>
      )}

      {row.venue && (
        <div className="flex items-start gap-1">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <span className="line-clamp-2">{row.venue}</span>
        </div>
      )}
    </div>
  );
}
