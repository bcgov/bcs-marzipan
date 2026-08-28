import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import type { ActivityHistoryEntry } from '@corpcal/shared/api/types';
import { fetchActivityHistory } from '@/api/activitiesApi';
import { HistoryList, toActivityHistoryViewModel } from '@/components/history';
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
  useCategories,
  useCommsMaterials,
  useEventPlanners,
  useGovernmentRepresentatives,
  useMinistries,
  useNewsReleaseDistributions,
  useNewsReleaseOrigins,
  useOrganizations,
  usePitchRequiredStatuses,
  usePremierRequested,
  useTags,
  useTeams,
  useTimeStatuses,
  useTranslationLanguages,
  useTranslationRequiredStatuses,
  useUsers,
  useVenueStatuses,
} from '@/hooks/useLookups';
import {
  formatHistoryFieldValue,
  getActionText,
  getHistoryFieldLabel,
  type LookupMaps,
  type StatusLookupMap,
} from '@/lib/activity-history-format';
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
    entry.actor?.displayName || entry.userName || `User ${entry.userId}`,
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
  const addNoteMutation = useAddActivityHistoryNote();

  const activityStatusesQuery = useActivityStatuses();
  const timeStatusesQuery = useTimeStatuses();
  const venueStatusesQuery = useVenueStatuses();
  const pitchRequiredStatusesQuery = usePitchRequiredStatuses();
  const translationRequiredStatusesQuery = useTranslationRequiredStatuses();
  const newsReleaseOriginsQuery = useNewsReleaseOrigins();
  const newsReleaseDistributionsQuery = useNewsReleaseDistributions();
  const premierRequestedQuery = usePremierRequested();
  const usersQuery = useUsers();
  const eventPlannersQuery = useEventPlanners();
  const categoriesQuery = useCategories();
  const tagsQuery = useTags();
  const commsMaterialsQuery = useCommsMaterials();
  const translationLanguagesQuery = useTranslationLanguages();
  const teamsQuery = useTeams();
  const governmentRepsQuery = useGovernmentRepresentatives();
  const ministriesQuery = useMinistries();
  const organizationsQuery = useOrganizations();

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

    const usersMap = new Map<number | string, string>();
    usersQuery.data?.forEach((u) => usersMap.set(u.id, u.label));

    const teamsMap = new Map<number | string, string>();
    teamsQuery.data?.forEach((t) =>
      teamsMap.set(t.id, t.displayName ?? t.name)
    );

    const categoriesMap = new Map<number | string, string>();
    categoriesQuery.data?.forEach((c) =>
      categoriesMap.set(c.id, c.displayName ?? c.name)
    );

    const tagsMap = new Map<number | string, string>();
    tagsQuery.data?.forEach((t) => tagsMap.set(t.id, t.label));

    const commsMaterialsMap = new Map<number | string, string>();
    commsMaterialsQuery.data?.forEach((m) =>
      commsMaterialsMap.set(m.id, m.displayName ?? m.name)
    );

    const translationLanguagesMap = new Map<number | string, string>();
    translationLanguagesQuery.data?.forEach((l) =>
      translationLanguagesMap.set(l.id, l.displayName ?? l.name)
    );

    const governmentRepresentativesMap = new Map<number | string, string>();
    governmentRepsQuery.data?.forEach((r) =>
      governmentRepresentativesMap.set(r.id, r.displayName || r.name)
    );

    const ministriesMap = new Map<number | string, string>();
    ministriesQuery.data?.forEach((m) =>
      ministriesMap.set(m.id, m.displayName ?? m.name)
    );

    const organizationsMap = new Map<number | string, string>();
    organizationsQuery.data?.forEach((o) =>
      organizationsMap.set(o.id, o.displayName ?? o.name)
    );

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
      usersMap,
      eventPlannersMap: toMap(eventPlannersQuery.data),
      categoriesMap,
      tagsMap,
      commsMaterialsMap,
      translationLanguagesMap,
      sharedWithTeamsMap: teamsMap,
      governmentRepresentativesMap,
      teamsMap,
      ministriesMap,
      organizationsMap,
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
    usersQuery.data,
    eventPlannersQuery.data,
    categoriesQuery.data,
    tagsQuery.data,
    commsMaterialsQuery.data,
    translationLanguagesQuery.data,
    teamsQuery.data,
    governmentRepsQuery.data,
    ministriesQuery.data,
    organizationsQuery.data,
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
  const historyEntries = useMemo(
    () =>
      filteredEntries.map((entry) =>
        toActivityHistoryViewModel(entry, { lookupMaps })
      ),
    [filteredEntries, lookupMaps]
  );

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
              'bg-background fixed top-0 right-0 z-50 h-full w-full max-w-xl translate-x-full transform p-6 transition duration-200 ease-in-out data-[state=open]:translate-x-0'
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
                <HistoryList entries={historyEntries} />
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
