import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ActivityHistoryEntry } from '@corpcal/shared/api/types';
import { fetchActivityHistory } from '@/api/activitiesApi';
import {
  buildHistoryAppliedFilterTypeLabels,
  HISTORY_LIST_CONTENT_CLASSNAME,
  HistoryList,
  HistoryListEmptyState,
  HistoryListLoading,
  HistoryListToolbar,
  HistorySearchInput,
  toActivityHistoryViewModel,
} from '@/components/history';
import { ErrorState } from '@/components/shared';
import {
  tableContainer,
  tableScrollWrapper,
} from '@/components/table/tableConstants';
import { TableSummaryBar } from '@/components/table/TableSummaryBar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
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
import { cn } from '@/lib/utils';

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
  displayId,
  open,
  onOpenChange,
  dateStatuses,
  venueStatuses: venueStatusesProp,
}: {
  activityId: number;
  displayId?: string;
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

  const recordSummaryBar = !loadError ? (
    <TableSummaryBar
      count={loading ? 0 : filteredEntries.length}
      singularLabel="record"
      pluralLabel="records"
      appliedFilterTypeLabels={buildHistoryAppliedFilterTypeLabels({
        searchQuery,
      })}
      onClearFilters={searchQuery.trim() ? () => setSearchQuery('') : undefined}
    />
  ) : null;

  const showHistoryList =
    !loading && !loadError && entries.length > 0 && filteredEntries.length > 0;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent
          className={cn(
            'flex h-full flex-col',
            'data-[vaul-drawer-direction=right]:w-full',
            'data-[vaul-drawer-direction=right]:max-w-xl',
            'data-[vaul-drawer-direction=right]:sm:max-w-xl'
          )}
        >
          <DrawerHeader className="shrink-0 text-left">
            <DrawerTitle>
              History
              {displayId != null && displayId.length > 0 ? (
                <> {displayId}</>
              ) : null}
            </DrawerTitle>
          </DrawerHeader>

          <div className="shrink-0 px-4 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <HistorySearchInput
                value={searchQuery}
                onChange={setSearchQuery}
              />
              <Button
                type="button"
                variant="outline"
                size="input"
                className="shrink-0"
                onClick={() => setNoteModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Note
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
            {!showHistoryList ? recordSummaryBar : null}
            {loading ? (
              <HistoryListLoading />
            ) : loadError ? (
              <ErrorState
                title={LOAD_HISTORY_TITLE}
                message={LOAD_HISTORY_MESSAGE}
                onRetry={() => void loadHistory()}
              />
            ) : entries.length === 0 ? (
              <div className={cn(tableContainer, 'min-h-0 flex-1')}>
                <HistoryListEmptyState variant="no-data" />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className={cn(tableContainer, 'min-h-0 flex-1')}>
                <HistoryListEmptyState variant="no-search-match" />
              </div>
            ) : (
              <HistoryList
                entries={historyEntries}
                className={HISTORY_LIST_CONTENT_CLASSNAME}
              >
                {({ expandAll, groups }) => (
                  <div className="flex min-h-0 flex-1 flex-col">
                    <HistoryListToolbar
                      summary={recordSummaryBar}
                      expandAll={expandAll}
                    />
                    <div className={cn(tableContainer, 'min-h-0 flex-1')}>
                      <div className={tableScrollWrapper}>{groups}</div>
                    </div>
                  </div>
                )}
              </HistoryList>
            )}
          </div>
        </DrawerContent>
      </Drawer>

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
