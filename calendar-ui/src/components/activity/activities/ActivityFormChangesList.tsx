import { useMemo, useState, type ReactElement } from 'react';

import type { HistoryChange } from '@corpcal/shared/api/types';
import {
  formatHistoryFieldValue,
  getHistoryFieldLabel,
  type StatusLookupMap,
} from '@/lib/activity-history-format';

const INITIAL_VISIBLE_CHANGES = 5;

export type ActivityFormChangesListProps = {
  changes: HistoryChange[];
  dateStatuses?: Array<{ id: string | number; label: string }>;
  venueStatuses?: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
  className?: string;
};

/**
 * Scrollable list of field changes (old → new), shared by save-confirm and discard dialogs.
 */
export function ActivityFormChangesList({
  changes,
  dateStatuses,
  venueStatuses,
  className,
}: ActivityFormChangesListProps): ReactElement {
  const [showAllChanges, setShowAllChanges] = useState(false);

  const dateStatusMap: StatusLookupMap = useMemo(() => {
    const map = new Map<number | string, string>();
    if (dateStatuses) {
      dateStatuses.forEach((status) => {
        map.set(status.id, status.label);
      });
    }
    return map;
  }, [dateStatuses]);

  const venueStatusMap: StatusLookupMap = useMemo(() => {
    const map = new Map<number | string, string>();
    if (venueStatuses) {
      venueStatuses.forEach((status) => {
        map.set(status.id, status.displayName ?? status.name);
      });
    }
    return map;
  }, [venueStatuses]);

  const visibleChanges = showAllChanges
    ? changes
    : changes.slice(0, INITIAL_VISIBLE_CHANGES);
  const hiddenCount = changes.length - INITIAL_VISIBLE_CHANGES;

  return (
    <div className={className}>
      {changes.length === 0 ? (
        <p className="text-muted-foreground text-sm">No changes detected.</p>
      ) : (
        <div className="space-y-2 pr-1">
          {visibleChanges.map((change, idx) => (
            <div key={idx} className="text-sm">
              <strong className="font-medium">
                {getHistoryFieldLabel(change.field)}:
              </strong>{' '}
              <span className="text-muted-foreground">
                {formatHistoryFieldValue(
                  change.field,
                  change.oldValue,
                  dateStatusMap,
                  venueStatusMap
                )}
              </span>{' '}
              &rarr;{' '}
              <span>
                {formatHistoryFieldValue(
                  change.field,
                  change.newValue,
                  dateStatusMap,
                  venueStatusMap
                )}
              </span>
            </div>
          ))}

          {!showAllChanges && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAllChanges(true)}
              className="text-primary mt-2 cursor-pointer text-sm font-medium hover:underline"
            >
              Show {hiddenCount} more change{hiddenCount !== 1 ? 's' : ''}
            </button>
          )}
          {showAllChanges && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAllChanges(false)}
              className="text-primary mt-2 cursor-pointer text-sm font-medium hover:underline"
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}
