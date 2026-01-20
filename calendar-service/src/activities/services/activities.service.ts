import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, gte, lte, inArray, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { Visibility } from '@corpcal/shared';
import {
  activities,
  activityCategories,
  activityTags,
  activityThemes,
  activityCommsMaterials,
  activityTranslationsRequired,
  activitySharedWithTeams,
  activityAdditionalCommsContacts,
  categories,
  ministries,
  activityHistory,
  venueAddresses,
  teamCategories,
} from '@corpcal/database/schema';
import type { Activity, Category } from '@corpcal/database/types';
import type {
  CreateActivityRequest,
  UpdateActivityRequest,
  FilterActivitiesQueryParams,
} from '@corpcal/shared/schemas';
import type { ActivityResponse } from '@corpcal/shared/schemas';
import { DatabaseService } from '../../database/database.service';
import { ActivitiesGateway } from '../activities.gateway';
import { ActivityHistoryService } from './activity-history.service';
import { ActivityJunctionService } from './activity-junction.service';
import { ActivityDataFetcherService } from './activity-data-fetcher.service';
import { ActivityMapperService } from './activity-mapper.service';
import { ActivityUtilsService } from './activity-utils.service';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly activitiesGateway: ActivitiesGateway,
    private readonly activityHistoryService: ActivityHistoryService,
    private readonly junctionService: ActivityJunctionService,
    private readonly dataFetcherService: ActivityDataFetcherService,
    private readonly mapperService: ActivityMapperService,
    private readonly utilsService: ActivityUtilsService
  ) {}

  /**
   * Create a new activity with related junction table records
   */
  async create(dto: CreateActivityRequest): Promise<ActivityResponse> {
    // Extract junction table IDs and venue address from the DTO
    // These fields are defined in createActivityRequestSchema but not in the base activity schema
    const {
      categoryIds,
      tagIds,
      commsMaterialIds,
      translationLanguageIds,
      sharedWithTeamIds,
      additionalCommsContactIds,
      representatives,
      venueAddress,
      reportSettings: reportSettingsArray,
      ...activityData
    } = dto;

    // Validate category IDs if provided
    if (categoryIds && categoryIds.length > 0) {
      await this.utilsService.validateCategoryIds(categoryIds);
    }

    // TODO: Get current user ID from auth context
    const currentUserId = 1;
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
        createdBy: currentUserId,
        lastUpdatedBy: currentUserId,
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
      // contactMinistryId is required, so it should always be present
      // TODO: refactor so that we do not need to fetch ministry abbreviation again here.
      if (!activityData.contactMinistryId) {
        throw new BadRequestException('contactMinistryId is required');
      }

      const [ministry] = await tx
        .select({ abbreviation: ministries.abbreviation })
        .from(ministries)
        .where(eq(ministries.id, activityData.contactMinistryId))
        .limit(1);

      if (!ministry || !ministry.abbreviation) {
        throw new BadRequestException(
          `Ministry with ID ${activityData.contactMinistryId} not found or missing abbreviation`
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
        await this.junctionService.insertVenueAddress(
          tx,
          activityId,
          venueAddress
        );
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
          currentUserId,
          now
        ),
        // Tags
        this.junctionService.insertJunctionRecords(
          tx,
          activityTags,
          activityId,
          tagIds,
          (id: number) => ({ tagId: id }),
          currentUserId,
          now
        ),
        // Comms Materials
        this.junctionService.insertJunctionRecords(
          tx,
          activityCommsMaterials,
          activityId,
          commsMaterialIds,
          (id: number) => ({ commsMaterialId: id }),
          currentUserId,
          now
        ),
        // Translation Languages
        this.junctionService.insertJunctionRecords(
          tx,
          activityTranslationsRequired,
          activityId,
          translationLanguageIds,
          (id: number) => ({ languageId: id }),
          currentUserId,
          now
        ),
        // Shared With Teams
        this.junctionService.insertJunctionRecords(
          tx,
          activitySharedWithTeams,
          activityId,
          sharedWithTeamIds,
          (id: number) => ({ teamId: id }),
          currentUserId,
          now
        ),
        // Additional Comms Contacts
        this.junctionService.insertJunctionRecords(
          tx,
          activityAdditionalCommsContacts,
          activityId,
          additionalCommsContactIds,
          (id: number) => ({ userId: id }),
          currentUserId,
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
          reportSettingsMap.set(setting.reportId, setting.omitted);
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
      currentUserId,
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
   * Find all activities with optional filtering
   */
  async findAll(
    filters?: FilterActivitiesQueryParams
  ): Promise<ActivityResponse[]> {
    let activityResults: Activity[];

    if (filters) {
      const conditions: SQL[] = [];
      if (filters.title) {
        conditions.push(eq(activities.title, filters.title));
      }
      if (filters.activityStatusId !== undefined) {
        conditions.push(
          eq(activities.activityStatusId, filters.activityStatusId)
        );
      }
      if (filters.isActive !== undefined) {
        conditions.push(eq(activities.isActive, filters.isActive));
      }
      if (filters.isIssue !== undefined) {
        conditions.push(eq(activities.isIssue, filters.isIssue));
      }
      if (filters.contactMinistryId !== undefined) {
        conditions.push(
          eq(activities.contactMinistryId, filters.contactMinistryId)
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
        activityResults = await this.databaseService.db
          .select()
          .from(activities);
      }
    } else {
      activityResults = await this.databaseService.db.select().from(activities);
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

    // Fetch related data for all activities
    const activityIds = activityResults.map((a) => a.id);
    // Collect all user IDs that need to be fetched (for commsContact)
    const userIds = new Set<number>();
    for (const activity of activityResults) {
      if (activity.commsContactLeadId) userIds.add(activity.commsContactLeadId);
    }

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
      additionalCommsContactsMap,
      userNamesMap,
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
      this.dataFetcherService.fetchAdditionalCommsContactsForActivities(
        activityIds
      ),
      this.dataFetcherService.fetchUserNamesForUserIds(Array.from(userIds)),
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
        additionalCommsContacts:
          additionalCommsContactsMap.get(activity.id) ?? [],
        commsContactName: activity.commsContactLeadId
          ? (userNamesMap.get(activity.commsContactLeadId) ?? null)
          : null,
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
   * Find one activity by ID
   */
  async findOne(id: number): Promise<ActivityResponse> {
    const [activity] = await this.databaseService.db
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (!activity) {
      throw new NotFoundException(`Activity #${id} not found`);
    }

    // Collect user IDs that need to be fetched (for commsContact)
    const userIds: number[] = [];
    if (activity.commsContactLeadId) userIds.push(activity.commsContactLeadId);

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
      additionalCommsContacts,
      userNamesMap,
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
      this.dataFetcherService.fetchAdditionalCommsContactsForActivities([id]),
      this.dataFetcherService.fetchUserNamesForUserIds(userIds),
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
      additionalCommsContacts: additionalCommsContacts.get(id) ?? [],
      commsContactName: activity.commsContactLeadId
        ? (userNamesMap.get(activity.commsContactLeadId) ?? null)
        : null,
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
    dto: UpdateActivityRequest
  ): Promise<ActivityResponse> {
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
      additionalCommsContactIds,
      representatives,
      venueAddress,
      reportSettings: reportSettingsArray,
      ...activityUpdateData
    } = dto;

    const updateData: Partial<Activity> = {
      ...(activityUpdateData as Partial<Activity>),
      lastUpdatedDateTime: new Date(),
    };

    // TODO: Get current user ID from auth context
    const currentUserId = 1;
    const now = new Date();

    // Use transaction to ensure atomicity of activity and junction table updates
    const updated = await this.databaseService.db.transaction(async (tx) => {
      // If contactMinistryId is being updated, recalculate displayId
      // TODO: consider if users still need to reference previous displayId.
      if (
        dto.contactMinistryId !== undefined &&
        dto.contactMinistryId !== null
      ) {
        // Fetch the new ministry abbreviation
        const [ministry] = await tx
          .select({ abbreviation: ministries.abbreviation })
          .from(ministries)
          .where(eq(ministries.id, dto.contactMinistryId))
          .limit(1);

        if (!ministry || !ministry.abbreviation) {
          throw new BadRequestException(
            `Ministry with ID ${dto.contactMinistryId} not found or missing abbreviation`
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

      // Handle venue address update
      if (venueAddress !== undefined) {
        await this.junctionService.upsertVenueAddress(tx, id, venueAddress);
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
          currentUserId,
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
          currentUserId,
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
          currentUserId,
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
          currentUserId,
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
          currentUserId,
          now
        );
      }

      // Update additional comms contacts
      if (additionalCommsContactIds !== undefined) {
        await this.junctionService.updateJunctionRecords(
          tx,
          activityAdditionalCommsContacts,
          id,
          additionalCommsContactIds,
          (id: number) => ({ userId: id }),
          'userId',
          currentUserId,
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
          reportSettingsMap.set(setting.reportId, setting.omitted);
        }
        await this.junctionService.updateActivityReportSettings(
          tx,
          id,
          reportSettingsMap
        );
      }

      return updatedActivity;
    });

    // Collect user IDs that need to be fetched (for commsContact)
    const userIds: number[] = [];
    if (updated.commsContactLeadId) userIds.push(updated.commsContactLeadId);

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
      additionalCommsContacts,
      userNamesMap,
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
      this.dataFetcherService.fetchAdditionalCommsContactsForActivities([id]),
      this.dataFetcherService.fetchUserNamesForUserIds(userIds),
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
      additionalCommsContacts: additionalCommsContacts.get(id) ?? [],
      commsContactName: updated.commsContactLeadId
        ? (userNamesMap.get(updated.commsContactLeadId) ?? null)
        : null,
      eventLeadName: eventPlannerNamesMap.get(id) ?? null,
      leadOrgName: leadOrgNamesMap.get(id) ?? null,
      newsReleaseOrigin: newsReleaseOriginsMap.get(id) ?? null,
      newsReleaseDistribution: newsReleaseDistributionsMap.get(id) ?? null,
      premierRequested: premierRequestedMap.get(id) ?? null,
      reportSettings: reportSettingsMap.get(id) ?? [],
    });

    // Generate change list for history tracking
    // Convert Activity objects to generic records for comparison
    // Activity is a plain object that can be treated as Record<string, unknown>
    const changes = this.activityHistoryService.generateChangeList(
      oldActivity as Record<string, unknown>,
      updated as Record<string, unknown>
    );

    // Record activity update in history
    await this.activityHistoryService.recordChange(
      id,
      currentUserId,
      'updated',
      changes.length > 0 ? changes : undefined,
      'Activity updated'
    );

    // Notify connected clients viewing this activity
    this.activitiesGateway.notifyActivityUpdate(id, result);

    return result;
  }

  /**
   * Remove an activity (hard delete)
   */
  async remove(id: number): Promise<{ message: string }> {
    // TODO: Get current user ID from auth context
    const currentUserId = 1;

    // Record deletion in history before deleting
    await this.activityHistoryService.recordChange(
      id,
      currentUserId,
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
   * Soft delete (set isActive to false)
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

    // Update activity to soft delete
    const [updated] = await this.databaseService.db
      .update(activities)
      .set({
        isActive: false,
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
          field: 'isActive',
          oldValue: existing.isActive,
          newValue: false,
        },
      ],
    });

    // Collect user IDs that need to be fetched (for commsContact)
    const userIds: number[] = [];
    if (updated.commsContactLeadId) userIds.push(updated.commsContactLeadId);

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
      additionalCommsContacts,
      userNamesMap,
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
      this.dataFetcherService.fetchAdditionalCommsContactsForActivities([id]),
      this.dataFetcherService.fetchUserNamesForUserIds(userIds),
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
      additionalCommsContacts: additionalCommsContacts.get(id) ?? [],
      commsContactName: updated.commsContactLeadId
        ? (userNamesMap.get(updated.commsContactLeadId) ?? null)
        : null,
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
    if (userTeams && userTeams.length > 0) {
      // Return global categories OR team-scoped categories for user's teams
      // Query global categories
      const globalCategories = await this.databaseService.db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.isActive, true),
            sql`${categories.visibility} = ${'global' satisfies Visibility}`
          )
        );

      // Query team-scoped categories accessible to user's teams
      const teamScopedCategories = await this.databaseService.db
        .select({
          id: categories.id,
          name: categories.name,
          displayName: categories.displayName,
          sortOrder: categories.sortOrder,
          pitchRequired: categories.pitchRequired,
          visibility: categories.visibility,
          isActive: categories.isActive,
          description: categories.description,
          createdDateTime: categories.createdDateTime,
          createdBy: categories.createdBy,
          lastUpdatedDateTime: categories.lastUpdatedDateTime,
          lastUpdatedBy: categories.lastUpdatedBy,
        })
        .from(categories)
        .innerJoin(
          teamCategories,
          and(
            eq(categories.id, teamCategories.categoryId),
            eq(teamCategories.isActive, true),
            inArray(teamCategories.teamId, userTeams)
          )
        )
        .where(
          and(
            eq(categories.isActive, true),
            sql`${categories.visibility} = ${'team' satisfies Visibility}`
          )
        );

      // Combine and deduplicate by ID
      const allCategories = [...globalCategories, ...teamScopedCategories];
      const uniqueCategories = Array.from(
        new Map(allCategories.map((cat) => [cat.id, cat])).values()
      );

      return uniqueCategories.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // If no teams provided, return only global categories
      return await this.databaseService.db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.isActive, true),
            sql`${categories.visibility} = ${'global' satisfies Visibility}`
          )
        )
        .orderBy(categories.name);
    }
  }

  /**
   * Update activity categories
   */
  async updateCategories(
    id: number,
    categoryIds: number[]
  ): Promise<ActivityResponse> {
    // Verify activity exists
    await this.findOne(id);

    // TODO: Get current user ID from auth context
    const currentUserId = 1;
    const now = new Date();

    // Validate category IDs if provided
    if (categoryIds.length > 0) {
      await this.utilsService.validateCategoryIds(categoryIds);
    }

    await this.databaseService.db.transaction(async (tx) => {
      await this.junctionService.updateJunctionRecords(
        tx,
        activityCategories,
        id,
        categoryIds,
        (id: number) => ({ categoryId: id }),
        'categoryId',
        currentUserId,
        now
      );
    });

    // Record change in history
    await this.activityHistoryService.recordChange(
      id,
      currentUserId,
      'updated',
      [{ field: 'categories', oldValue: null, newValue: categoryIds }],
      'Activity categories updated'
    );

    // Return updated activity
    return this.findOne(id);
  }

  /**
   * Update activity themes
   */
  async updateThemes(
    id: number,
    themeIds: string[]
  ): Promise<ActivityResponse> {
    // Verify activity exists
    await this.findOne(id);

    // TODO: Get current user ID from auth context
    const currentUserId = 1;
    const now = new Date();

    await this.databaseService.db.transaction(async (tx) => {
      await this.junctionService.updateJunctionRecords(
        tx,
        activityThemes,
        id,
        themeIds,
        (id: string) => ({ themeId: id }),
        'themeId',
        currentUserId,
        now
      );
    });

    // Record change in history
    await this.activityHistoryService.recordChange(
      id,
      currentUserId,
      'updated',
      [{ field: 'themes', oldValue: null, newValue: themeIds }],
      'Activity themes updated'
    );

    // Return updated activity
    return this.findOne(id);
  }

  /**
   * Update activity tags
   * Tags now use string IDs (converted from integer IDs)
   */
  async updateTags(id: number, tagIds: number[]): Promise<ActivityResponse> {
    // Verify activity exists
    await this.findOne(id);

    // TODO: Get current user ID from auth context
    const currentUserId = 1;
    const now = new Date();

    await this.databaseService.db.transaction(async (tx) => {
      await this.junctionService.updateJunctionRecords(
        tx,
        activityTags,
        id,
        tagIds,
        (id: number) => ({ tagId: id }),
        'tagId',
        currentUserId,
        now
      );
    });

    // Record change in history
    await this.activityHistoryService.recordChange(
      id,
      currentUserId,
      'updated',
      [{ field: 'tags', oldValue: null, newValue: tagIds.map(String) }],
      'Activity tags updated'
    );

    // Return updated activity
    return this.findOne(id);
  }

  /**
   * Update activity shared with teams
   */
  async updateSharedWith(
    id: number,
    teamIds: number[]
  ): Promise<ActivityResponse> {
    // Verify activity exists
    await this.findOne(id);

    // TODO: Get current user ID from auth context
    const currentUserId = 1;
    const now = new Date();

    await this.databaseService.db.transaction(async (tx) => {
      await this.junctionService.updateJunctionRecords(
        tx,
        activitySharedWithTeams,
        id,
        teamIds,
        (id: number) => ({ teamId: id }),
        'teamId',
        currentUserId,
        now
      );
    });

    // Record change in history
    await this.activityHistoryService.recordChange(
      id,
      currentUserId,
      'updated',
      [{ field: 'sharedWith', oldValue: null, newValue: teamIds }],
      'Activity shared with teams updated'
    );

    // Return updated activity
    return this.findOne(id);
  }
}
