import {
  and,
  eq,
  exists,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  ne,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import {
  activities,
  activityCategories,
  activityCommsContacts,
  activityEventPlanners,
  activityFlags,
  activitySharedWithTeams,
  activityTags,
  activityTranslationsRequired,
  dateStatuses,
  pitchRequiredStatuses,
  timeStatuses,
  venueAddresses,
} from '@corpcal/database/schema';
import { CONFIRMED_STATUS_NAMES } from '@corpcal/shared';
import type { FilterActivitiesQueryParams } from '@corpcal/shared/schemas';

import type { DatabaseService } from '../../database/database.service';
import type { DataScope } from '../../policy/dto/user-context.dto';

function lowerTrimMatch(column: unknown, value: string): SQL {
  return sql`lower(trim(${column})) = ${value.toLowerCase().trim()}`;
}

function buildConfirmedStatusMatch(
  db: DatabaseService['db'],
  statusIdColumn:
    | typeof activities.dateStatusId
    | typeof activities.timeStatusId,
  statusTable: typeof dateStatuses | typeof timeStatuses,
  wantConfirmed: boolean
): SQL {
  const confirmedParts = CONFIRMED_STATUS_NAMES.flatMap((confirmedName) => [
    sql`lower(trim(${statusTable.name})) = ${confirmedName}`,
    sql`lower(trim(${statusTable.displayName})) = ${confirmedName}`,
  ]);
  const confirmedMatch = or(...confirmedParts)!;
  if (wantConfirmed) {
    return exists(
      db
        .select({ one: sql`1` })
        .from(statusTable)
        .where(and(eq(statusTable.id, statusIdColumn), confirmedMatch))
    );
  }
  return or(
    isNull(statusIdColumn),
    exists(
      db
        .select({ one: sql`1` })
        .from(statusTable)
        .where(
          and(eq(statusTable.id, statusIdColumn), sql`NOT (${confirmedMatch})`)
        )
    )
  )!;
}

export interface BuildActivityFindAllConditionsOptions {
  filters: FilterActivitiesQueryParams;
  deletedStatusId: number | undefined;
  completedStatusId: number | undefined;
  allowIncludeDeleted: boolean;
  db: DatabaseService['db'];
  /** Resolved request data scope; visibility is enforced unless bypass is true. */
  dataScope: DataScope;
}

/**
 * SQL condition matching {@link ActivitiesService.getVisibleActivityIdsForTeams}:
 * global activities for all users; team activities when lead team or shared-with matches.
 */
export function buildActivityVisibilityCondition(
  db: DatabaseService['db'],
  teamIds: number[]
): SQL {
  const globalVisible = eq(activities.visibility, 'global');

  if (teamIds.length === 0) {
    return globalVisible;
  }

  const teamLeadVisible = and(
    eq(activities.visibility, 'team'),
    inArray(activities.leadTeamId, teamIds)
  )!;

  const teamSharedVisible = and(
    eq(activities.visibility, 'team'),
    exists(
      db
        .select({ one: sql`1` })
        .from(activitySharedWithTeams)
        .where(
          and(
            eq(activitySharedWithTeams.activityId, activities.id),
            inArray(activitySharedWithTeams.teamId, teamIds),
            eq(activitySharedWithTeams.isActive, true)
          )
        )
    )
  )!;

  return or(globalVisible, teamLeadVisible, teamSharedVisible)!;
}

/**
 * Overlap conditions for `startDateFrom` / `startDateTo` windows:
 * `activity.end >= windowStart` AND `activity.start <= windowEnd`.
 * When `scheduledDateRangeOverlaps` is true, both activity dates must be set.
 * Otherwise missing `endDate` is treated as single-day (`COALESCE(end, start)`).
 */
export function buildScheduledWindowOverlapConditions(
  filters: FilterActivitiesQueryParams
): SQL[] {
  const hasLower =
    filters.startDateFrom != null && filters.startDateFrom !== '';
  const hasUpper = filters.startDateTo != null && filters.startDateTo !== '';
  const requireFullSpan = filters.scheduledDateRangeOverlaps === true;
  if (!hasLower && !hasUpper) {
    return requireFullSpan
      ? [isNotNull(activities.startDate), isNotNull(activities.endDate)]
      : [];
  }
  const result: SQL[] = [];

  result.push(isNotNull(activities.startDate));

  if (requireFullSpan) {
    result.push(isNotNull(activities.endDate));
  }

  if (hasLower) {
    if (requireFullSpan) {
      result.push(gte(activities.endDate, filters.startDateFrom!));
    } else {
      result.push(
        gte(
          sql`COALESCE(${activities.endDate}, ${activities.startDate})`,
          filters.startDateFrom!
        )
      );
    }
  }

  if (hasUpper) {
    result.push(lte(activities.startDate, filters.startDateTo!));
  }

  return result;
}

/**
 * Builds SQL WHERE conditions for {@link ActivitiesService.findAll}.
 * Array params use OR semantics; scheduled date windows use span overlap.
 *
 * This SQL builder is the Reports/list API implementation. Its behavioral
 * specification (dimension semantics, AND across / OR within) is documented and
 * unit-tested in `packages/shared/src/filters/activity-filter-match.ts`
 * (`activityMatchesFilterState`). Keep the two in sync when changing filter rules.
 */
export function buildActivityFindAllConditions(
  options: BuildActivityFindAllConditionsOptions
): SQL[] {
  const {
    filters,
    deletedStatusId,
    completedStatusId,
    allowIncludeDeleted,
    db,
    dataScope,
  } = options;
  const conditions: SQL[] = [];

  if (filters.title) {
    conditions.push(eq(activities.title, filters.title));
  }

  if (
    filters.activityStatusIds != null &&
    filters.activityStatusIds.length > 0
  ) {
    conditions.push(
      inArray(activities.activityStatusId, filters.activityStatusIds)
    );
  } else {
    if (!allowIncludeDeleted && deletedStatusId !== undefined) {
      conditions.push(ne(activities.activityStatusId, deletedStatusId));
    }
    if (filters.includeCompleted !== true && completedStatusId !== undefined) {
      conditions.push(ne(activities.activityStatusId, completedStatusId));
    }
  }

  if (filters.isIssue !== undefined) {
    conditions.push(eq(activities.isIssue, filters.isIssue));
  }

  if (filters.leadTeamIds != null && filters.leadTeamIds.length > 0) {
    conditions.push(inArray(activities.leadTeamId, filters.leadTeamIds));
  }

  if (
    filters.lookAheadStatusValues != null &&
    filters.lookAheadStatusValues.length > 0
  ) {
    conditions.push(
      inArray(activities.lookAheadStatus, filters.lookAheadStatusValues)
    );
  }

  if (
    filters.lookAheadSectionValues != null &&
    filters.lookAheadSectionValues.length > 0
  ) {
    conditions.push(
      inArray(activities.lookAheadSection, filters.lookAheadSectionValues)
    );
  }

  if (
    filters.translationRequiredStatusIds != null &&
    filters.translationRequiredStatusIds.length > 0
  ) {
    conditions.push(
      inArray(
        activities.translationsRequiredStatusId,
        filters.translationRequiredStatusIds
      )
    );
  }

  const scheduledWindowConditions =
    buildScheduledWindowOverlapConditions(filters);
  conditions.push(...scheduledWindowConditions);

  if (filters.endDateFrom) {
    conditions.push(gte(activities.endDate, filters.endDateFrom));
  }
  if (filters.endDateTo) {
    conditions.push(lte(activities.endDate, filters.endDateTo));
  }

  if (filters.pitchDateNotScheduled === true) {
    conditions.push(sql`${activities.pitchDate} IS NULL`);
  } else if (filters.pitchDateScheduled === true) {
    conditions.push(isNotNull(activities.pitchDate));
  } else {
    if (filters.pitchDateFrom) {
      conditions.push(gte(activities.pitchDate, filters.pitchDateFrom));
    }
    if (filters.pitchDateTo) {
      conditions.push(lte(activities.pitchDate, filters.pitchDateTo));
    }
  }

  if (filters.dateConfirmedFilter === 'confirmed') {
    conditions.push(
      buildConfirmedStatusMatch(db, activities.dateStatusId, dateStatuses, true)
    );
  } else if (filters.dateConfirmedFilter === 'not_confirmed') {
    conditions.push(
      buildConfirmedStatusMatch(
        db,
        activities.dateStatusId,
        dateStatuses,
        false
      )
    );
  }

  if (filters.timeConfirmedFilter === 'confirmed') {
    conditions.push(
      buildConfirmedStatusMatch(db, activities.timeStatusId, timeStatuses, true)
    );
  } else if (filters.timeConfirmedFilter === 'not_confirmed') {
    conditions.push(
      buildConfirmedStatusMatch(
        db,
        activities.timeStatusId,
        timeStatuses,
        false
      )
    );
  }

  if (filters.city !== undefined) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(venueAddresses)
          .where(
            and(
              eq(venueAddresses.activityId, activities.id),
              eq(venueAddresses.city, filters.city)
            )
          )
      )
    );
  }

  if (
    filters.commsContactLeadUserIds != null &&
    filters.commsContactLeadUserIds.length > 0
  ) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(activityCommsContacts)
          .where(
            and(
              eq(activityCommsContacts.activityId, activities.id),
              inArray(
                activityCommsContacts.userId,
                filters.commsContactLeadUserIds
              ),
              eq(activityCommsContacts.isLead, true),
              eq(activityCommsContacts.isActive, true)
            )
          )
      )
    );
  }

  if (
    filters.flagAssigneeUserIds != null &&
    filters.flagAssigneeUserIds.length > 0
  ) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(activityFlags)
          .where(
            and(
              eq(activityFlags.activityId, activities.id),
              inArray(activityFlags.assigneeId, filters.flagAssigneeUserIds)
            )
          )
      )
    );
  }

  if (
    filters.sharedWithTeamIds != null &&
    filters.sharedWithTeamIds.length > 0
  ) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(activitySharedWithTeams)
          .where(
            and(
              eq(activitySharedWithTeams.activityId, activities.id),
              inArray(
                activitySharedWithTeams.teamId,
                filters.sharedWithTeamIds
              ),
              eq(activitySharedWithTeams.isActive, true)
            )
          )
      )
    );
  }

  if (filters.tagIds != null && filters.tagIds.length > 0) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(activityTags)
          .where(
            and(
              eq(activityTags.activityId, activities.id),
              inArray(activityTags.tagId, filters.tagIds),
              eq(activityTags.isActive, true)
            )
          )
      )
    );
  }

  if (filters.categoryIds != null && filters.categoryIds.length > 0) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(activityCategories)
          .where(
            and(
              eq(activityCategories.activityId, activities.id),
              inArray(activityCategories.categoryId, filters.categoryIds),
              eq(activityCategories.isActive, true)
            )
          )
      )
    );
  }

  if (
    filters.eventPlannerLeadIds != null &&
    filters.eventPlannerLeadIds.length > 0
  ) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(activityEventPlanners)
          .where(
            and(
              eq(activityEventPlanners.activityId, activities.id),
              inArray(
                activityEventPlanners.eventPlannerId,
                filters.eventPlannerLeadIds
              ),
              eq(activityEventPlanners.isLead, true),
              eq(activityEventPlanners.isActive, true)
            )
          )
      )
    );
  }

  if (
    filters.translationLanguageIds != null &&
    filters.translationLanguageIds.length > 0
  ) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(activityTranslationsRequired)
          .where(
            and(
              eq(activityTranslationsRequired.activityId, activities.id),
              inArray(
                activityTranslationsRequired.languageId,
                filters.translationLanguageIds
              ),
              eq(activityTranslationsRequired.isActive, true)
            )
          )
      )
    );
  }

  if (
    filters.pitchRequiredStatusNames != null &&
    filters.pitchRequiredStatusNames.length > 0
  ) {
    const pitchMatches = filters.pitchRequiredStatusNames.map((name) =>
      or(
        lowerTrimMatch(pitchRequiredStatuses.displayName, name),
        lowerTrimMatch(pitchRequiredStatuses.name, name)
      )
    );
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(pitchRequiredStatuses)
          .where(
            and(
              eq(pitchRequiredStatuses.id, activities.pitchRequiredStatusId),
              or(...pitchMatches)
            )
          )
      )
    );
  }

  if (!dataScope.bypass) {
    conditions.push(buildActivityVisibilityCondition(db, dataScope.teamIds));
  }

  return conditions;
}

export function hasActivityFindAllFilterFields(
  query: Partial<FilterActivitiesQueryParams>
): boolean {
  return (
    query.title !== undefined ||
    query.startDateFrom !== undefined ||
    query.startDateTo !== undefined ||
    query.endDateFrom !== undefined ||
    query.endDateTo !== undefined ||
    query.scheduledDateRangeOverlaps === true ||
    (query.activityStatusIds != null && query.activityStatusIds.length > 0) ||
    (query.leadTeamIds != null && query.leadTeamIds.length > 0) ||
    (query.commsContactLeadUserIds != null &&
      query.commsContactLeadUserIds.length > 0) ||
    (query.flagAssigneeUserIds != null &&
      query.flagAssigneeUserIds.length > 0) ||
    (query.sharedWithTeamIds != null && query.sharedWithTeamIds.length > 0) ||
    (query.tagIds != null && query.tagIds.length > 0) ||
    (query.categoryIds != null && query.categoryIds.length > 0) ||
    (query.translationRequiredStatusIds != null &&
      query.translationRequiredStatusIds.length > 0) ||
    (query.translationLanguageIds != null &&
      query.translationLanguageIds.length > 0) ||
    (query.pitchRequiredStatusNames != null &&
      query.pitchRequiredStatusNames.length > 0) ||
    (query.lookAheadStatusValues != null &&
      query.lookAheadStatusValues.length > 0) ||
    (query.lookAheadSectionValues != null &&
      query.lookAheadSectionValues.length > 0) ||
    query.dateConfirmedFilter !== undefined ||
    query.timeConfirmedFilter !== undefined ||
    query.pitchDateNotScheduled === true ||
    query.pitchDateScheduled === true ||
    query.pitchDateFrom !== undefined ||
    query.pitchDateTo !== undefined ||
    query.city !== undefined ||
    query.isIssue !== undefined ||
    query.includeCompleted !== undefined ||
    query.includeDeleted !== undefined
  );
}
