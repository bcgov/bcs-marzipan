import { useMemo, useState, type ReactElement } from 'react';

import type { HistoryChange } from '@corpcal/shared/api/types';
import { ExpandableText } from '@/components/shared';
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

const INITIAL_VISIBLE_CHANGES = 5;

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
  const [showAllChanges, setShowAllChanges] = useState(false);

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
                <ExpandableText
                  text={formatHistoryFieldValue(
                    change.field,
                    change.oldValue,
                    lookupMaps
                  )}
                />
              </span>{' '}
              &rarr;{' '}
              <span>
                <ExpandableText
                  text={formatHistoryFieldValue(
                    change.field,
                    change.newValue,
                    lookupMaps
                  )}
                />
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
