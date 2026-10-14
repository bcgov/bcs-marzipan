import { useMemo, type ReactElement } from 'react';

import type { HistoryChange } from '@corpcal/shared/api/types';
import {
  HistoryChangeList,
  normalizeTransitionChanges,
} from '@/components/history';
import {
  useActivityStatuses,
  useCategories,
  useCommsMaterials,
  useDateStatuses,
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
  useVenueStatuses,
} from '@/hooks/useLookups';
import {
  formatHistoryFieldValue,
  getHistoryFieldLabel,
  type LookupMaps,
  type StatusLookupMap,
} from '@/lib/activity-history-format';

export type ActivityFormChangesListProps = {
  changes: HistoryChange[];
  className?: string;
};

/**
 * Scrollable list of field changes (old → new), shared by save-confirm and discard dialogs.
 * Builds its own lookup maps via React Query hooks (results are cached).
 */
export function ActivityFormChangesList({
  changes,
  className,
}: ActivityFormChangesListProps): ReactElement {
  const activityStatusesQuery = useActivityStatuses();
  const dateStatusesQuery = useDateStatuses();
  const timeStatusesQuery = useTimeStatuses();
  const venueStatusesQuery = useVenueStatuses();
  const pitchRequiredStatusesQuery = usePitchRequiredStatuses();
  const translationRequiredStatusesQuery = useTranslationRequiredStatuses();
  const newsReleaseOriginsQuery = useNewsReleaseOrigins();
  const newsReleaseDistributionsQuery = useNewsReleaseDistributions();
  const premierRequestedQuery = usePremierRequested();
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

    const venueStatusMap = new Map<number | string, string>();
    venueStatusesQuery.data?.forEach((s) =>
      venueStatusMap.set(s.id, s.displayName)
    );

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
      dateStatusMap: toMap(dateStatusesQuery.data),
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
    dateStatusesQuery.data,
    venueStatusesQuery.data,
    activityStatusesQuery.data,
    timeStatusesQuery.data,
    pitchRequiredStatusesQuery.data,
    translationRequiredStatusesQuery.data,
    newsReleaseOriginsQuery.data,
    newsReleaseDistributionsQuery.data,
    premierRequestedQuery.data,
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

  const normalizedChanges = useMemo(
    () =>
      normalizeTransitionChanges(changes, {
        getLabel: getHistoryFieldLabel,
        formatValue: (field, value) =>
          formatHistoryFieldValue(field, value, lookupMaps),
      }),
    [changes, lookupMaps]
  );

  return (
    <div className={className}>
      {changes.length === 0 ? (
        <p className="text-muted-foreground text-sm">No changes detected.</p>
      ) : (
        <HistoryChangeList
          changes={normalizedChanges}
          mode="preview"
          previewLimit={5}
          className="pr-1"
        />
      )}
    </div>
  );
}
