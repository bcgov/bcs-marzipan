import { History, Star } from 'lucide-react';
import type { ReactElement } from 'react';

import { Badge, getActivityStatusBadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyableText } from '@/components/ui/copyable-text';
import {
  formatLongDate,
  formatRelativeTime,
  formatTime,
  isSameDay,
} from '@/lib/datetime-utils';
import { formatDisplayValue } from '@/lib/formatDisplayValue';

type ActivityPageHeaderProps = {
  displayId: string;
  title: string;
  categories: string[];
  leadOrg?: string | null;
  activityStatus?: unknown;
  lastUpdatedDateTime?: string | null;
  createdDateTime?: string | null;
  onHistoryClick?: () => void;
  isFavourite?: boolean;
  onFavouriteToggle?: () => void;
};

/**
 * Header block for view/edit activity pages: displayId, title, categories, status, timestamps, History button.
 */
export function ActivityPageHeader({
  displayId,
  title,
  categories,
  leadOrg,
  activityStatus,
  lastUpdatedDateTime,
  createdDateTime,
  onHistoryClick,
  isFavourite,
  onFavouriteToggle,
}: ActivityPageHeaderProps): ReactElement {
  const statusDisplay = formatDisplayValue(activityStatus);
  let updatedLabel: string | null = null;
  if (
    lastUpdatedDateTime &&
    createdDateTime &&
    lastUpdatedDateTime !== createdDateTime
  ) {
    const d = new Date(lastUpdatedDateTime);
    updatedLabel = isSameDay(d, new Date())
      ? `today at ${formatTime(d)}`
      : formatRelativeTime(d);
  }
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1">
        <CopyableText
          text={displayId}
          copyLabel="Copy display ID"
          className="text-md text-muted-foreground hover:text-foreground mb-1.5 -ml-2 px-2 py-1"
        >
          {displayId}
        </CopyableText>
        <h1 className="text-lg font-bold">{title}</h1>
        {categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((cat, idx) => (
              <Badge key={idx} variant="default" className="bg-primary">
                {cat}
              </Badge>
            ))}
          </div>
        )}
        {leadOrg && (
          <div className="text-muted-foreground mt-3 text-sm">{leadOrg}</div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2 text-right">
        {statusDisplay !== '' ? (
          <Badge variant={getActivityStatusBadgeVariant(statusDisplay)}>
            {statusDisplay}
          </Badge>
        ) : null}
        <div className="text-muted-foreground text-xs sm:text-sm">
          {updatedLabel ? <div>Updated {updatedLabel}</div> : null}
          <div>
            Created{' '}
            {createdDateTime ? formatLongDate(new Date(createdDateTime)) : ''}
          </div>
        </div>
        {(onFavouriteToggle || onHistoryClick) && (
          <div className="flex items-center gap-2">
            {onFavouriteToggle && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                title={
                  isFavourite ? 'Remove from favourites' : 'Add to favourites'
                }
                onClick={onFavouriteToggle}
                className="shrink-0"
              >
                <Star
                  className="h-4 w-4"
                  fill={isFavourite ? 'currentColor' : 'none'}
                />
              </Button>
            )}
            {onHistoryClick && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="View history"
                onClick={onHistoryClick}
                className="shrink-0"
              >
                <History className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
