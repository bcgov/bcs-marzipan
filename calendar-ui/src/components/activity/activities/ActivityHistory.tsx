import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import type { ActivityHistoryEntry } from '@corpcal/shared/api/types';
import { fetchActivityHistory } from '@/api/activitiesApi';
import { ErrorState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAddActivityHistoryNote } from '@/hooks/useCalendar';
import {
  useActivityStatuses,
  useNewsReleaseDistributions,
  useNewsReleaseOrigins,
  usePitchRequiredStatuses,
  usePremierRequested,
  useTimeStatuses,
  useTranslationRequiredStatuses,
  useVenueStatuses,
} from '@/hooks/useLookups';
import {
  formatHistoryFieldValue,
  getActionText,
  getHistoryFieldLabel,
  type LookupMaps,
  type StatusLookupMap,
} from '@/lib/activity-history-format';
import {
  CORP_PACIFIC_TIME_ZONE,
  formatLongDate,
  formatPacificTimeWithAbbrev,
  pacificActivityHistoryRecencyBucket,
} from '@/lib/datetime-utils';
import { LOAD_HISTORY_MESSAGE, LOAD_HISTORY_TITLE } from '@/lib/error-messages';
import { showErrorToast } from '@/lib/error-toast';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ActivityHistory');

export interface DateStatusLookupItem {
  id: string | number;
  label: string;
  value?: string | number;
}

const MAX_NOTE_LENGTH = 1000;

function getActorDisplayName(entry: ActivityHistoryEntry): string {
  return entry.actor?.displayName || entry.userName || `User ${entry.userId}`;
}

function getActorInitials(entry: ActivityHistoryEntry): string {
  const displayName = getActorDisplayName(entry);
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'U';
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function matchesSearch(
  entry: ActivityHistoryEntry,
  query: string,
  lookupMaps: LookupMaps
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const haystacks = [
    getActorDisplayName(entry),
    entry.actor?.username,
    getActionText(entry.actionType),
    entry.notes,
    ...(entry.changes ?? []).flatMap((change) => [
      getHistoryFieldLabel(change.field),
      formatHistoryFieldValue(change.field, change.oldValue, lookupMaps),
      formatHistoryFieldValue(change.field, change.newValue, lookupMaps),
    ]),
  ]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.toLowerCase());

  return haystacks.some((value) => value.includes(normalizedQuery));
}

export default function ActivityHistory({
  activityId,
  open,
  onOpenChange,
  dateStatuses,
  venueStatuses: venueStatusesProp,
}: {
  activityId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateStatuses?: DateStatusLookupItem[];
  venueStatuses?: Array<{ id: number; name: string; displayName?: string }>;
}) {
  const [entries, setEntries] = useState<ActivityHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(
    new Set()
  );
  const addNoteMutation = useAddActivityHistoryNote();

  const activityStatusesQuery = useActivityStatuses();
  const timeStatusesQuery = useTimeStatuses();
  const venueStatusesQuery = useVenueStatuses();
  const pitchRequiredStatusesQuery = usePitchRequiredStatuses();
  const translationRequiredStatusesQuery = useTranslationRequiredStatuses();
  const newsReleaseOriginsQuery = useNewsReleaseOrigins();
  const newsReleaseDistributionsQuery = useNewsReleaseDistributions();
  const premierRequestedQuery = usePremierRequested();

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

  const lookupMaps = useMemo((): LookupMaps => {
    const toMap = (
      items: Array<{ id: number; label: string }> | undefined
    ): StatusLookupMap => {
      const map = new Map<number | string, string>();
      items?.forEach((item) => map.set(item.id, item.label));
      return map;
    };

    const dateStatusMap = new Map<number | string, string>();
    dateStatuses?.forEach((s) => dateStatusMap.set(s.id, s.label));

    // Prefer prop-supplied venue statuses; fall back to query data
    const venueStatusMap = new Map<number | string, string>();
    if (venueStatusesProp) {
      venueStatusesProp.forEach((s) =>
        venueStatusMap.set(s.id, s.displayName ?? s.name)
      );
    } else {
      venueStatusesQuery.data?.forEach((s) =>
        venueStatusMap.set(s.id, s.displayName)
      );
    }

    return {
      dateStatusMap,
      venueStatusMap,
      activityStatusMap: toMap(activityStatusesQuery.data),
      timeStatusMap: toMap(timeStatusesQuery.data),
      pitchRequiredStatusMap: toMap(pitchRequiredStatusesQuery.data),
      translationsRequiredStatusMap: toMap(
        translationRequiredStatusesQuery.data
      ),
      newsReleaseOriginMap: toMap(newsReleaseOriginsQuery.data),
      newsReleaseDistributionMap: toMap(newsReleaseDistributionsQuery.data),
      premierRequestedMap: toMap(premierRequestedQuery.data),
    };
  }, [
    dateStatuses,
    venueStatusesProp,
    venueStatusesQuery.data,
    activityStatusesQuery.data,
    timeStatusesQuery.data,
    pitchRequiredStatusesQuery.data,
    translationRequiredStatusesQuery.data,
    newsReleaseOriginsQuery.data,
    newsReleaseDistributionsQuery.data,
    premierRequestedQuery.data,
  ]);

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

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => matchesSearch(entry, searchQuery, lookupMaps)),
    [entries, searchQuery, lookupMaps]
  );

  // Categorize into Today / This week / Earlier using corp Pacific calendar
  // boundaries so buckets match Pacific-formatted timestamps.
  const groupsOrder = ['Today', 'This week', 'Earlier'] as const;
  const groups: Record<string, ActivityHistoryEntry[]> = {
    Today: [],
    'This week': [],
    Earlier: [],
  };

  const now = new Date();
  for (const e of filteredEntries) {
    const bucket = pacificActivityHistoryRecencyBucket(
      new Date(e.timestamp),
      now
    );
    groups[bucket].push(e);
  }

  const trimmedNote = noteText.trim();

  const handleAddNote = async () => {
    if (!trimmedNote || addNoteMutation.isPending) {
      return;
    }

    try {
      await addNoteMutation.mutateAsync({
        id: activityId,
        body: { note: trimmedNote },
      });
      toast.success('Note added');
      setNoteText('');
      setNoteModalOpen(false);
      await loadHistory();
    } catch (err) {
      logger.error('Failed to add history note', err);
      showErrorToast(err);
    }
  };

  const noteButtonDisabled =
    trimmedNote.length === 0 || trimmedNote.length > MAX_NOTE_LENGTH;

  return (
    <>
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

            <div className="border-b border-slate-200 pb-4">
              <div className="pr-8">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                  Activity timeline
                </p>
                <h2 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-900">
                  History
                </h2>
                <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
                  {entries.length === 0
                    ? 'Track updates, reviews, and notes for this activity.'
                    : `${entries.length} event${entries.length === 1 ? '' : 's'} recorded for this activity.`}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <input
                  placeholder="Search"
                  aria-label="Search history"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="bg-background w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNoteModalOpen(true)}
                >
                  + Add note
                </Button>
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
              ) : filteredEntries.length === 0 ? (
                <div>No matching history found.</div>
              ) : (
                groupsOrder.map((groupKey) =>
                  groups[groupKey].length > 0 ? (
                    <div key={groupKey} className="mb-6">
                      <div className="mb-2 text-sm font-semibold">
                        {groupKey}
                      </div>
                      <div className="space-y-4">
                        {groups[groupKey].map((entry) => (
                          <div key={entry.id} className="rounded py-3">
                            <div className="flex gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                                {getActorInitials(entry)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <div className="text-foreground text-base font-normal">
                                      {getActorDisplayName(entry)}
                                    </div>
                                    <div className="text-muted-foreground mt-1 text-sm">
                                      {getActionText(entry.actionType)}
                                    </div>
                                  </div>
                                  <div className="text-muted-foreground text-sm">
                                    {groupKey === 'Today'
                                      ? `Today at ${formatPacificTimeWithAbbrev(
                                          new Date(entry.timestamp)
                                        )}`
                                      : formatLongDate(
                                          new Date(entry.timestamp),
                                          { timeZone: CORP_PACIFIC_TIME_ZONE }
                                        )}
                                  </div>
                                </div>

                                <div className="text-foreground mt-3 space-y-3 text-sm">
                                  {entry.changes && entry.changes.length > 0 ? (
                                    <div>
                                      {(expandedEntries.has(entry.id)
                                        ? entry.changes
                                        : entry.changes.slice(0, 3)
                                      ).map((change, index) => (
                                        <div
                                          key={index}
                                          className="mb-1 text-sm"
                                        >
                                          <strong className="font-medium">
                                            {getHistoryFieldLabel(change.field)}
                                            :
                                          </strong>{' '}
                                          <span className="text-muted-foreground">
                                            {formatHistoryFieldValue(
                                              change.field,
                                              change.oldValue,
                                              lookupMaps
                                            )}
                                          </span>{' '}
                                          →{' '}
                                          <span>
                                            {formatHistoryFieldValue(
                                              change.field,
                                              change.newValue,
                                              lookupMaps
                                            )}
                                          </span>
                                        </div>
                                      ))}
                                      {entry.changes.length > 3 ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleExpandedEntry(entry.id)
                                          }
                                          className="mt-1 cursor-pointer border-none bg-transparent p-0 text-sm font-medium text-blue-600 hover:text-blue-800"
                                        >
                                          {expandedEntries.has(entry.id)
                                            ? 'Show less'
                                            : 'Show more'}
                                        </button>
                                      ) : null}
                                    </div>
                                  ) : null}

                                  {entry.notes ? (
                                    <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                      {entry.notes}
                                    </div>
                                  ) : null}

                                  {!entry.notes &&
                                  (!entry.changes ||
                                    entry.changes.length === 0) ? (
                                    <div className="text-muted-foreground text-sm">
                                      No field-level changes recorded
                                    </div>
                                  ) : null}
                                </div>
                              </div>
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

      <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add note</DialogTitle>
            <DialogDescription>
              Add context to the activity history without changing the activity
              itself.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="activity-history-note">Note</Label>
            <Textarea
              id="activity-history-note"
              placeholder="Add context for future readers."
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              rows={4}
              maxLength={MAX_NOTE_LENGTH}
            />
            <p className="text-muted-foreground text-xs">
              {trimmedNote.length} / {MAX_NOTE_LENGTH}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNoteModalOpen(false);
                setNoteText('');
              }}
              disabled={addNoteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleAddNote()}
              disabled={noteButtonDisabled || addNoteMutation.isPending}
            >
              {addNoteMutation.isPending ? 'Saving...' : 'Add note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
