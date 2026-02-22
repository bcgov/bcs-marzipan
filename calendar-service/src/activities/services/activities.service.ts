import {
  BadRequestException,
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
  activityHistory,
  activityReportSettings,
  activityRepresentatives,
  activitySharedWithTeams,
  activityStatuses,
  activityTags,
  activityThemes,
  activityTranslationsRequired,
  categories,
  ministries,
  teamMinistries,
  userTeams,
  venueAddresses,
} from '@corpcal/database/schema';
import type { Activity, Category } from '@corpcal/database/types';
import type { ActivityStatusName } from '@corpcal/shared';
import type {
  ActivityResponse,
  CreateActivityRequest,
  FilterActivitiesQueryParams,
  UpdateActivityRequest,
} from '@corpcal/shared/schemas';

import { DatabaseService } from '../../database/database.service';
import { LocksService } from '../../locks/locks.service';
import { getVisibleCategoryIds } from '../../policy/category-scoping.helper';
import type { DataScope } from '../../policy/dto/user-context.dto';
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
   * Deep equality comparison for any two values
   * Handles primitives, arrays, and objects recursively
   */
  private isDeepEqual(a: unknown, b: unknown): boolean {
    // Handle null/undefined
    if (a === null || a === undefined) {
      return b === null || b === undefined;
    }
    if (b === null || b === undefined) {
      return a === null || a === undefined;
    }

    // Handle primitives
    if (typeof a !== 'object' || typeof b !== 'object') {
      return a === b;
    }

    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => this.isDeepEqual(val, b[idx]));
    }

    // Handle objects
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) =>
      this.isDeepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  /**
   * Normalize venue address data by trimming whitespace and converting empty strings to null.
   * This prevents false change detection due to whitespace differences.
   *
   * @param venue - Venue address data to normalize
   * @returns Normalized venue address with trimmed strings and empty strings as null
   */
  private normalizeVenueAddress(
    venue: Record<string, unknown> | null | undefined
  ): Record<string, unknown> | null {
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
   * Create a new activity with related junction table records
   */
  async create(
    dto: CreateActivityRequest,
    userId: number
  ): Promise<ActivityResponse> {
    // Extract junction table IDs and venue address from the DTO
    // These fields are defined in createActivityRequestSchema but not in the base activity schema
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
      ...activityData
    } = dto;

    // Validate category IDs if provided
    if (categoryIds && categoryIds.length > 0) {
      await this.utilsService.validateCategoryIds(categoryIds);
    }

    const now = new Date();

    // Use transaction to ensure atomicity of activity and junction table inserts
    const result = await this.databaseService.db.transaction(async (tx) => {
      // Insert activity with displayId: null (will be updated after getting activity ID)
      // activityData contains only core activity fields (junction table fields were destructured out)
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
        ...activityData,
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

      // Fetch ministry abbreviation to generate displayId
      // leadMinistryId is required, so it should always be present
      // TODO: refactor so that we do not need to fetch ministry abbreviation again here.
      if (!activityData.leadMinistryId) {
        throw new BadRequestException('leadMinistryId is required');
      }

      const [ministry] = await tx
        .select({ abbreviation: ministries.abbreviation })
        .from(ministries)
        .where(eq(ministries.id, activityData.leadMinistryId))
        .limit(1);

      if (!ministry || !ministry.abbreviation) {
        throw new BadRequestException(
          `Ministry with ID ${activityData.leadMinistryId} not found or missing abbreviation`
        );
      }

      // Generate displayId using ministry abbreviation and activity ID
      const displayId = this.utilsService.generateDisplayId(
        ministry.abbreviation,
        activityId
      );

      // Update activity with generated displayId
      await tx
        .update(activities)
        .set({ displayId })
        .where(eq(activities.id, activityId));

      // Insert venue address if provided
      if (venueAddress) {
        const normalizedVenue = this.normalizeVenueAddress(
          venueAddress as Record<string, unknown>
        );
        if (normalizedVenue) {
          await this.junctionService.insertVenueAddress(
            tx,
            activityId,
            normalizedVenue as any
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

    // Record activity creation in history
    await this.activityHistoryService.recordChange(
      result.id,
      userId,
      'created',
      undefined, // No changes for creation
      'Activity created'
    );

    // Broadcast to all clients that a new activity was created
    // Only broadcast if the activity was successfully fetched
    if (createdActivity) {
      this.activitiesGateway.broadcastActivityCreated(createdActivity);
    }

    return createdActivity;
  }

  /**
   * Get activity IDs visible to the given teams via (1) comms lead user in team or (2) lead ministry in team
   */
  private async getVisibleActivityIdsForTeams(
    teamIds: number[]
  ): Promise<Set<number>> {
    if (teamIds.length === 0) return new Set();

    const [commsLeadActivityIds, leadMinistryActivityIds] = await Promise.all([
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
        .innerJoin(
          teamMinistries,
          eq(activities.leadMinistryId, teamMinistries.ministryId)
        )
        .where(
          and(
            eq(teamMinistries.isActive, true),
            inArray(teamMinistries.teamId, teamIds)
          )
        )
        .then((rows) => new Set(rows.map((r) => r.id))),
    ]);

    const visible = new Set<number>([
      ...commsLeadActivityIds,
      ...leadMinistryActivityIds,
    ]);
    return visible;
  }

  /**
   * Find all activities with optional filtering
   * @param filters - Optional query filters (title, dates, status, etc.)
   * @param _dataScope - Optional team-based data scope (from request.dataScope). When bypass is false, results should be restricted to activities visible to teamIds
   */
  async findAll(
    filters?: FilterActivitiesQueryParams,
    _dataScope?: DataScope
  ): Promise<ActivityResponse[]> {
    let activityResults: Activity[];

    // Get deleted status ID to exclude deleted activities by default
    const [deletedStatus] = await this.databaseService.db
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(eq(activityStatuses.name, 'deleted' satisfies ActivityStatusName))
      .limit(1);

    const deletedStatusId = deletedStatus?.id;

    if (filters) {
      const conditions: SQL[] = [];
      if (filters.title) {
        conditions.push(eq(activities.title, filters.title));
      }
      if (filters.activityStatusId !== undefined) {
        conditions.push(
          eq(activities.activityStatusId, filters.activityStatusId)
        );
      } else if (deletedStatusId !== undefined) {
        // Exclude deleted activities by default if activityStatusId is not specified
        conditions.push(ne(activities.activityStatusId, deletedStatusId));
      }
      if (filters.isIssue !== undefined) {
        conditions.push(eq(activities.isIssue, filters.isIssue));
      }
      if (filters.leadMinistryId !== undefined) {
        conditions.push(eq(activities.leadMinistryId, filters.leadMinistryId));
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
        // If no conditions but deletedStatusId exists, still exclude deleted
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
    } else {
      // No filters: exclude deleted activities by default
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
    if (_dataScope && !_dataScope.bypass && _dataScope.teamIds.length > 0) {
      const visibleIds = await this.getVisibleActivityIdsForTeams(
        _dataScope.teamIds
      );
      activityResults = activityResults.filter((a) => visibleIds.has(a.id));
    } else if (
      _dataScope &&
      !_dataScope.bypass &&
      _dataScope.teamIds.length === 0
    ) {
      activityResults = [];
    }

    // Fetch related data for all activities
    const activityIds = activityResults.map((a) => a.id);

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
      this.dataFetcherService.fetchLeadOrgNamesForActivities(activityResults),
      this.dataFetcherService.fetchEventPlannerNamesForActivities(
        activityResults
      ),
      this.dataFetcherService.fetchNewsReleaseOriginsForActivities(activityIds),
      this.dataFetcherService.fetchNewsReleaseDistributionsForActivities(
        activityIds
      ),
      this.dataFetcherService.fetchPremierRequestedForActivities(activityIds),
      this.dataFetcherService.fetchReportSettingsForActivities(activityIds),
    ]);

    const { namesMap: categoriesMap, idsMap: categoryIdsMap } =
      categoriesResult;

    return activityResults.map((activity) =>
      this.mapperService.mapToResponseDto(activity, {
        categories: categoriesMap.get(activity.id) ?? [],
        categoryIds: categoryIdsMap.get(activity.id) ?? [],
        tags: tagsMap.get(activity.id) ?? [],
        activityStatus: activityStatusesMap.get(activity.id),
        dateStatus: dateStatusesMap.get(activity.id),
        timeStatus: timeStatusesMap.get(activity.id),
        venueAddress: venueAddressesMap.get(activity.id) ?? null,
        commsMaterials: commsMaterialsMap.get(activity.id) ?? [],
        translationsRequired: translationsRequiredMap.get(activity.id) ?? [],
        representativesAttending:
          representativesAttendingMap.get(activity.id) ?? [],
        sharedWith: sharedWithMap.get(activity.id) ?? [],
        commsContacts: commsContactsMap.get(activity.id) ?? [],
        eventLeadName: eventPlannerNamesMap.get(activity.id) ?? null,
        leadOrgName: leadOrgNamesMap.get(activity.id) ?? null,
        newsReleaseOrigin: newsReleaseOriginsMap.get(activity.id) ?? null,
        newsReleaseDistribution:
          newsReleaseDistributionsMap.get(activity.id) ?? null,
        premierRequested: premierRequestedMap.get(activity.id) ?? null,
        reportSettings: reportSettingsMap.get(activity.id) ?? [],
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
      this.dataFetcherService.fetchLeadOrgNamesForActivities([activity]),
      this.dataFetcherService.fetchEventPlannerNamesForActivities([activity]),
      this.dataFetcherService.fetchNewsReleaseOriginsForActivities([id]),
      this.dataFetcherService.fetchNewsReleaseDistributionsForActivities([id]),
      this.dataFetcherService.fetchPremierRequestedForActivities([id]),
      this.dataFetcherService.fetchReportSettingsForActivities([id]),
    ]);

    const { namesMap: categoriesList, idsMap: categoryIdsList } =
      categoriesResult;

    return this.mapperService.mapToResponseDto(activity, {
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
    });
  }

  /**
   * Update an activity
   */
  async update(
    id: number,
    dto: UpdateActivityRequest,
    userId: number
  ): Promise<ActivityResponse> {
    const existingLock = await this.locksService.getLockForEntity('activity', id);
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

    // Extract junction table IDs and venue address from DTO
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
      ...activityUpdateData
    } = dto;

    // Normalize venue address to prevent false change detection from whitespace differences
    const normalizedVenueAddress =
      venueAddress !== undefined
        ? this.normalizeVenueAddress(venueAddress as Record<string, unknown>)
        : undefined;

    const updateData: Partial<Activity> = {
      ...(activityUpdateData as Partial<Activity>),
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

    // Use transaction to ensure atomicity of activity and junction table updates
    const updated = await this.databaseService.db.transaction(async (tx) => {
      // If leadMinistryId is being updated, recalculate displayId
      // TODO: consider if users still need to reference previous displayId.
      if (dto.leadMinistryId !== undefined && dto.leadMinistryId !== null) {
        // Fetch the new ministry abbreviation
        const [ministry] = await tx
          .select({ abbreviation: ministries.abbreviation })
          .from(ministries)
          .where(eq(ministries.id, dto.leadMinistryId))
          .limit(1);

        if (!ministry || !ministry.abbreviation) {
          throw new BadRequestException(
            `Ministry with ID ${dto.leadMinistryId} not found or missing abbreviation`
          );
        }

        // Generate new displayId using the new ministry abbreviation
        const newDisplayId = this.utilsService.generateDisplayId(
          ministry.abbreviation,
          id
        );
        updateData.displayId = newDisplayId;
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
          normalizedVenueAddress as any
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
      !this.isDeepEqual(normalizedExistingVenue, normalizedVenueAddress)
    ) {
      allChanges.push({
        field: 'venueAddress',
        oldValue: normalizedExistingVenue ?? null,
        newValue: normalizedVenueAddress ?? null,
      });
    }

    if (
      commsContactsArray !== undefined &&
      !this.isDeepEqual(existingComms, commsContactsArray)
    ) {
      allChanges.push({
        field: 'commsContacts',
        oldValue: existingComms,
        newValue: commsContactsArray,
      });
    }

    if (
      representatives !== undefined &&
      !this.isDeepEqual(
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
      !this.isDeepEqual(existingReportSettings, reportSettingsArray)
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
      'Activity updated'
    );

    // Notify connected clients viewing this activity
    this.activitiesGateway.notifyActivityUpdate(id, result);

    return result;
  }

  /**
   * Remove an activity (hard delete)
   */
  async remove(id: number, userId: number): Promise<{ message: string }> {
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
   * Soft delete (set activityStatusId to 'deleted')
   */
  async softDelete(
    id: number,
    reason: string,
    userId: number
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

    // Update activity to soft delete by setting activityStatusId to 'deleted'
    const [updated] = await this.databaseService.db
      .update(activities)
      .set({
        activityStatusId: deletedStatus.id,
        lastUpdatedDateTime: new Date(),
        lastUpdatedBy: userId,
      })
      .where(eq(activities.id, id))
      .returning();

    // Create activity history entry with the reason
    await this.databaseService.db.insert(activityHistory).values({
      activityId: id,
      userId: userId,
      actionType: 'soft_deleted',
      notes: reason.trim(),
      changes: [
        {
          field: 'activityStatusId',
          oldValue: existing.activityStatusId,
          newValue: deletedStatus.id,
        },
      ],
    });

    // Fetch related data for the soft-deleted activity
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
    ]);

    const { namesMap: categoriesList, idsMap: categoryIdsList } =
      categoriesResult;

    return this.mapperService.mapToResponseDto(updated, {
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
    if (!this.isDeepEqual(existingCategoryIds, categoryIds)) {
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
    if (!this.isDeepEqual(existingThemeIds, themeIds)) {
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
    if (!this.isDeepEqual(existingTagIds, tagIds)) {
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
    if (!this.isDeepEqual(existingTeamIds, teamIds)) {
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
