import { useMemo } from 'react';

import type { LeadTeamFilterOption } from '@/components/activity/ActivityTable/LeadTeamFilterPanel';
import {
  useActivityStatuses,
  useCategories,
  useEventPlanners,
  useTags,
  useTeams,
  useTranslationLanguages,
  useTranslationRequiredStatuses,
  useUsers,
} from '@/hooks/useLookups';
import type { ActivityFilterSummaryContext } from '@/lib/activity-filter-summary';
import { formatLeadTeamSelectLabel } from '@/lib/lead-team-display-label';

export interface ActivityStatusArchiveIds {
  completedStatusId?: number;
  deletedStatusId?: number;
}

/**
 * Shared lookup labels for activity table filters and summary bar chips.
 * Category options are included for saved-filter sanitization and summary chips.
 */
export function useActivityTableFilterLookups(canSeeDeleted: boolean): {
  statusArchiveIds: ActivityStatusArchiveIds;
  statusOptions: { value: string; label: string }[];
  tagOptions: { value: string; label: string }[];
  leadTeamOptions: LeadTeamFilterOption[];
  commsContactOptions: { value: string; label: string }[];
  eventPlannerOptions: { value: string; label: string }[];
  translationOptions: { value: string; label: string }[];
  translationStatusOptions: { value: string; label: string }[];
  categoryOptions: { value: string; label: string }[];
  filterSummaryContext: ActivityFilterSummaryContext;
  hasActivityStatuses: boolean;
} {
  const { data: activityStatusesForFilter = [] } = useActivityStatuses();
  const { data: categoriesForFilter = [] } = useCategories();
  const { data: tagsForFilter = [] } = useTags();
  const { data: usersForFilter = [] } = useUsers();
  const { data: eventPlannersForFilter = [] } = useEventPlanners();
  const { data: teamsForFilter = [] } = useTeams();
  const { data: translationLanguagesForFilter = [] } =
    useTranslationLanguages();
  const { data: translationRequiredStatusesForFilter = [] } =
    useTranslationRequiredStatuses();

  const statusArchiveIds = useMemo((): ActivityStatusArchiveIds => {
    const completed = activityStatusesForFilter.find(
      (s) => s.name === 'completed'
    );
    const deleted = activityStatusesForFilter.find((s) => s.name === 'deleted');
    return {
      completedStatusId: completed?.id,
      deletedStatusId: deleted?.id,
    };
  }, [activityStatusesForFilter]);

  const statusOptions = useMemo(
    () =>
      activityStatusesForFilter
        .filter((s) => canSeeDeleted || s.name !== 'deleted')
        .map((s) => ({
          value: String(s.id),
          label: s.displayName,
        })),
    [activityStatusesForFilter, canSeeDeleted]
  );

  const tagOptions = useMemo(
    () =>
      tagsForFilter.map((t) => ({
        value: String(t.id),
        label: t.displayName ?? t.label ?? String(t.id),
      })),
    [tagsForFilter]
  );

  const categoryOptions = useMemo(
    () =>
      categoriesForFilter
        .filter((c) => c.isActive)
        .map((c) => ({
          value: String(c.id),
          label: c.displayName ?? c.name,
        })),
    [categoriesForFilter]
  );

  const leadTeamOptions = useMemo((): LeadTeamFilterOption[] => {
    return teamsForFilter.map((t) => ({
      value: String(t.id),
      label:
        t.ministryId != null
          ? formatLeadTeamSelectLabel(t)
          : (t.displayName ?? t.name ?? String(t.id)),
      ministryId: t.ministryId ?? null,
    }));
  }, [teamsForFilter]);

  const commsContactOptions = useMemo(
    () =>
      usersForFilter.map((u) => ({
        value: String(u.id),
        label: u.name ?? u.email ?? String(u.id),
      })),
    [usersForFilter]
  );

  const eventPlannerOptions = useMemo(
    () =>
      eventPlannersForFilter.map((ep) => ({
        value: String(ep.id),
        label: ep.label ?? String(ep.id),
      })),
    [eventPlannersForFilter]
  );

  const translationOptions = useMemo(
    () =>
      translationLanguagesForFilter.map((l) => {
        const displayLabel = l.shortcode
          ? `${l.displayName} (${l.shortcode.toUpperCase()})`
          : (l.displayName ?? String(l.id));
        return { value: String(l.id), label: displayLabel };
      }),
    [translationLanguagesForFilter]
  );

  const translationStatusOptions = useMemo(
    () =>
      translationRequiredStatusesForFilter.map((s) => ({
        value: String(s.id),
        label: s.displayName ?? s.name ?? String(s.id),
      })),
    [translationRequiredStatusesForFilter]
  );

  const filterSummaryContext = useMemo(
    (): ActivityFilterSummaryContext => ({
      statusOptions,
      categoryOptions,
      tagOptions,
      leadTeamOptions,
      commsContactOptions,
      eventPlannerOptions,
      translationStatusOptions,
      translationOptions,
    }),
    [
      statusOptions,
      categoryOptions,
      tagOptions,
      leadTeamOptions,
      commsContactOptions,
      eventPlannerOptions,
      translationStatusOptions,
      translationOptions,
    ]
  );

  return {
    statusArchiveIds,
    statusOptions,
    tagOptions,
    categoryOptions,
    leadTeamOptions,
    commsContactOptions,
    eventPlannerOptions,
    translationOptions,
    translationStatusOptions,
    filterSummaryContext,
    hasActivityStatuses: activityStatusesForFilter.length > 0,
  };
}
