import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte, inArray, lte, ne, type SQL } from 'drizzle-orm';

import {
  activities,
  activityCategories,
  activityCommsContacts,
  activityCommsMaterials,
  activityReportSettings,
  activityRepresentatives,
  activitySharedWithTeams,
  activityStatuses,
  activityTags,
  activityThemes,
  activityTranslationsRequired,
  categories,
  ministries,
  teams,
  userTeams,
  venueAddresses,
} from '@corpcal/database/schema';
import type { Activity, Category } from '@corpcal/database/types';
import {
  PERMISSIONS,
  SYSTEM_ROLES,
  type ActivityStatusName,
} from '@corpcal/shared';
import type {
  ActivityResponse,
  CreateActivityRequest,
  FilterActivitiesQueryParams,
  UpdateActivityRequest,
  VenueAddress,
  VenueAddressBase,
} from '@corpcal/shared/schemas';
import { isDeepEqual } from '@corpcal/shared/utils';

import type { Database } from '../../database/database.provider';
import { DatabaseService } from '../../database/database.service';
import { LocksService } from '../../locks/locks.service';
import { getVisibleCategoryIds } from '../../policy/category-scoping.helper';
import type {
  DataScope,
  RequestContext as RequestContextType,
} from '../../policy/dto/user-context.dto';
import { ActivitiesGateway } from '../activities.gateway';
import { ActivityDataFetcherService } from './activity-data-fetcher.service';
import { ActivityHistoryService } from './activity-history.service';
import { ActivityJunctionService } from './activity-junction.service';
import { ActivityMapperService } from './activity-mapper.service';
import { ActivityUtilsService } from './activity-utils.service';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly activitiesGateway: ActivitiesGateway,
    private readonly activityHistoryService: ActivityHistoryService,
    private readonly junctionService: ActivityJunctionService,
    private readonly dataFetcherService: ActivityDataFetcherService,
    private readonly mapperService: ActivityMapperService,
    private readonly utilsService: ActivityUtilsService,
    private readonly locksService: LocksService
  ) {}

  /**
   * Normalize venue address data by trimming whitespace and converting empty strings to null.
   * This prevents false change detection due to whitespace differences.
   *
   * @param venue - Venue address data to normalize
   * @returns Normalized venue address with trimmed strings and empty strings as null
   */
  private normalizeVenueAddress(
    venue: VenueAddressBase | null | undefined
  ): VenueAddressBase | null {
    if (!venue) {
      return null;
    }

    return {
      venueName:
        typeof venue.venueName === 'string'
          ? venue.venueName.trim() || null
          : (venue.venueName ?? null),
      street:
        typeof venue.street === 'string'
          ? venue.street.trim() || null
          : (venue.street ?? null),
      city:
        typeof venue.city === 'string'
          ? venue.city.trim() || null
          : (venue.city ?? null),
      provinceOrState:
        typeof venue.provinceOrState === 'string'
          ? venue.provinceOrState.trim() || null
          : (venue.provinceOrState ?? null),
      country:
        typeof venue.country === 'string'
          ? venue.country.trim() || null
          : (venue.country ?? null),
    };
  }

  /**
   * Fetch all related data (categories, tags, statuses, etc.) for the given activity IDs.
   * Used by mapToResponseDto (bulk), findOne, update, requestDelete, and restore.
   */
  private async fetchRelatedForActivityIds(
    activityIds: number[],
    activityRows: Activity[]
  ) {
    const [
      categoriesResult,
      tagsMap,
      activityStatusesMap,
      dateStatusesMap,
      timeStatusesMap,
      venueAddressesMap,
      commsMaterialsMap,
      translationsRequiredMap,
      representativesAttendingMap,
      sharedWithMap,
      commsContactsMap,
      leadOrgNamesMap,
      eventPlannerNamesMap,
      newsReleaseOriginsMap,
      newsReleaseDistributionsMap,
      premierRequestedMap,
      reportSettingsMap,
      pitchRequiredStatusMap,
      translationsRequiredStatusMap,
      leadMinistryNamesMap,
      leadMinistryAbbreviationsMap,
    ] = await Promise.all([
      this.dataFetcherService.fetchCategoriesForActivities(activityIds),
      this.dataFetcherService.fetchTagsForActivities(activityIds),
      this.dataFetcherService.fetchActivityStatusesForActivities(activityIds),
      this.dataFetcherService.fetchDateStatusesForActivities(activityIds),
      this.dataFetcherService.fetchTimeStatusesForActivities(activityIds),
      this.dataFetcherService.fetchVenueAddressesForActivities(activityIds),
      this.dataFetcherService.fetchCommsMaterialsForActivities(activityIds),
      this.dataFetcherService.fetchTranslationsRequiredForActivities(
        activityIds
      ),
      this.dataFetcherService.fetchRepresentativesAttendingForActivities(
        activityIds
      ),
      this.dataFetcherService.fetchSharedWithTeamsForActivities(activityIds),
      this.dataFetcherService.fetchCommsContactsForActivities(activityIds),
      this.dataFetcherService.fetchLeadOrgNamesForActivities(activityRows),
      this.dataFetcherService.fetchEventPlannerNamesForActivities(activityRows),
      this.dataFetcherService.fetchNewsReleaseOriginsForActivities(activityIds),
      this.dataFetcherService.fetchNewsReleaseDistributionsForActivities(
        activityIds
      ),
      this.dataFetcherService.fetchPremierRequestedForActivities(activityIds),
      this.dataFetcherService.fetchReportSettingsForActivities(activityIds),
      this.dataFetcherService.fetchPitchRequiredStatusForActivities(
        activityIds
      ),
      this.dataFetcherService.fetchTranslationsRequiredStatusForActivities(
        activityIds
      ),
      this.dataFetcherService.fetchLeadMinistryNamesForActivities(activityIds),
      this.dataFetcherService.fetchLeadMinistryAbbreviationsForActivities(
        activityIds
      ),
    ]);
    return {
      categoriesResult,
      tagsMap,
      activityStatusesMap,
      dateStatusesMap,
      timeStatusesMap,
      venueAddressesMap,
      commsMaterialsMap,
      translationsRequiredMap,
      representativesAttendingMap,
      sharedWithMap,
      commsContactsMap,
      leadOrgNamesMap,
      eventPlannerNamesMap,
      newsReleaseOriginsMap,
      newsReleaseDistributionsMap,
      premierRequestedMap,
      reportSettingsMap,
      pitchRequiredStatusMap,
      translationsRequiredStatusMap,
      leadMinistryNamesMap,
      leadMinistryAbbreviationsMap,
    };
  }

  /**
   * Normalize representatives array by filtering valid entries and sorting consistently.
   * For comparison purposes, we normalize based on the unique identifier:
   * - If representativeId is present, we use that (ignore representativeName for lookup entries)
   * - If only representativeName is present, we use that (freeform entry)
   * This prevents false change detection from representativeName lookups.
   *
   * @param reps - Array of representatives to normalize
   * @returns Normalized array with sorted, canonical representatives for comparison
   */
  private normalizeRepresentatives(
    reps:
      | Array<{
          representativeId?: number | null;
          representativeName?: string | null;
        }>
      | undefined
  ): Array<{
    representativeId: number | null;
    representativeName: string | null;
  }> | null {
    if (!reps || !Array.isArray(reps) || reps.length === 0) {
      return null;
    }

    // Filter to only valid entries (must have at least one identifier)
    const validReps = reps
      .filter(
        (r) =>
          (typeof r.representativeId === 'number' && r.representativeId > 0) ||
          (typeof r.representativeName === 'string' &&
            r.representativeName.trim().length > 0)
      )
      .map((r) => {
        const repId =
          typeof r.representativeId === 'number' && r.representativeId > 0
            ? r.representativeId
            : null;
        const repName =
          typeof r.representativeName === 'string'
            ? r.representativeName.trim() || null
            : null;

        // For comparison: if we have a representativeId (lookup table entry),
        // set representativeName to null so that looked-up names don't cause false change detection.
        // Only keep representativeName for freeform entries (where representativeId is null).
        return {
          representativeId: repId,
          representativeName: repId ? null : repName,
        };
      });

    if (validReps.length === 0) {
      return null;
    }

    // Sort for consistent comparison: by representativeId first, then by name
    validReps.sort((a, b) => {
      if (a.representativeId && b.representativeId) {
        return a.representativeId - b.representativeId;
      }
      if (a.representativeId) return -1;
      if (b.representativeId) return 1;
      return (a.representativeName || '').localeCompare(
        b.representativeName || ''
      );
    });

    return validReps;
  }

  /**
   * Resolve activity status ID by status name (e.g. 'new', 'reviewed', 'changed').
   */
  private async getActivityStatusIdByName(
    name: ActivityStatusName
  ): Promise<number> {
    const [row] = await this.databaseService.db
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(eq(activityStatuses.name, name))
      .limit(1);
    if (!row) {
      throw new BadRequestException(
        `Activity status '${name}' not found in database`
      );
    }
    return row.id;
  }

  /**
   * Resolve activity status name by ID (for checking delete_requested/deleted).
   */
  private async getActivityStatusNameById(id: number): Promise<string | null> {
    const [row] = await this.databaseService.db
      .select({ name: activityStatuses.name })
      .from(activityStatuses)
      .where(eq(activityStatuses.id, id))
      .limit(1);
    return row?.name ?? null;
  }

  /**
   * Create a new activity with related junction table records.
   * Initial activityStatusId is set by backend: 'reviewed' if admin/sysAdmin and markAsReviewed, else 'new'.
   * Client activityStatusId is ignored.
   * When context.permissions does not include activities.create.any, leadMinistryId must be in a ministry linked to context.teamIds.
   */
  async create(
    dto: CreateActivityRequest,
    userId: number,
    context?: {
      roleName?: string;
      permissions?: string[];
      teamIds?: number[];
    }
  ): Promise<ActivityResponse> {
    // Extract junction table IDs, venue address, and status/options from the DTO
    // activityStatusId is ignored (backend sets from markAsReviewed + role)
    const {
      categoryIds,
      tagIds,
      commsMaterialIds,
      translationLanguageIds,
      sharedWithTeamIds,
      commsContacts: commsContactsArray,
      representatives,
      venueAddress,
      reportSettings: reportSettingsArray,
      activityHistoryNotes,
      activityStatusId: _activityStatusIdIgnored,
      markAsReviewed,
      ...activityData
    } = dto;

    const isAdmin =
      context?.roleName === SYSTEM_ROLES.ADMIN ||
      context?.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;
    const initialStatusName: ActivityStatusName =
      isAdmin && markAsReviewed === true ? 'reviewed' : 'new';
    const initialStatusId =
      await this.getActivityStatusIdByName(initialStatusName);

    // leadTeamId is required
    if (
      activityData.leadTeamId == null ||
      typeof activityData.leadTeamId !== 'number'
    ) {
      throw new BadRequestException('leadTeamId is required');
    }

    // Resolve lead team and derive leadMinistryId from team.ministryId
    const [leadTeam] = await this.databaseService.db
      .select({
        id: teams.id,
        name: teams.name,
        ministryId: teams.ministryId,
      })
      .from(teams)
      .where(eq(teams.id, activityData.leadTeamId))
      .limit(1);
    if (!leadTeam) {
      throw new BadRequestException(
        `Team with ID ${activityData.leadTeamId} not found`
      );
    }
    const resolvedLeadMinistryId = leadTeam.ministryId ?? null;

    // Scope: without activities.create.any, leadTeamId must be in user's teams
    const canCreateAny =
      context?.permissions?.includes(PERMISSIONS.ACTIVITIES.CREATE_ANY) ??
      false;
    if (!canCreateAny && context?.teamIds?.length) {
      if (!context.teamIds.includes(activityData.leadTeamId)) {
        throw new ForbiddenException(
          'You may only create activities for teams you belong to.'
        );
      }
    }

    // Override leadMinistryId with resolved value from team
    const activityDataWithResolvedMinistry = {
      ...activityData,
      leadMinistryId: resolvedLeadMinistryId,
    };

    // Validate category IDs if provided
    if (categoryIds && categoryIds.length > 0) {
      await this.utilsService.validateCategoryIds(categoryIds);
    }

    const now = new Date();

    // Use transaction to ensure atomicity of activity and junction table inserts
    const result = await this.databaseService.db.transaction(async (tx) => {
      // Insert activity with displayId: null (will be updated after getting activity ID)
      // activityData contains only core activity fields (junction table fields were destructured out)
      // activityStatusId is set by backend from initialStatusId (client value ignored)
      const newActivity: Omit<
        typeof activities.$inferInsert,
        | 'id'
        | 'displayId'
        | 'createdBy'
        | 'lastUpdatedBy'
        | 'createdDateTime'
        | 'lastUpdatedDateTime'
        | 'rowVersion'
      > & {
        displayId: null;
        createdBy: number;
        lastUpdatedBy: number;
        createdDateTime: Date;
        lastUpdatedDateTime: Date;
      } = {
        ...activityDataWithResolvedMinistry,
        activityStatusId: initialStatusId,
        displayId: null,
        createdBy: userId,
        lastUpdatedBy: userId,
        createdDateTime: now,
        lastUpdatedDateTime: now,
      };

      // Insert the activity
      const [created] = await tx
        .insert(activities)
        .values(newActivity)
        .returning();

      const activityId = created.id;

      // Generate displayId: use ministry abbreviation when leadMinistryId is set, else first 4 chars of team name
      let displayId: string;
      if (resolvedLeadMinistryId != null) {
        const [ministry] = await tx
          .select({ abbreviation: ministries.abbreviation })
          .from(ministries)
          .where(eq(ministries.id, resolvedLeadMinistryId))
          .limit(1);
        if (!ministry?.abbreviation) {
          throw new BadRequestException(
            `Ministry with ID ${resolvedLeadMinistryId} not found or missing abbreviation`
          );
        }
        displayId = this.utilsService.generateDisplayId(
          ministry.abbreviation,
          activityId
        );
      } else {
        const prefix = this.utilsService.getDisplayIdPrefixFromTeamName(
          leadTeam.name
        );
        displayId = this.utilsService.generateDisplayId(prefix, activityId);
      }

      // Update activity with generated displayId
      await tx
        .update(activities)
        .set({ displayId })
        .where(eq(activities.id, activityId));

      // Insert venue address if provided
      if (venueAddress) {
        const normalizedVenue = this.normalizeVenueAddress(venueAddress);
        if (normalizedVenue) {
          await this.junctionService.insertVenueAddress(
            tx,
            activityId,
            normalizedVenue as VenueAddress
          );
        }
      }

      // Insert junction table records in parallel
      await Promise.all([
        // Categories
        this.junctionService.insertJunctionRecords(
          tx,
          activityCategories,
          activityId,
          categoryIds,
          (id: number) => ({ categoryId: id }),
          userId,
          now
        ),
        // Tags
        this.junctionService.insertJunctionRecords(
          tx,
          activityTags,
          activityId,
          tagIds,
          (id: number) => ({ tagId: id }),
          userId,
          now
        ),
        // Comms Materials
        this.junctionService.insertJunctionRecords(
          tx,
          activityCommsMaterials,
          activityId,
          commsMaterialIds,
          (id: number) => ({ commsMaterialId: id }),
          userId,
          now
        ),
        // Translation Languages
        this.junctionService.insertJunctionRecords(
          tx,
          activityTranslationsRequired,
          activityId,
          translationLanguageIds,
          (id: number) => ({ languageId: id }),
          userId,
          now
        ),
        // Shared With Teams
        this.junctionService.insertJunctionRecords(
          tx,
          activitySharedWithTeams,
          activityId,
          sharedWithTeamIds,
          (id: number) => ({ teamId: id }),
          userId,
          now
        ),
        // Comms Contacts (with isLead flag)
        this.junctionService.insertCommsContacts(
          tx,
          activityId,
          commsContactsArray,
          now
        ),
        // Representatives with attending status
        this.junctionService.insertRepresentatives(
          tx,
          activityId,
          representatives,
          now
        ),
      ]);

      // Report settings - create defaults for all active reports, then apply custom settings if provided
      await this.junctionService.createDefaultReportSettings(tx, activityId);
      if (reportSettingsArray && reportSettingsArray.length > 0) {
        // Convert array format to Map for service layer
        const reportSettingsMap = new Map<number, boolean>();
        for (const setting of reportSettingsArray) {
          const reportId =
            typeof setting.reportId === 'number' ? setting.reportId : undefined;
          if (typeof reportId === 'number') {
            reportSettingsMap.set(reportId, setting.omitted);
          } else {
            // Log and skip malformed entries
            this.logger.warn(
              'create: skipping malformed reportSettings entry',
              setting
            );
          }
        }
        await this.junctionService.updateActivityReportSettings(
          tx,
          activityId,
          reportSettingsMap
        );
      }

      return created;
    });

    // Fetch the created activity with all related data
    const createdActivity = await this.findOne(result.id);

    // Record activity creation in history (include initial status)
    await this.activityHistoryService.recordChange(
      result.id,
      userId,
      'created',
      [
        {
          field: 'activityStatusId',
          oldValue: null,
          newValue: initialStatusId,
        },
      ],
      activityHistoryNotes || 'Activity created'
    );

    // Broadcast to all clients that a new activity was created
    // Only broadcast if the activity was successfully fetched
    if (createdActivity) {
      this.activitiesGateway.broadcastActivityCreated(createdActivity);
    }

    return createdActivity;
  }

  /**
   * Get activity IDs visible to the given teams via (1) comms lead user in team, (2) lead team in user's teams, or (3) lead ministry in team
   */
  private async getVisibleActivityIdsForTeams(
    teamIds: number[]
  ): Promise<Set<number>> {
    if (teamIds.length === 0) return new Set();

    const [commsLeadActivityIds, leadTeamActivityIds, leadMinistryActivityIds] =
      await Promise.all([
        this.databaseService.db
          .selectDistinct({ activityId: activityCommsContacts.activityId })
          .from(activityCommsContacts)
          .innerJoin(
            userTeams,
            eq(activityCommsContacts.userId, userTeams.userId)
          )
          .where(
            and(
              eq(activityCommsContacts.isLead, true),
              eq(activityCommsContacts.isActive, true),
              eq(userTeams.isActive, true),
              inArray(userTeams.teamId, teamIds)
            )
          )
          .then((rows) => new Set(rows.map((r) => r.activityId))),
        this.databaseService.db
          .select({ id: activities.id })
          .from(activities)
          .where(inArray(activities.leadTeamId, teamIds))
          .then((rows) => new Set(rows.map((r) => r.id))),
        this.databaseService.db
          .select({ id: activities.id })
          .from(activities)
          .innerJoin(teams, eq(activities.leadMinistryId, teams.ministryId))
          .where(inArray(teams.id, teamIds))
          .then((rows) => new Set(rows.map((r) => r.id))),
      ]);

    const visible = new Set<number>([
      ...commsLeadActivityIds,
      ...leadTeamActivityIds,
      ...leadMinistryActivityIds,
    ]);
    return visible;
  }

  /**
   * Find all activities with optional filtering
   * @param filters - Optional query filters (title, dates, status, etc.)
   * @param ctx - Request context (user + dataScope). Used to enforce includeDeleted only for Admin/System Admin.
   */
  async findAll(
    filters?: FilterActivitiesQueryParams,
    ctx?: RequestContextType
  ): Promise<ActivityResponse[]> {
    let activityResults: Activity[];

    // Resolve status IDs for default exclusions
    const [deletedStatus] = await this.databaseService.db
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(eq(activityStatuses.name, 'deleted' satisfies ActivityStatusName))
      .limit(1);
    const [completedStatus] = await this.databaseService.db
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(
        eq(activityStatuses.name, 'completed' satisfies ActivityStatusName)
      )
      .limit(1);

    const deletedStatusId = deletedStatus?.id;
    const completedStatusId = completedStatus?.id;

    const allowIncludeDeleted =
      filters?.includeDeleted === true &&
      (ctx?.user?.roleName === SYSTEM_ROLES.ADMIN ||
        ctx?.user?.roleName === SYSTEM_ROLES.SYSTEM_ADMIN);

    if (filters) {
      const conditions: SQL[] = [];
      if (filters.title) {
        conditions.push(eq(activities.title, filters.title));
      }
      if (filters.activityStatusId !== undefined) {
        conditions.push(
          eq(activities.activityStatusId, filters.activityStatusId)
        );
      } else {
        if (!allowIncludeDeleted && deletedStatusId !== undefined) {
          conditions.push(ne(activities.activityStatusId, deletedStatusId));
        }
        if (
          filters.excludeCompleted === true &&
          completedStatusId !== undefined
        ) {
          conditions.push(ne(activities.activityStatusId, completedStatusId));
        }
      }
      if (filters.isIssue !== undefined) {
        conditions.push(eq(activities.isIssue, filters.isIssue));
      }
      if (filters.leadMinistryId !== undefined) {
        conditions.push(eq(activities.leadMinistryId, filters.leadMinistryId));
      }
      if (filters.leadTeamId !== undefined) {
        conditions.push(eq(activities.leadTeamId, filters.leadTeamId));
      }
      if (filters.lookAheadSection) {
        conditions.push(
          eq(activities.lookAheadSection, filters.lookAheadSection)
        );
      }
      // Note: City filter is handled after initial query with a separate join
      // TODO: Optimize with proper join in main query
      if (filters.startDateFrom) {
        conditions.push(gte(activities.startDate, filters.startDateFrom));
      }
      if (filters.startDateTo) {
        conditions.push(lte(activities.startDate, filters.startDateTo));
      }
      if (filters.endDateFrom) {
        conditions.push(gte(activities.endDate, filters.endDateFrom));
      }
      if (filters.endDateTo) {
        conditions.push(lte(activities.endDate, filters.endDateTo));
      }
      if (conditions.length > 0) {
        activityResults = await this.databaseService.db
          .select()
          .from(activities)
          .where(and(...conditions));
      } else {
        // No other conditions: apply default status exclusions
        const statusConditions: SQL[] = [];
        if (!allowIncludeDeleted && deletedStatusId !== undefined) {
          statusConditions.push(
            ne(activities.activityStatusId, deletedStatusId)
          );
        }
        if (
          filters.excludeCompleted === true &&
          completedStatusId !== undefined
        ) {
          statusConditions.push(
            ne(activities.activityStatusId, completedStatusId)
          );
        }
        if (statusConditions.length > 0) {
          activityResults = await this.databaseService.db
            .select()
            .from(activities)
            .where(and(...statusConditions));
        } else {
          activityResults = await this.databaseService.db
            .select()
            .from(activities);
        }
      }
    } else {
      // No filters: exclude deleted only (other callers e.g. calendar may want completed)
      if (deletedStatusId !== undefined) {
        activityResults = await this.databaseService.db
          .select()
          .from(activities)
          .where(ne(activities.activityStatusId, deletedStatusId));
      } else {
        activityResults = await this.databaseService.db
          .select()
          .from(activities);
      }
    }

    // Handle city filter with proper join if needed
    if (filters && filters.city !== undefined) {
      const activitiesWithCity = await this.databaseService.db
        .select({ activityId: venueAddresses.activityId })
        .from(venueAddresses)
        .where(eq(venueAddresses.city, filters.city));

      const activityIdsWithCity = new Set(
        activitiesWithCity.map((a) => a.activityId)
      );
      activityResults = activityResults.filter((a) =>
        activityIdsWithCity.has(a.id)
      );
    }

    // Team-based data scoping: when bypass is false, restrict to activities visible to user's teams
    // (comms lead user in one of user's teams, or activity's lead ministry in one of user's teams)
    const dataScope = ctx?.dataScope;
    if (dataScope && !dataScope.bypass && dataScope.teamIds.length > 0) {
      const visibleIds = await this.getVisibleActivityIdsForTeams(
        dataScope.teamIds
      );
      activityResults = activityResults.filter((a) => visibleIds.has(a.id));
    } else if (
      dataScope &&
      !dataScope.bypass &&
      dataScope.teamIds.length === 0
    ) {
      activityResults = [];
    }

    // Fetch related data for all activities
    const activityIds = activityResults.map((a) => a.id);
    const related = await this.fetchRelatedForActivityIds(
      activityIds,
      activityResults
    );
    const { namesMap: categoriesMap, idsMap: categoryIdsMap } =
      related.categoriesResult;

    return activityResults.map((activity) =>
      this.mapperService.mapToResponseDto(activity, {
        categories: categoriesMap.get(activity.id) ?? [],
        categoryIds: categoryIdsMap.get(activity.id) ?? [],
        tags: related.tagsMap.get(activity.id) ?? [],
        activityStatus: related.activityStatusesMap.get(activity.id),
        dateStatus: related.dateStatusesMap.get(activity.id),
        timeStatus: related.timeStatusesMap.get(activity.id),
        venueAddress: related.venueAddressesMap.get(activity.id) ?? null,
        commsMaterials: related.commsMaterialsMap.get(activity.id) ?? [],
        translationsRequired:
          related.translationsRequiredMap.get(activity.id) ?? [],
        representativesAttending:
          related.representativesAttendingMap.get(activity.id) ?? [],
        sharedWith: related.sharedWithMap.get(activity.id) ?? [],
        commsContacts: related.commsContactsMap.get(activity.id) ?? [],
        eventLeadName: related.eventPlannerNamesMap.get(activity.id) ?? null,
        leadOrgName: related.leadOrgNamesMap.get(activity.id) ?? null,
        newsReleaseOrigin:
          related.newsReleaseOriginsMap.get(activity.id) ?? null,
        newsReleaseDistribution:
          related.newsReleaseDistributionsMap.get(activity.id) ?? null,
        premierRequested: related.premierRequestedMap.get(activity.id) ?? null,
        reportSettings: related.reportSettingsMap.get(activity.id) ?? [],
        pitchRequiredStatus:
          related.pitchRequiredStatusMap.get(activity.id) ?? null,
        translationsRequiredStatus:
          related.translationsRequiredStatusMap.get(activity.id) ?? null,
        leadMinistry: related.leadMinistryNamesMap.get(activity.id) ?? null,
        leadMinistryAbbreviation:
          related.leadMinistryAbbreviationsMap.get(activity.id) ?? null,
      })
    );
  }

  /**
   * Find one activity by ID. When dataScope is provided and bypass is false, returns 404 if the activity is not visible to the user's teams.
   */
  async findOne(id: number, dataScope?: DataScope): Promise<ActivityResponse> {
    const [activity] = await this.databaseService.db
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (!activity) {
      throw new NotFoundException(`Activity #${id} not found`);
    }

    if (dataScope && !dataScope.bypass) {
      if (dataScope.teamIds.length === 0) {
        throw new NotFoundException(`Activity #${id} not found`);
      }
      const visibleIds = await this.getVisibleActivityIdsForTeams(
        dataScope.teamIds
      );
      if (!visibleIds.has(id)) {
        throw new NotFoundException(`Activity #${id} not found`);
      }
    }

    // Fetch related data
    const related = await this.fetchRelatedForActivityIds([id], [activity]);
    const { namesMap: categoriesList, idsMap: categoryIdsList } =
      related.categoriesResult;

    return this.mapperService.mapToResponseDto(activity, {
      categories: categoriesList.get(id) ?? [],
      categoryIds: categoryIdsList.get(id) ?? [],
      tags: related.tagsMap.get(id) ?? [],
      activityStatus: related.activityStatusesMap.get(id),
      dateStatus: related.dateStatusesMap.get(id),
      timeStatus: related.timeStatusesMap.get(id),
      venueAddress: related.venueAddressesMap.get(id) ?? null,
      commsMaterials: related.commsMaterialsMap.get(id) ?? [],
      translationsRequired: related.translationsRequiredMap.get(id) ?? [],
      representativesAttending:
        related.representativesAttendingMap.get(id) ?? [],
      sharedWith: related.sharedWithMap.get(id) ?? [],
      commsContacts: related.commsContactsMap.get(id) ?? [],
      eventLeadName: related.eventPlannerNamesMap.get(id) ?? null,
      leadOrgName: related.leadOrgNamesMap.get(id) ?? null,
      newsReleaseOrigin: related.newsReleaseOriginsMap.get(id) ?? null,
      newsReleaseDistribution:
        related.newsReleaseDistributionsMap.get(id) ?? null,
      premierRequested: related.premierRequestedMap.get(id) ?? null,
      reportSettings: related.reportSettingsMap.get(id) ?? [],
      pitchRequiredStatus: related.pitchRequiredStatusMap.get(id) ?? null,
      translationsRequiredStatus:
        related.translationsRequiredStatusMap.get(id) ?? null,
      leadMinistry: related.leadMinistryNamesMap.get(id) ?? null,
      leadMinistryAbbreviation:
        related.leadMinistryAbbreviationsMap.get(id) ?? null,
    });
  }

  /**
   * Update an activity
   */
  async update(
    id: number,
    dto: UpdateActivityRequest,
    userId: number,
    context?: {
      roleName?: string;
      permissions?: string[];
      teamIds?: number[];
    }
  ): Promise<ActivityResponse> {
    const existingLock = await this.locksService.getLockForEntity(
      'activity',
      id
    );
    if (existingLock && existingLock.userId !== userId) {
      throw new HttpException(
        {
          statusCode: HttpStatus.LOCKED,
          message: 'This activity is being edited by another user.',
          locked: true,
          lockedBy: {
            userId: existingLock.userId,
            username: existingLock.username,
            acquiredAt: existingLock.acquiredAt,
            expiresAt: existingLock.expiresAt,
          },
        },
        HttpStatus.LOCKED
      );
    }

    // Get current activity state to track changes
    const [oldActivity] = await this.databaseService.db
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (!oldActivity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    // Reject update when activity is delete_requested or deleted
    const currentStatusName = await this.getActivityStatusNameById(
      oldActivity.activityStatusId
    );
    if (
      currentStatusName === 'delete_requested' ||
      currentStatusName === 'deleted'
    ) {
      throw new ConflictException(
        `Activity cannot be updated when status is '${currentStatusName}'. Restore the activity first.`
      );
    }

    // Extract junction table IDs and venue address from DTO; omit activityStatusId and markAsReviewed (backend sets status)
    const {
      categoryIds,
      tagIds,
      commsMaterialIds,
      translationLanguageIds,
      sharedWithTeamIds,
      commsContacts: commsContactsArray,
      representatives,
      venueAddress,
      reportSettings: reportSettingsArray,
      activityHistoryNotes,
      activityStatusId: _activityStatusIdIgnored,
      markAsReviewed: _markAsReviewedIgnored,
      ...activityUpdateData
    } = dto;

    // Compute new status: admin/sysAdmin with markAsReviewed -> reviewed, else changed. Do not use DTO activityStatusId.
    const isAdmin =
      context?.roleName === SYSTEM_ROLES.ADMIN ||
      context?.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;
    const newStatusName: ActivityStatusName =
      isAdmin && dto.markAsReviewed === true ? 'reviewed' : 'changed';
    const computedStatusId =
      await this.getActivityStatusIdByName(newStatusName);

    // Normalize venue address to prevent false change detection from whitespace differences
    const normalizedVenueAddress =
      venueAddress !== undefined
        ? this.normalizeVenueAddress(venueAddress)
        : undefined;

    // Build update payload: activityUpdateData contains only core activity fields (junction/venue were destructured out).
    // Cast is intentional: UpdateActivityRequest and Activity must stay in sync; only activity table columns are updated.
    const updateData: Partial<Activity> = {
      ...(activityUpdateData as Partial<Activity>),
      activityStatusId: computedStatusId,
      lastUpdatedDateTime: new Date(),
    };

    const now = new Date();
    // Ensure lastUpdatedBy is set for audit/history
    updateData.lastUpdatedBy = userId;

    // Capture existing related data for history (before transaction)
    const venueRows = await this.databaseService.db
      .select()
      .from(venueAddresses)
      .where(eq(venueAddresses.activityId, id))
      .limit(1);
    const existingVenue = venueRows[0] ?? null;

    const existingComms = await this.databaseService.db
      .select({
        userId: activityCommsContacts.userId,
        isLead: activityCommsContacts.isLead,
      })
      .from(activityCommsContacts)
      .where(
        and(
          eq(activityCommsContacts.activityId, id),
          eq(activityCommsContacts.isActive, true)
        )
      );

    const existingRepresentatives = await this.databaseService.db
      .select({
        representativeId: activityRepresentatives.representativeId,
        representativeName: activityRepresentatives.representativeName,
      })
      .from(activityRepresentatives)
      .where(
        and(
          eq(activityRepresentatives.activityId, id),
          eq(activityRepresentatives.isActive, true)
        )
      );

    const existingReportSettings = await this.databaseService.db
      .select({
        reportId: activityReportSettings.reportId,
        omitted: activityReportSettings.omitted,
      })
      .from(activityReportSettings)
      .where(eq(activityReportSettings.activityId, id));

    // When leadTeamId is being updated, validate scoping
    if (
      dto.leadTeamId !== undefined &&
      context?.permissions &&
      !context.permissions.includes(PERMISSIONS.ACTIVITIES.CREATE_ANY) &&
      context.teamIds?.length
    ) {
      if (!context.teamIds.includes(dto.leadTeamId)) {
        throw new ForbiddenException(
          'You may only set lead team to a team you belong to.'
        );
      }
    }

    // Use transaction to ensure atomicity of activity and junction table updates
    const updated = await this.databaseService.db.transaction(async (tx) => {
      const effectiveLeadTeamId =
        dto.leadTeamId !== undefined ? dto.leadTeamId : oldActivity.leadTeamId;
      const effectiveLeadMinistryId =
        dto.leadMinistryId !== undefined
          ? dto.leadMinistryId
          : oldActivity.leadMinistryId;

      // Recalculate displayId when lead team or ministry changes
      const leadTeamOrMinistryChanged =
        dto.leadTeamId !== undefined || dto.leadMinistryId !== undefined;
      if (leadTeamOrMinistryChanged) {
        if (dto.leadTeamId !== undefined) {
          const [newTeam] = await tx
            .select({ name: teams.name, ministryId: teams.ministryId })
            .from(teams)
            .where(eq(teams.id, dto.leadTeamId))
            .limit(1);
          if (!newTeam) {
            throw new BadRequestException(
              `Team with ID ${dto.leadTeamId} not found`
            );
          }
          updateData.leadMinistryId = newTeam.ministryId ?? null;
          if (newTeam.ministryId != null) {
            const [ministry] = await tx
              .select({ abbreviation: ministries.abbreviation })
              .from(ministries)
              .where(eq(ministries.id, newTeam.ministryId))
              .limit(1);
            if (ministry?.abbreviation) {
              updateData.displayId = this.utilsService.generateDisplayId(
                ministry.abbreviation,
                id
              );
            } else {
              const prefix = this.utilsService.getDisplayIdPrefixFromTeamName(
                newTeam.name
              );
              updateData.displayId = this.utilsService.generateDisplayId(
                prefix,
                id
              );
            }
          } else {
            const prefix = this.utilsService.getDisplayIdPrefixFromTeamName(
              newTeam.name
            );
            updateData.displayId = this.utilsService.generateDisplayId(
              prefix,
              id
            );
          }
        } else if (effectiveLeadMinistryId != null) {
          const [ministry] = await tx
            .select({ abbreviation: ministries.abbreviation })
            .from(ministries)
            .where(eq(ministries.id, effectiveLeadMinistryId))
            .limit(1);
          if (ministry?.abbreviation) {
            updateData.displayId = this.utilsService.generateDisplayId(
              ministry.abbreviation,
              id
            );
          }
        } else {
          const teamId = effectiveLeadTeamId;
          if (teamId != null) {
            const [teamRow] = await tx
              .select({ name: teams.name })
              .from(teams)
              .where(eq(teams.id, teamId))
              .limit(1);
            if (teamRow) {
              const prefix = this.utilsService.getDisplayIdPrefixFromTeamName(
                teamRow.name
              );
              updateData.displayId = this.utilsService.generateDisplayId(
                prefix,
                id
              );
            }
          }
        }
      }

      const [updatedActivity] = await tx
        .update(activities)
        .set(updateData)
        .where(eq(activities.id, id))
        .returning();

      // Debug: log the DB row returned from update
      try {
        this.logger.debug(
          `update() id=${id} updatedActivity=${JSON.stringify(updatedActivity)}`
        );
      } catch {
        // ignore debug log failure
      }

      // Handle venue address update
      if (normalizedVenueAddress !== undefined) {
        await this.junctionService.upsertVenueAddress(
          tx,
          id,
          normalizedVenueAddress as VenueAddress | null
        );
      }

      // Handle junction table updates if provided
      // Update categories
      if (categoryIds !== undefined) {
        await this.junctionService.updateJunctionRecords(
          tx,
          activityCategories,
          id,
          categoryIds,
          (id: number) => ({ categoryId: id }),
          'categoryId',
          userId,
          now
        );
      }

      // Update tags
      if (tagIds !== undefined) {
        await this.junctionService.updateJunctionRecords(
          tx,
          activityTags,
          id,
          tagIds,
          (id: number) => ({ tagId: id }),
          'tagId',
          userId,
          now
        );
      }

      // Update comms materials
      if (commsMaterialIds !== undefined) {
        await this.junctionService.updateJunctionRecords(
          tx,
          activityCommsMaterials,
          id,
          commsMaterialIds,
          (id: number) => ({ commsMaterialId: id }),
          'commsMaterialId',
          userId,
          now
        );
      }

      // Update translation languages
      if (translationLanguageIds !== undefined) {
        await this.junctionService.updateJunctionRecords(
          tx,
          activityTranslationsRequired,
          id,
          translationLanguageIds,
          (id: number) => ({ languageId: id }),
          'languageId',
          userId,
          now
        );
      }

      // Update shared with teams
      if (sharedWithTeamIds !== undefined) {
        await this.junctionService.updateJunctionRecords(
          tx,
          activitySharedWithTeams,
          id,
          sharedWithTeamIds,
          (id: number) => ({ teamId: id }),
          'teamId',
          userId,
          now
        );
      }

      // Update comms contacts
      if (commsContactsArray !== undefined) {
        await this.junctionService.updateCommsContacts(
          tx,
          id,
          commsContactsArray,
          now
        );
      }

      // Update representatives
      if (representatives !== undefined) {
        await this.junctionService.updateRepresentatives(
          tx,
          id,
          representatives,
          now
        );
      }

      // Update report settings
      if (reportSettingsArray !== undefined && reportSettingsArray.length > 0) {
        // Convert array format to Map for service layer
        const reportSettingsMap = new Map<number, boolean>();
        for (const setting of reportSettingsArray) {
          const reportId =
            typeof setting.reportId === 'number' ? setting.reportId : undefined;
          if (typeof reportId === 'number') {
            reportSettingsMap.set(reportId, setting.omitted);
          } else {
            // Log and skip malformed entries
            this.logger.warn(
              'update: skipping malformed reportSettings entry',
              setting
            );
          }
        }
        await this.junctionService.updateActivityReportSettings(
          tx,
          id,
          reportSettingsMap
        );
      }

      return updatedActivity;
    });

    if (existingLock && existingLock.userId === userId) {
      await this.locksService.releaseLock(existingLock.id, userId);
    }

    // Fetch related data for the updated activity
    const [
      categoriesResult,
      tagsList,
      activityStatus,
      dateStatus,
      timeStatus,
      venueAddressesMap,
      commsMaterials,
      translationsRequired,
      representativesAttending,
      sharedWith,
      commsContacts,
      leadOrgNamesMap,
      eventPlannerNamesMap,
      newsReleaseOriginsMap,
      newsReleaseDistributionsMap,
      premierRequestedMap,
      reportSettingsMap,
      pitchRequiredStatus,
      translationsRequiredStatus,
      leadMinistryName,
      leadMinistryAbbreviation,
    ] = await Promise.all([
      this.dataFetcherService.fetchCategoriesForActivities([id]),
      this.dataFetcherService.fetchTagsForActivities([id]),
      this.dataFetcherService.fetchActivityStatusesForActivities([id]),
      this.dataFetcherService.fetchDateStatusesForActivities([id]),
      this.dataFetcherService.fetchTimeStatusesForActivities([id]),
      this.dataFetcherService.fetchVenueAddressesForActivities([id]),
      this.dataFetcherService.fetchCommsMaterialsForActivities([id]),
      this.dataFetcherService.fetchTranslationsRequiredForActivities([id]),
      this.dataFetcherService.fetchRepresentativesAttendingForActivities([id]),
      this.dataFetcherService.fetchSharedWithTeamsForActivities([id]),
      this.dataFetcherService.fetchCommsContactsForActivities([id]),
      this.dataFetcherService.fetchLeadOrgNamesForActivities([updated]),
      this.dataFetcherService.fetchEventPlannerNamesForActivities([updated]),
      this.dataFetcherService.fetchNewsReleaseOriginsForActivities([id]),
      this.dataFetcherService.fetchNewsReleaseDistributionsForActivities([id]),
      this.dataFetcherService.fetchPremierRequestedForActivities([id]),
      this.dataFetcherService.fetchReportSettingsForActivities([id]),
      this.dataFetcherService.fetchPitchRequiredStatusForActivities([id]),
      this.dataFetcherService.fetchTranslationsRequiredStatusForActivities([
        id,
      ]),
      this.dataFetcherService.fetchLeadMinistryNamesForActivities([id]),
      this.dataFetcherService.fetchLeadMinistryAbbreviationsForActivities([id]),
    ]);

    const { namesMap: categoriesList, idsMap: categoryIdsList } =
      categoriesResult;

    const result = this.mapperService.mapToResponseDto(updated, {
      categories: categoriesList.get(id) ?? [],
      categoryIds: categoryIdsList.get(id) ?? [],
      tags: tagsList.get(id) ?? [],
      activityStatus: activityStatus.get(id),
      dateStatus: dateStatus.get(id),
      timeStatus: timeStatus.get(id),
      venueAddress: venueAddressesMap.get(id) ?? null,
      commsMaterials: commsMaterials.get(id) ?? [],
      translationsRequired: translationsRequired.get(id) ?? [],
      representativesAttending: representativesAttending.get(id) ?? [],
      sharedWith: sharedWith.get(id) ?? [],
      commsContacts: commsContacts.get(id) ?? [],
      eventLeadName: eventPlannerNamesMap.get(id) ?? null,
      leadOrgName: leadOrgNamesMap.get(id) ?? null,
      newsReleaseOrigin: newsReleaseOriginsMap.get(id) ?? null,
      newsReleaseDistribution: newsReleaseDistributionsMap.get(id) ?? null,
      premierRequested: premierRequestedMap.get(id) ?? null,
      reportSettings: reportSettingsMap.get(id) ?? [],
      pitchRequiredStatus: pitchRequiredStatus.get(id) ?? null,
      translationsRequiredStatus: translationsRequiredStatus.get(id) ?? null,
      leadMinistry: leadMinistryName.get(id) ?? null,
      leadMinistryAbbreviation: leadMinistryAbbreviation.get(id) ?? null,
    });

    // Generate change list for history tracking (main activity fields)
    // Convert Activity objects to generic records for comparison
    // Activity is a plain object that can be treated as Record<string, unknown>
    const mainChanges = this.activityHistoryService.generateChangeList(
      oldActivity as Record<string, unknown>,
      updated as Record<string, unknown>
    );

    // Collect all changes from this update into a single array
    const allChanges: Array<{
      field: string;
      oldValue: unknown;
      newValue: unknown;
    }> = [...mainChanges];

    // Add junction table changes to the same history entry
    // Only add if the values have actually changed (using deep equality)
    // Normalize existing venue address for comparison
    const normalizedExistingVenue = this.normalizeVenueAddress(existingVenue);
    if (
      normalizedVenueAddress !== undefined &&
      !isDeepEqual(normalizedExistingVenue, normalizedVenueAddress)
    ) {
      allChanges.push({
        field: 'venueAddress',
        oldValue: normalizedExistingVenue ?? null,
        newValue: normalizedVenueAddress ?? null,
      });
    }

    if (
      commsContactsArray !== undefined &&
      !isDeepEqual(existingComms, commsContactsArray)
    ) {
      allChanges.push({
        field: 'commsContacts',
        oldValue: existingComms,
        newValue: commsContactsArray,
      });
    }

    if (
      representatives !== undefined &&
      !isDeepEqual(
        this.normalizeRepresentatives(existingRepresentatives),
        this.normalizeRepresentatives(representatives)
      )
    ) {
      allChanges.push({
        field: 'representatives',
        oldValue: this.normalizeRepresentatives(existingRepresentatives),
        newValue: this.normalizeRepresentatives(representatives),
      });
    }

    if (
      reportSettingsArray !== undefined &&
      reportSettingsArray.length > 0 &&
      !isDeepEqual(existingReportSettings, reportSettingsArray)
    ) {
      allChanges.push({
        field: 'reportSettings',
        oldValue: existingReportSettings,
        newValue: reportSettingsArray,
      });
    }

    // Debug: log detected changes
    try {
      this.logger.debug(
        `update() id=${id} changes=${JSON.stringify(allChanges)}`
      );
    } catch {
      // ignore debug log failure
    }

    // Record all activity changes in a single history entry
    await this.activityHistoryService.recordChange(
      id,
      userId,
      'updated',
      allChanges.length > 0 ? allChanges : undefined,
      activityHistoryNotes || 'Activity updated'
    );

    // Notify connected clients viewing this activity
    this.activitiesGateway.notifyActivityUpdate(id, result);

    return result;
  }

  /**
   * Remove an activity (hard delete).
   * When context.permissions does not include activities.delete.any, activity must be in visible set for context.teamIds.
   */
  async remove(
    id: number,
    userId: number,
    context?: { permissions?: string[]; teamIds?: number[] }
  ): Promise<{ message: string }> {
    // Scope: without activities.delete.any, activity must be visible to user's teams
    const canDeleteAny =
      context?.permissions?.includes(PERMISSIONS.ACTIVITIES.DELETE_ANY) ??
      false;
    if (!canDeleteAny && context?.teamIds?.length) {
      const visibleIds = await this.getVisibleActivityIdsForTeams(
        context.teamIds
      );
      if (!visibleIds.has(id)) {
        throw new ForbiddenException(
          'You may only delete activities that belong to your teams.'
        );
      }
    }

    // Verify activity exists so we return 404 for non-existent IDs
    await this.findOne(id);

    // Record deletion in history before deleting
    await this.activityHistoryService.recordChange(
      id,
      userId,
      'deleted',
      undefined,
      'Activity permanently deleted'
    );

    await this.databaseService.db
      .delete(activities)
      .where(eq(activities.id, id));
    return { message: `Activity #${id} deleted successfully` };
  }

  /**
   * Get activity history
   */
  async getHistory(id: number) {
    // Verify activity exists
    await this.findOne(id);
    return this.activityHistoryService.getActivityHistory(id);
  }

  /**
   * Cancel changes - revert activity to last published state
   * This is a simplified implementation that reverts to the last saved state
   * In a full implementation, this would restore from a published snapshot
   */
  async cancelChanges(id: number, userId: number): Promise<ActivityResponse> {
    // Verify activity exists
    const currentActivity = await this.findOne(id);

    // Get the last published state from history
    // For now, we'll use a simplified approach: get the activity as it was
    // at the time of the last 'published' action, or use current state if none
    const lastPublished =
      await this.activityHistoryService.getLastPublishedState(id);

    if (!lastPublished || !lastPublished.changes) {
      // No published state found, return current activity
      // In a full implementation, we might throw an error or create a baseline
      return currentActivity;
    }

    // TODO: Implement full restore from published state
    // For Phase 2, this is a placeholder that records the cancel action
    // Full implementation would require storing complete activity snapshots

    // Record the cancel action in history
    await this.activityHistoryService.recordChange(
      id,
      userId,
      'changes_cancelled',
      undefined,
      'Changes cancelled, reverted to last published state'
    );

    // Return current activity (full restore would happen here)
    return currentActivity;
  }

  /**
   * Soft delete (set activityStatusId to 'deleted').
   * When context.permissions does not include activities.delete.any, activity must be in visible set for context.teamIds.
   */
  async softDelete(
    id: number,
    reason: string,
    userId: number,
    context?: { permissions?: string[]; teamIds?: number[] }
  ): Promise<ActivityResponse> {
    // Validate reason is provided and not empty
    // Required for audit and admin review purposes
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('A reason is required for soft deletion');
    }

    // Get the current activity state before update
    const [existing] = await this.databaseService.db
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    // Scope: without activities.delete.any, activity must be visible to user's teams
    const canDeleteAny =
      context?.permissions?.includes(PERMISSIONS.ACTIVITIES.DELETE_ANY) ??
      false;
    if (!canDeleteAny && context?.teamIds?.length) {
      const visibleIds = await this.getVisibleActivityIdsForTeams(
        context.teamIds
      );
      if (!visibleIds.has(id)) {
        throw new ForbiddenException(
          'You may only delete activities that belong to your teams.'
        );
      }
    }

    // Get deleted status ID
    const [deletedStatus] = await this.databaseService.db
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(eq(activityStatuses.name, 'deleted' satisfies ActivityStatusName))
      .limit(1);

    if (!deletedStatus) {
      throw new BadRequestException(
        'Deleted activity status not found in database'
      );
    }

    const updated = await this.databaseService.db.transaction(async (tx) => {
      const [updatedActivity] = await tx
        .update(activities)
        .set({
          activityStatusId: deletedStatus.id,
          lastUpdatedDateTime: new Date(),
          lastUpdatedBy: userId,
        })
        .where(eq(activities.id, id))
        .returning();

      await this.activityHistoryService.recordChange(
        id,
        userId,
        'soft_deleted',
        [
          {
            field: 'activityStatusId',
            oldValue: existing.activityStatusId,
            newValue: deletedStatus.id,
          },
        ],
        reason.trim(),
        tx as unknown as Database
      );

      return updatedActivity;
    });

    if (!updated) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    // Fetch related data for the soft-deleted activity
    const related = await this.fetchRelatedForActivityIds([id], [updated]);
    const { namesMap: categoriesList, idsMap: categoryIdsList } =
      related.categoriesResult;

    return this.mapperService.mapToResponseDto(updated, {
      categories: categoriesList.get(id) ?? [],
      categoryIds: categoryIdsList.get(id) ?? [],
      tags: related.tagsMap.get(id) ?? [],
      activityStatus: related.activityStatusesMap.get(id),
      dateStatus: related.dateStatusesMap.get(id),
      timeStatus: related.timeStatusesMap.get(id),
      venueAddress: related.venueAddressesMap.get(id) ?? null,
      commsMaterials: related.commsMaterialsMap.get(id) ?? [],
      translationsRequired: related.translationsRequiredMap.get(id) ?? [],
      representativesAttending:
        related.representativesAttendingMap.get(id) ?? [],
      sharedWith: related.sharedWithMap.get(id) ?? [],
      commsContacts: related.commsContactsMap.get(id) ?? [],
      eventLeadName: related.eventPlannerNamesMap.get(id) ?? null,
      leadOrgName: related.leadOrgNamesMap.get(id) ?? null,
      newsReleaseOrigin: related.newsReleaseOriginsMap.get(id) ?? null,
      newsReleaseDistribution:
        related.newsReleaseDistributionsMap.get(id) ?? null,
      premierRequested: related.premierRequestedMap.get(id) ?? null,
      reportSettings: related.reportSettingsMap.get(id) ?? [],
      pitchRequiredStatus: related.pitchRequiredStatusMap.get(id) ?? null,
      translationsRequiredStatus:
        related.translationsRequiredStatusMap.get(id) ?? null,
      leadMinistry: related.leadMinistryNamesMap.get(id) ?? null,
      leadMinistryAbbreviation:
        related.leadMinistryAbbreviationsMap.get(id) ?? null,
    });
  }

  /**
   * Request delete (comms contacts only). Sets activity status to delete_requested.
   * Allowed only when current status is not already delete_requested or deleted.
   * Authorization (comms contact) is enforced by guard.
   */
  async requestDelete(
    id: number,
    reason: string,
    userId: number
  ): Promise<ActivityResponse> {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException(
        'A reason is required when requesting delete'
      );
    }

    const [existing] = await this.databaseService.db
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    const currentStatusName = await this.getActivityStatusNameById(
      existing.activityStatusId
    );
    if (
      currentStatusName === 'delete_requested' ||
      currentStatusName === 'deleted'
    ) {
      throw new ConflictException(
        `Activity cannot be set to delete requested when status is already '${currentStatusName}'.`
      );
    }

    const [deleteRequestedStatus] = await this.databaseService.db
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(
        eq(
          activityStatuses.name,
          'delete_requested' satisfies ActivityStatusName
        )
      )
      .limit(1);

    if (!deleteRequestedStatus) {
      throw new BadRequestException(
        'Delete requested activity status not found in database'
      );
    }

    const updated = await this.databaseService.db.transaction(async (tx) => {
      const [updatedActivity] = await tx
        .update(activities)
        .set({
          activityStatusId: deleteRequestedStatus.id,
          lastUpdatedDateTime: new Date(),
          lastUpdatedBy: userId,
        })
        .where(eq(activities.id, id))
        .returning();

      await this.activityHistoryService.recordChange(
        id,
        userId,
        'delete_requested',
        [
          {
            field: 'activityStatusId',
            oldValue: existing.activityStatusId,
            newValue: deleteRequestedStatus.id,
          },
        ],
        reason.trim(),
        tx as unknown as Database
      );

      return updatedActivity;
    });

    if (!updated) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    const related = await this.fetchRelatedForActivityIds([id], [updated]);
    const { namesMap: categoriesList, idsMap: categoryIdsList } =
      related.categoriesResult;

    return this.mapperService.mapToResponseDto(updated, {
      categories: categoriesList.get(id) ?? [],
      categoryIds: categoryIdsList.get(id) ?? [],
      tags: related.tagsMap.get(id) ?? [],
      activityStatus: related.activityStatusesMap.get(id),
      dateStatus: related.dateStatusesMap.get(id),
      timeStatus: related.timeStatusesMap.get(id),
      venueAddress: related.venueAddressesMap.get(id) ?? null,
      commsMaterials: related.commsMaterialsMap.get(id) ?? [],
      translationsRequired: related.translationsRequiredMap.get(id) ?? [],
      representativesAttending:
        related.representativesAttendingMap.get(id) ?? [],
      sharedWith: related.sharedWithMap.get(id) ?? [],
      commsContacts: related.commsContactsMap.get(id) ?? [],
      eventLeadName: related.eventPlannerNamesMap.get(id) ?? null,
      leadOrgName: related.leadOrgNamesMap.get(id) ?? null,
      newsReleaseOrigin: related.newsReleaseOriginsMap.get(id) ?? null,
      newsReleaseDistribution:
        related.newsReleaseDistributionsMap.get(id) ?? null,
      premierRequested: related.premierRequestedMap.get(id) ?? null,
      reportSettings: related.reportSettingsMap.get(id) ?? [],
      pitchRequiredStatus: related.pitchRequiredStatusMap.get(id) ?? null,
      translationsRequiredStatus:
        related.translationsRequiredStatusMap.get(id) ?? null,
      leadMinistry: related.leadMinistryNamesMap.get(id) ?? null,
      leadMinistryAbbreviation:
        related.leadMinistryAbbreviationsMap.get(id) ?? null,
    });
  }

  /**
   * Restore activity from delete_requested or deleted to the previous status.
   * Allowed only when current status is delete_requested or deleted.
   * Authorization (comms contact or admin/sysAdmin) is enforced by guard.
   */
  async restore(
    id: number,
    userId: number,
    note: string | undefined,
    _context?: { roleName: string }
  ): Promise<ActivityResponse> {
    const [existing] = await this.databaseService.db
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    const currentStatusName = await this.getActivityStatusNameById(
      existing.activityStatusId
    );
    if (
      currentStatusName !== 'delete_requested' &&
      currentStatusName !== 'deleted'
    ) {
      throw new BadRequestException(
        `Activity can only be restored when status is delete_requested or deleted (current: ${currentStatusName}).`
      );
    }

    const previousStatusId =
      (await this.activityHistoryService.getPreviousStatusIdBeforeDelete(id)) ??
      (await this.getActivityStatusIdByName('changed'));

    const updated = await this.databaseService.db.transaction(async (tx) => {
      const [updatedActivity] = await tx
        .update(activities)
        .set({
          activityStatusId: previousStatusId,
          lastUpdatedDateTime: new Date(),
          lastUpdatedBy: userId,
        })
        .where(eq(activities.id, id))
        .returning();

      await this.activityHistoryService.recordChange(
        id,
        userId,
        'restored',
        [
          {
            field: 'activityStatusId',
            oldValue: existing.activityStatusId,
            newValue: previousStatusId,
          },
        ],
        note?.trim() || 'Activity restored',
        tx as unknown as Database
      );

      return updatedActivity;
    });

    if (!updated) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    const related = await this.fetchRelatedForActivityIds([id], [updated]);
    const { namesMap: categoriesList, idsMap: categoryIdsList } =
      related.categoriesResult;

    return this.mapperService.mapToResponseDto(updated, {
      categories: categoriesList.get(id) ?? [],
      categoryIds: categoryIdsList.get(id) ?? [],
      tags: related.tagsMap.get(id) ?? [],
      activityStatus: related.activityStatusesMap.get(id),
      dateStatus: related.dateStatusesMap.get(id),
      timeStatus: related.timeStatusesMap.get(id),
      venueAddress: related.venueAddressesMap.get(id) ?? null,
      commsMaterials: related.commsMaterialsMap.get(id) ?? [],
      translationsRequired: related.translationsRequiredMap.get(id) ?? [],
      representativesAttending:
        related.representativesAttendingMap.get(id) ?? [],
      sharedWith: related.sharedWithMap.get(id) ?? [],
      commsContacts: related.commsContactsMap.get(id) ?? [],
      eventLeadName: related.eventPlannerNamesMap.get(id) ?? null,
      leadOrgName: related.leadOrgNamesMap.get(id) ?? null,
      newsReleaseOrigin: related.newsReleaseOriginsMap.get(id) ?? null,
      newsReleaseDistribution:
        related.newsReleaseDistributionsMap.get(id) ?? null,
      premierRequested: related.premierRequestedMap.get(id) ?? null,
      reportSettings: related.reportSettingsMap.get(id) ?? [],
      pitchRequiredStatus: related.pitchRequiredStatusMap.get(id) ?? null,
      translationsRequiredStatus:
        related.translationsRequiredStatusMap.get(id) ?? null,
      leadMinistry: related.leadMinistryNamesMap.get(id) ?? null,
      leadMinistryAbbreviation:
        related.leadMinistryAbbreviationsMap.get(id) ?? null,
    });
  }

  /**
   * Fetch categories available to the user based on their team memberships
   * @param userTeams - Optional array of team IDs the user belongs to
   * @returns Categories that are either global or team-scoped for the user's teams
   */
  public async fetchCategories(userTeams?: number[]): Promise<Category[]> {
    const ids = await getVisibleCategoryIds(this.databaseService.db, userTeams);
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.databaseService.db
      .select()
      .from(categories)
      .where(and(eq(categories.isActive, true), inArray(categories.id, ids)))
      .orderBy(categories.name);
    return rows as Category[];
  }

  /**
   * Update activity categories
   */
  async updateCategories(
    id: number,
    categoryIds: number[],
    userId: number
  ): Promise<ActivityResponse> {
    // Verify activity exists
    await this.findOne(id);

    const now = new Date();

    // Validate category IDs if provided
    if (categoryIds.length > 0) {
      await this.utilsService.validateCategoryIds(categoryIds);
    }

    // Get existing category IDs for history
    const existingCategories = await this.databaseService.db
      .select({ categoryId: activityCategories.categoryId })
      .from(activityCategories)
      .where(eq(activityCategories.activityId, id));
    const existingCategoryIds = existingCategories.map((c) => c.categoryId);

    await this.databaseService.db.transaction(async (tx) => {
      await this.junctionService.updateJunctionRecords(
        tx,
        activityCategories,
        id,
        categoryIds,
        (id: number) => ({ categoryId: id }),
        'categoryId',
        userId,
        now
      );
    });

    // Record change in history only if categories actually changed
    if (!isDeepEqual(existingCategoryIds, categoryIds)) {
      await this.activityHistoryService.recordChange(
        id,
        userId,
        'updated',
        [
          {
            field: 'categories',
            oldValue: existingCategoryIds,
            newValue: categoryIds,
          },
        ],
        'Activity categories updated'
      );
    }

    // Return updated activity
    return this.findOne(id);
  }

  /**
   * Update activity themes
   */
  async updateThemes(
    id: number,
    themeIds: number[],
    userId: number
  ): Promise<ActivityResponse> {
    // Verify activity exists
    await this.findOne(id);

    const now = new Date();

    // Capture existing themes for history
    const existingThemes = await this.databaseService.db
      .select({ themeId: activityThemes.themeId })
      .from(activityThemes)
      .where(eq(activityThemes.activityId, id));
    const existingThemeIds = existingThemes.map((t) => t.themeId);

    await this.databaseService.db.transaction(async (tx) => {
      await this.junctionService.updateJunctionRecords(
        tx,
        activityThemes,
        id,
        themeIds,
        (id: number) => ({ themeId: id }),
        'themeId',
        userId,
        now
      );
    });

    // Record change in history only if themes actually changed
    if (!isDeepEqual(existingThemeIds, themeIds)) {
      await this.activityHistoryService.recordChange(
        id,
        userId,
        'updated',
        [{ field: 'themes', oldValue: existingThemeIds, newValue: themeIds }],
        'Activity themes updated'
      );
    }

    // Return updated activity
    return this.findOne(id);
  }

  /**
   * Update activity tags
   * Tags now use string IDs (converted from integer IDs)
   */
  async updateTags(
    id: number,
    tagIds: number[],
    userId: number
  ): Promise<ActivityResponse> {
    // Verify activity exists
    await this.findOne(id);

    const now = new Date();

    // Capture existing tags for history
    const existingTags = await this.databaseService.db
      .select({ tagId: activityTags.tagId })
      .from(activityTags)
      .where(eq(activityTags.activityId, id));
    const existingTagIds = existingTags.map((t) => t.tagId);

    await this.databaseService.db.transaction(async (tx) => {
      await this.junctionService.updateJunctionRecords(
        tx,
        activityTags,
        id,
        tagIds,
        (id: number) => ({ tagId: id }),
        'tagId',
        userId,
        now
      );
    });

    // Record change in history only if tags actually changed
    if (!isDeepEqual(existingTagIds, tagIds)) {
      await this.activityHistoryService.recordChange(
        id,
        userId,
        'updated',
        [{ field: 'tags', oldValue: existingTagIds, newValue: tagIds }],
        'Activity tags updated'
      );
    }

    // Return updated activity
    return this.findOne(id);
  }

  /**
   * Update activity shared with teams
   */
  async updateSharedWith(
    id: number,
    teamIds: number[],
    userId: number
  ): Promise<ActivityResponse> {
    // Verify activity exists
    await this.findOne(id);

    const now = new Date();

    // Capture existing shared-with teams for history
    const existingShared = await this.databaseService.db
      .select({ teamId: activitySharedWithTeams.teamId })
      .from(activitySharedWithTeams)
      .where(eq(activitySharedWithTeams.activityId, id));
    const existingTeamIds = existingShared.map((s) => s.teamId);

    await this.databaseService.db.transaction(async (tx) => {
      await this.junctionService.updateJunctionRecords(
        tx,
        activitySharedWithTeams,
        id,
        teamIds,
        (id: number) => ({ teamId: id }),
        'teamId',
        userId,
        now
      );
    });

    // Record change in history only if shared-with teams actually changed
    if (!isDeepEqual(existingTeamIds, teamIds)) {
      await this.activityHistoryService.recordChange(
        id,
        userId,
        'updated',
        [{ field: 'sharedWith', oldValue: existingTeamIds, newValue: teamIds }],
        'Activity shared with teams updated'
      );
    }

    // Return updated activity
    return this.findOne(id);
  }
}
