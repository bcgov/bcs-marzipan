import type { ActivityListItem } from '../schemas/activity-list-item.schema';
import type { ActivityResponse } from '../schemas/activity-response.schema';

/**
 * Normalized per-activity fields consumed by {@link activityMatchesFilterState}.
 *
 * This is the single shape that both the Reports server path and the Activity
 * List client path map their source records into, so the filter predicate is
 * evaluated identically regardless of origin (API response vs table row).
 *
 * All values are pre-resolved IDs / display strings; the matcher performs no
 * lookups except the optional translation-language label resolution documented
 * on {@link ActivityFilterMatchInput.translationLanguageNames}.
 */
export interface ActivityFilterMatchInput {
  id: number;
  /** Scheduled start/end as ISO strings (or null when unset). */
  startDate: string | null;
  endDate: string | null;
  /** Category display names on the activity. */
  categoryNames: string[];
  activityStatusId: number;
  /** Pitch required status display name (or null). */
  pitchRequiredStatusName: string | null;
  /** Pitch (panel) date as an ISO string, or null when not scheduled. */
  pitchDate: string | null;
  lookAheadStatus: string | null;
  lookAheadSection: string | null;
  /** Date confirmation status name (matched case-insensitively against confirmed labels). */
  dateStatusName: string;
  /** Time confirmation status name (matched case-insensitively against confirmed labels). */
  timeStatusName: string;
  tagIds: number[];
  leadMinistryId: number | null;
  leadOrgId: number | null;
  commsContactLeadUserId: number | null;
  eventPlannerLeadIds: number[];
  translationsRequiredStatusId: number | null;
  /**
   * Display labels of the activity's required translation languages.
   * Used to evaluate the language dimension when `translationLanguageIds` is
   * unavailable, by resolving the filter's language IDs to labels via
   * {@link ActivityFilterMatchOptions.translationLanguageLabelById}.
   */
  translationLanguageNames: string[];
  /**
   * Direct translation-language IDs when the source can provide them.
   * Preferred over name resolution; when present the matcher compares IDs.
   */
  translationLanguageIds?: number[] | null;
}

/** Activity list/report row or full response — fields needed for filter matching. */
export type ActivityFilterSource = ActivityListItem | ActivityResponse;

/**
 * Maps an activity list/report row or full response to the shared filter-match input.
 * Used by the Reports server path and any consumer holding the API response.
 */
export function activityResponseToFilterMatchInput(
  activity: ActivityFilterSource
): ActivityFilterMatchInput {
  const commsLead = activity.commsContacts.find((c) => c.isLead);
  return {
    id: activity.id,
    startDate: activity.startDate,
    endDate: activity.endDate,
    categoryNames: activity.category,
    activityStatusId: activity.activityStatusId,
    pitchRequiredStatusName: activity.pitchRequiredStatus ?? null,
    pitchDate: activity.pitchDate ?? null,
    lookAheadStatus: activity.lookAheadStatus ?? null,
    lookAheadSection: activity.lookAheadSection ?? null,
    dateStatusName: activity.dateStatus ?? '',
    timeStatusName: activity.timeStatus ?? '',
    tagIds: activity.tags.map((t) => t.id),
    leadMinistryId: activity.leadMinistryId ?? null,
    leadOrgId: activity.leadOrgId ?? null,
    commsContactLeadUserId: commsLead?.userId ?? null,
    eventPlannerLeadIds: activity.eventPlannerLeadIds ?? [],
    translationsRequiredStatusId: activity.translationsRequiredStatusId ?? null,
    translationLanguageNames: activity.translationsRequired ?? [],
  };
}
