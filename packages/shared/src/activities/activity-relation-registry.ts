import type { ReportDataQueryParams } from '../schemas/query-params.schema';

/**
 * Maintenance: when adding a report field, list table column, or filter dimension
 * that needs joined data, update `REPORT_FIELD_RELATIONS`, `relationsForQueryFilters`,
 * and (for list) `SEARCH_ACTIVITY_RELATION_KEYS`, `LIST_FILTER_RELATION_KEYS`,
 * or `LIST_TABLE_DISPLAY_RELATION_KEYS` (unioned into `LIST_ACTIVITY_RELATION_KEYS`).
 * See `packages/shared/src/filters/README.md` for filter predicate changes.
 */

/** Keys matching batch fetchers in ActivityDataFetcherService / fetchRelatedForActivityIds. */
export const ACTIVITY_RELATION_KEYS = [
  'categories',
  'tags',
  'activityStatus',
  'dateStatus',
  'timeStatus',
  'venueStatus',
  'venueAddress',
  'commsMaterials',
  'translationsRequired',
  'representativesAttending',
  'sharedWith',
  'commsContacts',
  'leadOrg',
  'eventPlannerDetails',
  'newsReleaseOrigin',
  'newsReleaseDistribution',
  'premierRequested',
  'reportSettings',
  'pitchRequiredStatus',
  'translationsRequiredStatus',
  'leadMinistry',
  'leadMinistryAbbreviation',
  'leadTeamDisplay',
] as const;

export type ActivityRelationKey = (typeof ACTIVITY_RELATION_KEYS)[number];

export const ALL_ACTIVITY_RELATION_KEYS: ReadonlySet<ActivityRelationKey> =
  new Set(ACTIVITY_RELATION_KEYS);

/** Relations required when keyword search is active (see activity-searchable-text). */
export const SEARCH_ACTIVITY_RELATION_KEYS: ReadonlySet<ActivityRelationKey> =
  new Set([
    'categories',
    'tags',
    'commsContacts',
    'eventPlannerDetails',
    'venueAddress',
    'activityStatus',
    'representativesAttending',
    'leadMinistry',
    'leadMinistryAbbreviation',
    'leadOrg',
  ]);

/**
 * Relations required for client-side filter dimensions not covered by
 * {@link SEARCH_ACTIVITY_RELATION_KEYS} (see activity-filter-match-input).
 */
export const LIST_FILTER_RELATION_KEYS: ReadonlySet<ActivityRelationKey> =
  new Set([
    'dateStatus',
    'timeStatus',
    'translationsRequired',
    'translationsRequiredStatus',
    'pitchRequiredStatus',
  ]);

/** Relations required for list table UI columns not covered by filter/search keys alone. */
export const LIST_TABLE_DISPLAY_RELATION_KEYS: ReadonlySet<ActivityRelationKey> =
  new Set(['commsMaterials', 'premierRequested']);

/** Unions relation key sets (used to build list hydration without drift). */
export function unionActivityRelationKeys(
  ...sets: ReadonlyArray<ReadonlySet<ActivityRelationKey>>
): ReadonlySet<ActivityRelationKey> {
  const result = new Set<ActivityRelationKey>();
  for (const set of sets) {
    for (const key of set) {
      result.add(key);
    }
  }
  return result;
}

/**
 * Activity list `findAll` hydration: search + client filter + table display.
 * Keep in sync with `HYDRATION_PROFILES.list` and `activity-searchable-text`.
 */
export const LIST_ACTIVITY_RELATION_KEYS: ReadonlySet<ActivityRelationKey> =
  unionActivityRelationKeys(
    SEARCH_ACTIVITY_RELATION_KEYS,
    LIST_FILTER_RELATION_KEYS,
    LIST_TABLE_DISPLAY_RELATION_KEYS
  );

/**
 * Maps report field keys (from report config / custom report) to relation fetchers.
 * Base-row fields (title, dates, lookAhead, etc.) need no extra joins.
 */
const REPORT_FIELD_RELATIONS: Readonly<
  Record<string, readonly ActivityRelationKey[]>
> = {
  category: ['categories'],
  tags: ['tags'],
  activityStatus: ['activityStatus'],
  dateStatus: ['dateStatus'],
  timeStatus: ['timeStatus'],
  venueStatus: ['venueStatus'],
  venueAddress: ['venueAddress'],
  venue: ['venueAddress'],
  commsMaterials: ['commsMaterials'],
  translationsRequired: ['translationsRequired', 'translationsRequiredStatus'],
  translationsRequiredStatus: ['translationsRequiredStatus'],
  representativesAttending: ['representativesAttending'],
  activityRepresentatives: ['representativesAttending'],
  sharedWith: ['sharedWith'],
  commsContact: ['commsContacts'],
  commsContacts: ['commsContacts'],
  event_lead: ['commsContacts'],
  eventLead: ['commsContacts'],
  eventPlanners: ['eventPlannerDetails'],
  eventPlannerDetails: ['eventPlannerDetails'],
  newsReleaseOrigin: ['newsReleaseOrigin'],
  newsReleaseDistribution: ['newsReleaseDistribution'],
  premierRequested: ['premierRequested'],
  pitchRequiredStatus: ['pitchRequiredStatus'],
  pitchDate: ['pitchRequiredStatus'],
  leadOrg: ['leadOrg'],
  leadMinistry: ['leadMinistry', 'leadMinistryAbbreviation'],
  leadMinistryAbbreviation: ['leadMinistryAbbreviation'],
  leadTeamDisplayName: ['leadTeamDisplay'],
  strategy: [],
  significance: [],
  schedulingNotes: [],
  notes: [],
  summary: [],
  executiveSummary: [],
  title: [],
  displayId: [],
  startDate: [],
  endDate: [],
  startTime: [],
  endTime: [],
  isConfidential: [],
  isIssue: [],
  lookAheadStatus: [],
  lookAheadSection: [],
  lastUpdatedDateTime: [],
};

function addRelations(
  target: Set<ActivityRelationKey>,
  keys: readonly ActivityRelationKey[]
): void {
  for (const key of keys) {
    target.add(key);
  }
}

export function relationsForReportFieldKeys(
  fieldKeys: readonly string[]
): Set<ActivityRelationKey> {
  const result = new Set<ActivityRelationKey>();
  for (const field of fieldKeys) {
    const mapped = REPORT_FIELD_RELATIONS[field];
    if (mapped) {
      addRelations(result, mapped);
    }
  }
  return result;
}

/** Maps active report/list query filter params to relation fetchers. */
export function relationsForQueryFilters(
  query: Partial<ReportDataQueryParams>
): Set<ActivityRelationKey> {
  const result = new Set<ActivityRelationKey>();

  if (query.activityStatusIds != null && query.activityStatusIds.length > 0) {
    addRelations(result, ['activityStatus']);
  }
  if (query.tagIds != null && query.tagIds.length > 0) {
    addRelations(result, ['tags']);
  }
  if (query.categoryIds != null && query.categoryIds.length > 0) {
    addRelations(result, ['categories']);
  }
  if (
    query.commsContactLeadUserIds != null &&
    query.commsContactLeadUserIds.length > 0
  ) {
    addRelations(result, ['commsContacts']);
  }
  if (
    query.eventPlannerLeadIds != null &&
    query.eventPlannerLeadIds.length > 0
  ) {
    addRelations(result, ['eventPlannerDetails']);
  }
  if (query.leadMinistryIds != null && query.leadMinistryIds.length > 0) {
    addRelations(result, ['leadMinistry', 'leadMinistryAbbreviation']);
  }
  if (query.leadOrgIds != null && query.leadOrgIds.length > 0) {
    addRelations(result, ['leadOrg']);
  }
  if (
    query.translationRequiredStatusIds != null &&
    query.translationRequiredStatusIds.length > 0
  ) {
    addRelations(result, ['translationsRequiredStatus']);
  }
  if (
    query.translationLanguageIds != null &&
    query.translationLanguageIds.length > 0
  ) {
    addRelations(result, ['translationsRequired']);
  }
  if (
    query.pitchRequiredStatusNames != null &&
    query.pitchRequiredStatusNames.length > 0
  ) {
    addRelations(result, ['pitchRequiredStatus']);
  }
  if (
    query.lookAheadStatusValues != null &&
    query.lookAheadStatusValues.length > 0
  ) {
    // lookAhead fields are on the activities row
  }
  if (
    query.lookAheadSectionValues != null &&
    query.lookAheadSectionValues.length > 0
  ) {
    // lookAhead fields are on the activities row
  }
  if (
    query.dateConfirmedFilter != null &&
    query.dateConfirmedFilter !== 'any'
  ) {
    addRelations(result, ['dateStatus']);
  }
  if (
    query.timeConfirmedFilter != null &&
    query.timeConfirmedFilter !== 'any'
  ) {
    addRelations(result, ['timeStatus']);
  }
  if (
    query.pitchDateNotScheduled === true ||
    query.pitchDateScheduled === true ||
    query.pitchDateFrom != null ||
    query.pitchDateTo != null
  ) {
    addRelations(result, ['pitchRequiredStatus']);
  }

  return result;
}

export function relationsForSearchKeyword(
  search: string | undefined
): Set<ActivityRelationKey> {
  if ((search ?? '').trim() === '') {
    return new Set();
  }
  return new Set(SEARCH_ACTIVITY_RELATION_KEYS);
}
