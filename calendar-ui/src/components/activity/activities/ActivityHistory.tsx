import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import type { ActivityHistoryEntry } from '@corpcal/shared/api/types';
import { fetchActivityHistory } from '@/api/activitiesApi';
import { ErrorState } from '@/components/shared';
import {
  formatHistoryFieldValue,
  getActionText,
  getHistoryFieldLabel,
} from '@/lib/activity-history-format';
import { formatLongDate, formatTime } from '@/lib/datetime-utils';
import { LOAD_HISTORY_MESSAGE, LOAD_HISTORY_TITLE } from '@/lib/error-messages';
import { showErrorToast } from '@/lib/error-toast';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ActivityHistory');

export interface DateStatusLookupItem {
  id: string | number;
  label: string;
  value?: string | number;
}

export default function ActivityHistory({
  activityId,
  open,
  onOpenChange,
  dateStatuses,
  venueStatuses,
}: {
  activityId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateStatuses?: DateStatusLookupItem[];
  venueStatuses?: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
}) {
  const [entries, setEntries] = useState<ActivityHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(
    new Set()
  );

  // Toggle expanded state for a history entry
  const toggleExpandedEntry = useCallback((entryId: number) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  }, []);

  // Create a map of date status ID to label for quick lookup
  const dateStatusMap = React.useMemo(() => {
    const map = new Map<number | string, string>();
    if (dateStatuses) {
      dateStatuses.forEach((status) => {
        map.set(status.id, status.label);
      });
    }
    return map;
  }, [dateStatuses]);

  const venueStatusMap = React.useMemo(() => {
    const map = new Map<number | string, string>();
    if (venueStatuses) {
      venueStatuses.forEach((status) => {
        map.set(status.id, status.displayName ?? status.name);
      });
    }
    return map;
  }, [venueStatuses]);

  const loadHistory = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setLoadError(false);
    try {
      const data = await fetchActivityHistory(activityId);
      setEntries(data || []);
    } catch (err) {
      logger.error('Failed to load activity history', err);
      setLoadError(true);
      showErrorToast(err);
    } finally {
      setLoading(false);
    }
  }, [activityId, open]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // group by local date string
  // Categorize into Today / This week / Earlier
  const groupsOrder = ['Today', 'This week', 'Earlier'];
  const groups: Record<string, ActivityHistoryEntry[]> = {
    Today: [],
    'This week': [],
    Earlier: [],
  };

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - 7);

  for (const e of entries) {
    const dt = new Date(e.timestamp);
    if (dt >= startOfToday) {
      groups['Today'].push(e);
    } else if (dt >= startOfWeek) {
      groups['This week'].push(e);
    } else {
      groups['Earlier'].push(e);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <DialogPrimitive.Content
          className={
            'bg-background fixed top-0 right-0 z-50 h-full w-full max-w-md translate-x-full transform p-6 transition duration-200 ease-in-out data-[state=open]:translate-x-0'
          }
        >
          <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          <div>
            <h2 className="text-2xl font-semibold">History</h2>
            <div className="mt-3 flex items-center justify-between">
              <input
                placeholder="Search"
                aria-label="Search history"
                className="w-72 rounded-md border border-gray-200 px-3 py-2 text-sm"
                style={{ background: 'white' }}
              />
              <button className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium">
                + Add note
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-auto" style={{ maxHeight: '80vh' }}>
            {loading ? (
              <div>Loading history...</div>
            ) : loadError ? (
              <ErrorState
                title={LOAD_HISTORY_TITLE}
                message={LOAD_HISTORY_MESSAGE}
                onRetry={() => void loadHistory()}
              />
            ) : entries.length === 0 ? (
              <div>No history found.</div>
            ) : (
              groupsOrder.map((groupKey) =>
                groups[groupKey].length > 0 ? (
                  <div key={groupKey} className="mb-6">
                    <div className="mb-2 text-sm font-semibold">{groupKey}</div>
                    <div className="space-y-4">
                      {groups[groupKey].map((entry) => (
                        <div key={entry.id} className="rounded py-3">
                          <div className="flex justify-between">
                            <div className="flex items-start gap-3">
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 20,
                                  background: '#e6e7f2',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 600,
                                  color: '#1f2937',
                                  fontSize: 14,
                                }}
                              >
                                {entry.userName
                                  ? entry.userName
                                      .split(' ')
                                      .map((s) => s[0])
                                      .slice(0, 2)
                                      .join('')
                                  : 'U'}
                              </div>
                              <div>
                                <div className="text-foreground text-base font-normal">
                                  {entry.userName || `User ${entry.userId}`}{' '}
                                  <span className="text-muted-foreground ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                                    Corp Cal Admin
                                  </span>
                                </div>
                                <div className="text-muted-foreground mt-1 text-sm">
                                  {getActionText(entry.actionType)}
                                </div>
                              </div>
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {groupKey === 'Today'
                                ? `Today at ${formatTime(
                                    new Date(entry.timestamp)
                                  )}`
                                : formatLongDate(new Date(entry.timestamp))}
                            </div>
                          </div>

                          <div className="text-foreground mt-2 text-sm">
                            {entry.changes && entry.changes.length > 0 ? (
                              <div>
                                {(expandedEntries.has(entry.id)
                                  ? entry.changes
                                  : entry.changes.slice(0, 3)
                                ).map((c, idx) => (
                                  <div key={idx} className="mb-1 text-sm">
                                    <strong className="font-medium">
                                      {getHistoryFieldLabel(c.field)}:
                                    </strong>{' '}
                                    <span className="text-muted-foreground">
                                      {formatHistoryFieldValue(
                                        c.field,
                                        c.oldValue,
                                        dateStatusMap,
                                        venueStatusMap
                                      )}
                                    </span>{' '}
                                    →{' '}
                                    <span>
                                      {formatHistoryFieldValue(
                                        c.field,
                                        c.newValue,
                                        dateStatusMap,
                                        venueStatusMap
                                      )}
                                    </span>
                                  </div>
                                ))}
                                {entry.changes.length > 3 ? (
                                  <button
                                    onClick={() =>
                                      toggleExpandedEntry(entry.id)
                                    }
                                    className="mt-1 cursor-pointer border-none bg-none p-0 text-sm font-medium text-blue-600 hover:text-blue-800"
                                  >
                                    {expandedEntries.has(entry.id)
                                      ? 'Show less'
                                      : 'Show more'}
                                  </button>
                                ) : null}
                              </div>
                            ) : entry.notes ? (
                              <div className="text-sm">{entry.notes}</div>
                            ) : (
                              <div className="text-muted-foreground text-sm">
                                No field-level changes recorded
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null
              )
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
