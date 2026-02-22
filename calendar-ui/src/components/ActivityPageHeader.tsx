import { History } from 'lucide-react';
import type { ReactElement } from 'react';

import { formatDisplayValue } from '../lib/formatDisplayValue';
import { formatLongDate, formatTime, isSameDay, timeAgo } from '../lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CopyableText } from './ui/copyable-text';

type ActivityPageHeaderProps = {
  displayId: string;
  title: string;
  categories: string[];
  leadOrg?: string | null;
  activityStatus?: unknown;
  lastUpdatedDateTime?: string | null;
  createdDateTime?: string | null;
  onHistoryClick?: () => void;
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
}: ActivityPageHeaderProps): ReactElement {
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
        {activityStatus != null && activityStatus !== '' ? (
          <Badge variant="secondary">
            {formatDisplayValue(activityStatus)}
          </Badge>
        ) : null}
        <div className="text-muted-foreground text-xs sm:text-sm">
          {lastUpdatedDateTime &&
          createdDateTime &&
          lastUpdatedDateTime !== createdDateTime ? (
            <div>
              Updated{' '}
              {isSameDay(new Date(lastUpdatedDateTime), new Date())
                ? `today at ${formatTime(new Date(lastUpdatedDateTime))}`
                : `${timeAgo(new Date(lastUpdatedDateTime))} ago`}
            </div>
          ) : null}
          <div>
            Created{' '}
            {createdDateTime ? formatLongDate(new Date(createdDateTime)) : ''}
          </div>
        </div>
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
    </div>
  );
}
