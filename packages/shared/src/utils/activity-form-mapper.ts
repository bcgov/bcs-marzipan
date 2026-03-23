import type { ActivityResponse } from '../schemas/activity-response.schema';
import type { ActivityFormData } from '../schemas/activity.schema';

/**
 * Optional lookups to resolve response display names to IDs for form fields.
 * Pass these when mapping an ActivityResponse to form data so junction arrays are populated.
 */
export interface MapResponseToFormDataLookups {
  categoryNameToId?: (name: string) => number | undefined;
  commsMaterialNameToId?: (name: string) => number | undefined;
  translationLanguageNameToId?: (name: string) => number | undefined;
  sharedWithTeamNameToId?: (name: string) => number | undefined;
}

/**
 * Maps an API ActivityResponse to ActivityFormData for use in edit forms.
 * Response has computed fields (e.g. category names, tag objects); form expects IDs and request shape.
 * When lookups are provided, name-based arrays are resolved to ID arrays.
 */
export function mapResponseToFormData(
  response: ActivityResponse,
  lookups?: MapResponseToFormDataLookups
): ActivityFormData {
  const categoryIds =
    lookups?.categoryNameToId && response.category?.length > 0
      ? response.category
          .map((name) => lookups.categoryNameToId?.(name))
          .filter((id): id is number => id !== undefined)
      : undefined;

  const tagIds =
    response.tags?.length > 0 ? response.tags.map((t) => t.id) : undefined;

  const commsMaterialIds =
    lookups?.commsMaterialNameToId && response.commsMaterials?.length > 0
      ? response.commsMaterials
          .map((name) => lookups.commsMaterialNameToId?.(name))
          .filter((id): id is number => id !== undefined)
      : undefined;

  const translationLanguageIds =
    lookups?.translationLanguageNameToId &&
    response.translationsRequired?.length > 0
      ? response.translationsRequired
          .map((name) => lookups.translationLanguageNameToId?.(name))
          .filter((id): id is number => id !== undefined)
      : undefined;

  const sharedWithTeamIds =
    lookups?.sharedWithTeamNameToId && response.sharedWith?.length > 0
      ? response.sharedWith
          .map((name) => lookups.sharedWithTeamNameToId?.(name))
          .filter((id): id is number => id !== undefined)
      : undefined;

  const representatives =
    response.representativesAttending?.length > 0
      ? response.representativesAttending.map((name) => ({
          representativeName: name,
        }))
      : undefined;

  const reportSettings =
    response.reportSettings?.length > 0
      ? response.reportSettings.map((rs) => ({
          reportId: rs.id,
          omitted: rs.omitted,
        }))
      : undefined;

  const commsContacts =
    response.commsContacts?.length > 0
      ? response.commsContacts.map((c) => ({
          userId: c.userId,
          isLead: c.isLead,
        }))
      : undefined;

  const eventPlanners =
    response.eventPlannerDetails?.length > 0
      ? response.eventPlannerDetails.map((d) => ({
          eventPlannerId: d.eventPlannerId ?? undefined,
          eventPlannerName: d.eventPlannerName ?? undefined,
          isLead: d.isLead,
        }))
      : response.eventPlanners?.length > 0
        ? response.eventPlanners.map((name, i) => ({
            eventPlannerName: name,
            isLead: i === 0,
          }))
        : undefined;

  return {
    title: response.title,
    summary: response.summary,
    significance: response.significance ?? undefined,
    schedulingNotes: response.schedulingNotes ?? undefined,
    strategy: response.strategy ?? undefined,
    dateStatusId: response.dateStatusId,
    timeStatusId: response.timeStatusId,
    venueStatusId: response.venueStatusId ?? undefined,
    activityStatusId: response.activityStatusId,
    isIssue: response.isIssue,
    isAllDay: response.isAllDay,
    isConfidential: response.isConfidential,
    visibility: response.visibility,
    startDate: response.startDate ?? undefined,
    endDate: response.endDate ?? undefined,
    startTime: response.startTime ?? undefined,
    endTime: response.endTime ?? undefined,
    pitchRequiredStatusId: response.pitchRequiredStatusId ?? undefined,
    translationsRequiredStatusId:
      response.translationsRequiredStatusId ?? undefined,
    pitchDate: response.pitchDate ?? undefined,
    notes: response.notes ?? undefined,
    executiveSummary: response.executiveSummary ?? undefined,
    lookAheadStatus: response.lookAheadStatus ?? undefined,
    lookAheadSection: response.lookAheadSection ?? undefined,
    leadOrgId: response.leadOrgId ?? undefined,
    leadOrgName: response.leadOrgName ?? undefined,
    newsReleaseId: response.newsReleaseId ?? undefined,
    newsReleaseOriginId: response.newsReleaseOriginId ?? undefined,
    leadTeamId: response.leadTeamId ?? 0,
    leadMinistryId: response.leadMinistryId ?? undefined,
    eventPlanners: eventPlanners?.length ? eventPlanners : undefined,
    newsReleaseDistributionId: response.newsReleaseDistributionId ?? undefined,
    premierRequestedId: response.premierRequestedId ?? undefined,
    categoryIds: categoryIds?.length ? categoryIds : [],
    tagIds: tagIds?.length ? tagIds : undefined,
    commsMaterialIds: commsMaterialIds?.length ? commsMaterialIds : undefined,
    translationLanguageIds: translationLanguageIds?.length
      ? translationLanguageIds
      : undefined,
    representatives: representatives?.length ? representatives : undefined,
    sharedWithTeamIds: sharedWithTeamIds?.length
      ? sharedWithTeamIds
      : undefined,
    commsContacts: commsContacts?.length ? commsContacts : undefined,
    reportSettings: reportSettings?.length ? reportSettings : undefined,
    venueAddress: response.venueAddress ?? undefined,
  };
}
