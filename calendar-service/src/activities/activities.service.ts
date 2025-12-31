import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
// Import operators from drizzle-orm (these are exported by drizzle-orm)
import { eq, and, gte, lte, inArray, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import {
  activities,
  pitchStatuses,
  dateStatuses,
  timeStatuses,
  venueStatuses,
  activityCategories,
  activityTags,
  categories,
  tags,
  activityJointOrgs,
  activityRelatedEntries,
  activityCommsMaterials,
  activityTranslationsRequired,
  activityJointEventOrgs,
  activityRepresentatives,
  activitySharedWithOrgs,
  activityCanEditUsers,
  activityCanViewUsers,
  activityAdditionalOwners,
  organizations,
  commsMaterials,
  translatedLanguages,
  systemUsers,
} from '@corpcal/database/schema';
import type { Activity, Category } from '@corpcal/database/types';
import type {
  CreateActivityRequest,
  UpdateActivityRequest,
  FilterActivities,
} from '@corpcal/shared/schemas';
import { activityResponseSchema } from '@corpcal/shared/schemas';
import { z } from 'zod';
import { ActivityResponseDto } from '@corpcal/shared/dto';
import { ensureMatchesSchema } from '@corpcal/shared/utils';
import { DatabaseService } from '../database/database.service';
import { ActivitiesGateway } from './activities.gateway';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly activitiesGateway: ActivitiesGateway
  ) {}
  /**
   * Create a new activity with related junction table records
   */
  async create(dto: CreateActivityRequest): Promise<ActivityResponseDto> {
    // Extract junction table IDs from the DTO
    // These fields are defined in createActivityRequestSchema but not in the base activity schema
    const {
      categoryIds,
      tagIds,
      jointOrgIds,
      relatedActivityIds,
      commsMaterialIds,
      translationLanguageIds,
      jointEventOrgIds,
      sharedWithOrgIds,
      canEditUserIds,
      canViewUserIds,
      additionalOwnerIds,
      // Note: representativeIds is excluded - activityRepresentatives uses free-text representativeName
      ...activityData
    } = dto as CreateActivityRequest & {
      categoryIds?: number[];
      tagIds?: string[];
      jointOrgIds?: string[];
      relatedActivityIds?: number[];
      commsMaterialIds?: number[];
      translationLanguageIds?: number[];
      jointEventOrgIds?: string[];
      // FIXME:
      // representativeIds?: number[];
      sharedWithOrgIds?: string[];
      canEditUserIds?: number[];
      canViewUserIds?: number[];
      additionalOwnerIds?: number[];
    };

    // Validate category IDs if provided
    if (categoryIds && categoryIds.length > 0) {
      await this.validateCategoryIds(categoryIds);
    }

    // TODO: Get current user ID from auth context
    const currentUserId = 1; //dto.createdBy ?? 1;
    const now = new Date();

    // Use transaction to ensure atomicity of activity and junction table inserts
    const result = await this.databaseService.db.transaction(async (tx) => {
      // Prepare activity data with audit fields
      const newActivity = {
        ...activityData,
        createdBy: currentUserId,
        lastUpdatedBy: currentUserId,
        createdDateTime: now,
        lastUpdatedDateTime: now,
      };

      // Insert the activity
      const [created] = await tx
        .insert(activities)
        .values(newActivity as typeof activities.$inferInsert)
        .returning();

      const activityId = created.id;

      // Insert junction table records in parallel
      await Promise.all([
        // Categories
        this.insertJunctionRecords(
          tx,
          activityCategories,
          activityId,
          categoryIds,
          (id: number) => ({ categoryId: id }),
          currentUserId,
          now
        ),
        // Tags
        this.insertJunctionRecords(
          tx,
          activityTags,
          activityId,
          tagIds,
          (id: string) => ({ tagId: id }),
          currentUserId,
          now
        ),
        // Joint Organizations
        this.insertJunctionRecords(
          tx,
          activityJointOrgs,
          activityId,
          jointOrgIds,
          (id: string) => ({ organizationId: id }),
          currentUserId,
          now
        ),
        // Related Activities
        this.insertJunctionRecords(
          tx,
          activityRelatedEntries,
          activityId,
          relatedActivityIds,
          (id: number) => ({ relatedActivityId: id }),
          currentUserId,
          now
        ),
        // Comms Materials
        this.insertJunctionRecords(
          tx,
          activityCommsMaterials,
          activityId,
          commsMaterialIds,
          (id: number) => ({ commsMaterialId: id }),
          currentUserId,
          now
        ),
        // Translation Languages
        this.insertJunctionRecords(
          tx,
          activityTranslationsRequired,
          activityId,
          translationLanguageIds,
          (id: number) => ({ languageId: id }),
          currentUserId,
          now
        ),
        // Joint Event Organizations
        this.insertJunctionRecords(
          tx,
          activityJointEventOrgs,
          activityId,
          jointEventOrgIds,
          (id: string) => ({ organizationId: id }),
          currentUserId,
          now
        ),
        // Shared With Organizations
        this.insertJunctionRecords(
          tx,
          activitySharedWithOrgs,
          activityId,
          sharedWithOrgIds,
          (id: string) => ({ organizationId: id }),
          currentUserId,
          now
        ),
        // Can Edit Users
        this.insertJunctionRecords(
          tx,
          activityCanEditUsers,
          activityId,
          canEditUserIds,
          (id: number) => ({ userId: id }),
          currentUserId,
          now
        ),
        // Can View Users
        this.insertJunctionRecords(
          tx,
          activityCanViewUsers,
          activityId,
          canViewUserIds,
          (id: number) => ({ userId: id }),
          currentUserId,
          now
        ),
        // Additional Owners
        this.insertJunctionRecords(
          tx,
          activityAdditionalOwners,
          activityId,
          additionalOwnerIds,
          (id: number) => ({ userId: id }),
          currentUserId,
          now
        ),
      ]);

      return created;
    });

    // Fetch the created activity with all related data
    const createdActivity = await this.findOne(result.id);

    // Broadcast to all clients that a new activity was created
    this.activitiesGateway.broadcastActivityCreated(createdActivity);

    return createdActivity;
  }

  /**
   * Helper function to insert junction table records
   * Reduces code duplication for common junction table insert patterns
   *
   * @param tx - Database transaction
   * @param table - Junction table to insert into
   * @param activityId - ID of the activity
   * @param ids - Array of IDs to create relationships for (can be number[] or string[])
   * @param idMapper - Function to map an ID to the junction table record fields
   * @param currentUserId - ID of the user creating the records
   * @param now - Current timestamp
   */
  private async insertJunctionRecords<TId extends number | string>(
    tx: Parameters<
      Parameters<typeof this.databaseService.db.transaction>[0]
    >[0],
    table: any,
    activityId: number,
    ids: TId[] | undefined,
    idMapper: (id: TId) => Record<string, any>,
    currentUserId: number,
    now: Date
  ): Promise<void> {
    if (!ids || ids.length === 0) {
      return;
    }

    await tx.insert(table).values(
      ids.map((id) => ({
        activityId,
        ...idMapper(id),
        createdBy: currentUserId,
        lastUpdatedBy: currentUserId,
        createdDateTime: now,
        lastUpdatedDateTime: now,
      }))
    );
  }

  /**
   * Find all activities with optional filtering
   */
  async findAll(filters?: FilterActivities): Promise<ActivityResponseDto[]> {
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
      if (filters.ministryOwnerId !== undefined) {
        conditions.push(
          eq(activities.ministryOwnerId, filters.ministryOwnerId)
        );
      }
      if (filters.city !== undefined) {
        conditions.push(
          sql`${activities.venueAddress}->>'city' = ${filters.city}`
        );
      }
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

    // Fetch related data for all activities
    const activityIds = activityResults.map((a) => a.id);
    const [
      categoriesMap,
      tagsMap,
      pitchStatusesMap,
      dateStatusesMap,
      timeStatusesMap,
      venueStatusesMap,
      jointOrgMap,
      relatedActivitiesMap,
      commsMaterialsMap,
      translationsRequiredMap,
      jointEventOrgMap,
      representativesAttendingMap,
      sharedWithMap,
      canEditMap,
      canViewMap,
      additionalOwnersMap,
    ] = await Promise.all([
      this.fetchCategoriesForActivities(activityIds),
      this.fetchTagsForActivities(activityIds),
      this.fetchPitchStatusesForActivities(activityIds),
      this.fetchDateStatusesForActivities(activityIds),
      this.fetchTimeStatusesForActivities(activityIds),
      this.fetchVenueStatusesForActivities(activityIds),
      this.fetchJointOrgsForActivities(activityIds),
      this.fetchRelatedActivitiesForActivities(activityIds),
      this.fetchCommsMaterialsForActivities(activityIds),
      this.fetchTranslationsRequiredForActivities(activityIds),
      this.fetchjointEventOrgsForActivities(activityIds),
      this.fetchRepresentativesAttendingForActivities(activityIds),
      this.fetchSharedWithOrgsForActivities(activityIds),
      this.fetchCanEditUsersForActivities(activityIds),
      this.fetchCanViewUsersForActivities(activityIds),
      this.fetchAdditionalOwnersForActivities(activityIds),
    ]);

    return activityResults.map((activity) =>
      this.mapToResponseDto(activity, {
        categories: categoriesMap.get(activity.id) ?? [],
        tags: tagsMap.get(activity.id) ?? [],
        pitchStatus: pitchStatusesMap.get(activity.id),
        dateStatus: dateStatusesMap.get(activity.id),
        timeStatus: timeStatusesMap.get(activity.id),
        venueStatus: venueStatusesMap.get(activity.id) ?? null,
        jointOrg: jointOrgMap.get(activity.id) ?? [],
        relatedActivities: relatedActivitiesMap.get(activity.id) ?? [],
        commsMaterials: commsMaterialsMap.get(activity.id) ?? [],
        translationsRequired: translationsRequiredMap.get(activity.id) ?? [],
        jointEventOrg: jointEventOrgMap.get(activity.id) ?? [],
        representativesAttending:
          representativesAttendingMap.get(activity.id) ?? [],
        sharedWith: sharedWithMap.get(activity.id) ?? [],
        canEdit: canEditMap.get(activity.id) ?? [],
        canView: canViewMap.get(activity.id) ?? [],
        additionalOwners: additionalOwnersMap.get(activity.id) ?? [],
      })
    );
  }

  /**
   * Find one activity by ID
   */
  async findOne(id: number): Promise<ActivityResponseDto> {
    const [activity] = await this.databaseService.db
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (!activity) {
      throw new NotFoundException(`Activity #${id} not found`);
    }

    // Fetch related data
    const [
      categoriesList,
      tagsList,
      pitchStatus,
      dateStatus,
      timeStatus,
      venueStatus,
      jointOrg,
      relatedActivities,
      commsMaterials,
      translationsRequired,
      jointEventOrg,
      representativesAttending,
      sharedWith,
      canEdit,
      canView,
      additionalOwners,
    ] = await Promise.all([
      this.fetchCategoriesForActivities([id]),
      this.fetchTagsForActivities([id]),
      this.fetchPitchStatusesForActivities([id]),
      this.fetchDateStatusesForActivities([id]),
      this.fetchTimeStatusesForActivities([id]),
      this.fetchVenueStatusesForActivities([id]),
      this.fetchJointOrgsForActivities([id]),
      this.fetchRelatedActivitiesForActivities([id]),
      this.fetchCommsMaterialsForActivities([id]),
      this.fetchTranslationsRequiredForActivities([id]),
      this.fetchjointEventOrgsForActivities([id]),
      this.fetchRepresentativesAttendingForActivities([id]),
      this.fetchSharedWithOrgsForActivities([id]),
      this.fetchCanEditUsersForActivities([id]),
      this.fetchCanViewUsersForActivities([id]),
      this.fetchAdditionalOwnersForActivities([id]),
    ]);

    return this.mapToResponseDto(activity, {
      categories: categoriesList.get(id) ?? [],
      tags: tagsList.get(id) ?? [],
      pitchStatus: pitchStatus.get(id),
      dateStatus: dateStatus.get(id),
      timeStatus: timeStatus.get(id),
      venueStatus: venueStatus.get(id) ?? null,
      jointOrg: jointOrg.get(id) ?? [],
      relatedActivities: relatedActivities.get(id) ?? [],
      commsMaterials: commsMaterials.get(id) ?? [],
      translationsRequired: translationsRequired.get(id) ?? [],
      jointEventOrg: jointEventOrg.get(id) ?? [],
      representativesAttending: representativesAttending.get(id) ?? [],
      sharedWith: sharedWith.get(id) ?? [],
      canEdit: canEdit.get(id) ?? [],
      canView: canView.get(id) ?? [],
      additionalOwners: additionalOwners.get(id) ?? [],
    });
  }

  /**
   * Update an activity
   */
  async update(
    id: number,
    dto: UpdateActivityRequest
  ): Promise<ActivityResponseDto> {
    // Verify activity exists (throws NotFoundException if not found)
    await this.findOne(id);

    const updateData: Partial<Activity> = {
      ...(dto as Partial<Activity>),
      lastUpdatedDateTime: new Date(),
    };

    const [updated] = await this.databaseService.db
      .update(activities)
      .set(updateData)
      .where(eq(activities.id, id))
      .returning();

    // Fetch related data for the updated activity
    const [
      categoriesList,
      tagsList,
      pitchStatus,
      dateStatus,
      timeStatus,
      venueStatus,
      jointOrg,
      relatedActivities,
      commsMaterials,
      translationsRequired,
      jointEventOrg,
      representativesAttending,
      sharedWith,
      canEdit,
      canView,
      additionalOwners,
    ] = await Promise.all([
      this.fetchCategoriesForActivities([id]),
      this.fetchTagsForActivities([id]),
      this.fetchPitchStatusesForActivities([id]),
      this.fetchDateStatusesForActivities([id]),
      this.fetchTimeStatusesForActivities([id]),
      this.fetchVenueStatusesForActivities([id]),
      this.fetchJointOrgsForActivities([id]),
      this.fetchRelatedActivitiesForActivities([id]),
      this.fetchCommsMaterialsForActivities([id]),
      this.fetchTranslationsRequiredForActivities([id]),
      this.fetchjointEventOrgsForActivities([id]),
      this.fetchRepresentativesAttendingForActivities([id]),
      this.fetchSharedWithOrgsForActivities([id]),
      this.fetchCanEditUsersForActivities([id]),
      this.fetchCanViewUsersForActivities([id]),
      this.fetchAdditionalOwnersForActivities([id]),
    ]);

    const result = this.mapToResponseDto(updated, {
      categories: categoriesList.get(id) ?? [],
      tags: tagsList.get(id) ?? [],
      pitchStatus: pitchStatus.get(id),
      dateStatus: dateStatus.get(id),
      timeStatus: timeStatus.get(id),
      venueStatus: venueStatus.get(id) ?? null,
      jointOrg: jointOrg.get(id) ?? [],
      relatedActivities: relatedActivities.get(id) ?? [],
      commsMaterials: commsMaterials.get(id) ?? [],
      translationsRequired: translationsRequired.get(id) ?? [],
      jointEventOrg: jointEventOrg.get(id) ?? [],
      representativesAttending: representativesAttending.get(id) ?? [],
      sharedWith: sharedWith.get(id) ?? [],
      canEdit: canEdit.get(id) ?? [],
      canView: canView.get(id) ?? [],
      additionalOwners: additionalOwners.get(id) ?? [],
    });

    // Notify connected clients viewing this activity
    this.activitiesGateway.notifyActivityUpdate(id, result);

    return result;
  }

  /**
   * Remove an activity (hard delete)
   */
  async remove(id: number): Promise<{ message: string }> {
    await this.databaseService.db
      .delete(activities)
      .where(eq(activities.id, id));
    return { message: `Activity #${id} deleted successfully` };
  }

  /**
   * Soft delete (set isActive to false)
   */
  async softDelete(id: number): Promise<ActivityResponseDto> {
    const [updated] = await this.databaseService.db
      .update(activities)
      .set({
        isActive: false,
        lastUpdatedDateTime: new Date(),
      })
      .where(eq(activities.id, id))
      .returning();

    // Fetch related data for the soft-deleted activity
    const [
      categoriesList,
      tagsList,
      pitchStatus,
      dateStatus,
      timeStatus,
      venueStatus,
      jointOrg,
      relatedActivities,
      commsMaterials,
      translationsRequired,
      jointEventOrg,
      representativesAttending,
      sharedWith,
      canEdit,
      canView,
      additionalOwners,
    ] = await Promise.all([
      this.fetchCategoriesForActivities([id]),
      this.fetchTagsForActivities([id]),
      this.fetchPitchStatusesForActivities([id]),
      this.fetchDateStatusesForActivities([id]),
      this.fetchTimeStatusesForActivities([id]),
      this.fetchVenueStatusesForActivities([id]),
      this.fetchJointOrgsForActivities([id]),
      this.fetchRelatedActivitiesForActivities([id]),
      this.fetchCommsMaterialsForActivities([id]),
      this.fetchTranslationsRequiredForActivities([id]),
      this.fetchjointEventOrgsForActivities([id]),
      this.fetchRepresentativesAttendingForActivities([id]),
      this.fetchSharedWithOrgsForActivities([id]),
      this.fetchCanEditUsersForActivities([id]),
      this.fetchCanViewUsersForActivities([id]),
      this.fetchAdditionalOwnersForActivities([id]),
    ]);

    return this.mapToResponseDto(updated, {
      categories: categoriesList.get(id) ?? [],
      tags: tagsList.get(id) ?? [],
      pitchStatus: pitchStatus.get(id),
      dateStatus: dateStatus.get(id),
      timeStatus: timeStatus.get(id),
      venueStatus: venueStatus.get(id) ?? null,
      jointOrg: jointOrg.get(id) ?? [],
      relatedActivities: relatedActivities.get(id) ?? [],
      commsMaterials: commsMaterials.get(id) ?? [],
      translationsRequired: translationsRequired.get(id) ?? [],
      jointEventOrg: jointEventOrg.get(id) ?? [],
      representativesAttending: representativesAttending.get(id) ?? [],
      sharedWith: sharedWith.get(id) ?? [],
      canEdit: canEdit.get(id) ?? [],
      canView: canView.get(id) ?? [],
      additionalOwners: additionalOwners.get(id) ?? [],
    });
  }

  /**
   * Fetch categories for multiple activities
   */
  private async fetchCategoriesForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityCategories.activityId,
        categoryName: categories.name,
      })
      .from(activityCategories)
      .innerJoin(categories, eq(activityCategories.categoryId, categories.id))
      .where(
        and(
          inArray(activityCategories.activityId, activityIds),
          eq(activityCategories.isActive, true),
          eq(categories.isActive, true)
        )
      );

    const map = new Map<number, string[]>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push(row.categoryName);
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Fetch tags for multiple activities
   */
  private async fetchTagsForActivities(
    activityIds: number[]
  ): Promise<Map<number, Array<{ id: string; text: string }>>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityTags.activityId,
        tagId: tags.id,
        tagDisplayName: tags.displayName,
        tagKey: tags.key,
      })
      .from(activityTags)
      .innerJoin(tags, eq(activityTags.tagId, tags.id))
      .where(
        and(
          inArray(activityTags.activityId, activityIds),
          eq(activityTags.isActive, true),
          eq(tags.isActive, true)
        )
      );

    const map = new Map<number, Array<{ id: string; text: string }>>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push({
        id: row.tagId,
        text: row.tagDisplayName ?? row.tagKey ?? '',
      });
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Fetch pitch statuses for multiple activities
   */
  private async fetchPitchStatusesForActivities(
    activityIds: number[]
  ): Promise<Map<number, string>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const activityResults = await this.databaseService.db
      .select({
        id: activities.id,
        pitchStatusId: activities.pitchStatusId,
      })
      .from(activities)
      .where(inArray(activities.id, activityIds));

    const pitchStatusIds = activityResults
      .map((a) => a.pitchStatusId)
      .filter((id): id is number => id !== null && id !== undefined);

    if (pitchStatusIds.length === 0) {
      return new Map();
    }

    const pitchStatusResults = await this.databaseService.db
      .select({
        id: pitchStatuses.id,
        name: pitchStatuses.name,
      })
      .from(pitchStatuses)
      .where(
        and(
          inArray(pitchStatuses.id, pitchStatusIds),
          eq(pitchStatuses.isActive, true)
        )
      );

    const statusMap = new Map<number, string>(
      pitchStatusResults.map((s) => [s.id, s.name])
    );

    const resultMap = new Map<number, string>();
    for (const activity of activityResults) {
      if (activity.pitchStatusId) {
        const statusName = statusMap.get(activity.pitchStatusId);
        if (statusName) {
          resultMap.set(activity.id, statusName);
        }
      }
    }
    return resultMap;
  }

  /**
   * Fetch date statuses for multiple activities
   */
  private async fetchDateStatusesForActivities(
    activityIds: number[]
  ): Promise<Map<number, string>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const activityResults = await this.databaseService.db
      .select({
        id: activities.id,
        dateStatusId: activities.dateStatusId,
      })
      .from(activities)
      .where(inArray(activities.id, activityIds));

    const dateStatusIds = activityResults
      .map((a) => a.dateStatusId)
      .filter((id): id is number => id !== null && id !== undefined);

    if (dateStatusIds.length === 0) {
      return new Map();
    }

    const dateStatusResults = await this.databaseService.db
      .select({
        id: dateStatuses.id,
        name: dateStatuses.name,
      })
      .from(dateStatuses)
      .where(
        and(
          inArray(dateStatuses.id, dateStatusIds),
          eq(dateStatuses.isActive, true)
        )
      );

    const statusMap = new Map<number, string>(
      dateStatusResults.map((s) => [s.id, s.name])
    );

    const resultMap = new Map<number, string>();
    for (const activity of activityResults) {
      if (activity.dateStatusId) {
        const statusName = statusMap.get(activity.dateStatusId);
        if (statusName) {
          resultMap.set(activity.id, statusName);
        }
      }
    }
    return resultMap;
  }

  /**
   * Fetch time statuses for multiple activities
   */
  private async fetchTimeStatusesForActivities(
    activityIds: number[]
  ): Promise<Map<number, string>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const activityResults = await this.databaseService.db
      .select({
        id: activities.id,
        timeStatusId: activities.timeStatusId,
      })
      .from(activities)
      .where(inArray(activities.id, activityIds));

    const timeStatusIds = activityResults
      .map((a) => a.timeStatusId)
      .filter((id): id is number => id !== null && id !== undefined);

    if (timeStatusIds.length === 0) {
      return new Map();
    }

    const timeStatusResults = await this.databaseService.db
      .select({
        id: timeStatuses.id,
        name: timeStatuses.name,
      })
      .from(timeStatuses)
      .where(
        and(
          inArray(timeStatuses.id, timeStatusIds),
          eq(timeStatuses.isActive, true)
        )
      );

    const statusMap = new Map<number, string>(
      timeStatusResults.map((s) => [s.id, s.name])
    );

    const resultMap = new Map<number, string>();
    for (const activity of activityResults) {
      if (activity.timeStatusId) {
        const statusName = statusMap.get(activity.timeStatusId);
        if (statusName) {
          resultMap.set(activity.id, statusName);
        }
      }
    }
    return resultMap;
  }

  /**
   * Fetch venue statuses for multiple activities
   */
  private async fetchVenueStatusesForActivities(
    activityIds: number[]
  ): Promise<Map<number, string | null>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const activityResults = await this.databaseService.db
      .select({
        id: activities.id,
        venueStatusId: activities.venueStatusId,
      })
      .from(activities)
      .where(inArray(activities.id, activityIds));

    const venueStatusIds = activityResults
      .map((a) => a.venueStatusId)
      .filter((id): id is number => id !== null && id !== undefined);

    if (venueStatusIds.length === 0) {
      // Return map with null values for activities without venue status
      const resultMap = new Map<number, string | null>();
      for (const activity of activityResults) {
        resultMap.set(activity.id, null);
      }
      return resultMap;
    }

    const venueStatusResults = await this.databaseService.db
      .select({
        id: venueStatuses.id,
        name: venueStatuses.name,
      })
      .from(venueStatuses)
      .where(
        and(
          inArray(venueStatuses.id, venueStatusIds),
          eq(venueStatuses.isActive, true)
        )
      );

    const statusMap = new Map<number, string>(
      venueStatusResults.map((s) => [s.id, s.name])
    );

    const resultMap = new Map<number, string | null>();
    for (const activity of activityResults) {
      if (activity.venueStatusId) {
        const statusName = statusMap.get(activity.venueStatusId);
        resultMap.set(activity.id, statusName ?? null);
      } else {
        resultMap.set(activity.id, null);
      }
    }
    return resultMap;
  }

  /**
   * Fetch joint organizations for multiple activities
   */
  private async fetchJointOrgsForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityJointOrgs.activityId,
        organizationId: organizations.id,
      })
      .from(activityJointOrgs)
      .innerJoin(
        organizations,
        eq(activityJointOrgs.organizationId, organizations.id)
      )
      .where(
        and(
          inArray(activityJointOrgs.activityId, activityIds),
          eq(activityJointOrgs.isActive, true)
        )
      );

    const map = new Map<number, string[]>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push(row.organizationId);
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Fetch related activities for multiple activities
   */
  private async fetchRelatedActivitiesForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityRelatedEntries.activityId,
        relatedActivityId: activityRelatedEntries.relatedActivityId,
      })
      .from(activityRelatedEntries)
      .where(
        and(
          inArray(activityRelatedEntries.activityId, activityIds),
          eq(activityRelatedEntries.isActive, true)
        )
      );

    const map = new Map<number, string[]>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push(row.relatedActivityId.toString());
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Fetch comms materials for multiple activities
   */
  private async fetchCommsMaterialsForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityCommsMaterials.activityId,
        commsMaterialName: commsMaterials.name,
      })
      .from(activityCommsMaterials)
      .innerJoin(
        commsMaterials,
        eq(activityCommsMaterials.commsMaterialId, commsMaterials.id)
      )
      .where(
        and(
          inArray(activityCommsMaterials.activityId, activityIds),
          eq(activityCommsMaterials.isActive, true),
          eq(commsMaterials.isActive, true)
        )
      );

    const map = new Map<number, string[]>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push(row.commsMaterialName);
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Fetch translation languages for multiple activities
   */
  private async fetchTranslationsRequiredForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityTranslationsRequired.activityId,
        languageName: translatedLanguages.name,
      })
      .from(activityTranslationsRequired)
      .innerJoin(
        translatedLanguages,
        eq(activityTranslationsRequired.languageId, translatedLanguages.id)
      )
      .where(
        and(
          inArray(activityTranslationsRequired.activityId, activityIds),
          eq(activityTranslationsRequired.isActive, true),
          eq(translatedLanguages.isActive, true)
        )
      );

    const map = new Map<number, string[]>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push(row.languageName);
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Fetch joint event organizations for multiple activities
   */
  private async fetchjointEventOrgsForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityJointEventOrgs.activityId,
        organizationId: organizations.id,
      })
      .from(activityJointEventOrgs)
      .innerJoin(
        organizations,
        eq(activityJointEventOrgs.organizationId, organizations.id)
      )
      .where(
        and(
          inArray(activityJointEventOrgs.activityId, activityIds),
          eq(activityJointEventOrgs.isActive, true)
        )
      );

    const map = new Map<number, string[]>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push(row.organizationId);
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Fetch representatives attending for multiple activities
   */
  private async fetchRepresentativesAttendingForActivities(
    activityIds: number[]
  ): Promise<
    Map<
      number,
      Array<{
        representative: string;
        attendingStatus: 'requested' | 'declined' | 'confirmed';
      }>
    >
  > {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityRepresentatives.activityId,
        representativeName: activityRepresentatives.representativeName,
        attendingStatus: activityRepresentatives.attendingStatus,
      })
      .from(activityRepresentatives)
      .where(
        and(
          inArray(activityRepresentatives.activityId, activityIds),
          eq(activityRepresentatives.isActive, true)
        )
      );

    const map = new Map<
      number,
      Array<{
        representative: string;
        attendingStatus: 'requested' | 'declined' | 'confirmed';
      }>
    >();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      // Use representativeName (governmentRepresentatives lookup table has been removed)
      if (row.representativeName) {
        const attendingStatus = row.attendingStatus as
          | 'requested'
          | 'declined'
          | 'confirmed';
        existing.push({
          representative: row.representativeName,
          attendingStatus,
        });
        map.set(row.activityId, existing);
      }
    }
    return map;
  }

  /**
   * Fetch shared with organizations for multiple activities
   */
  private async fetchSharedWithOrgsForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activitySharedWithOrgs.activityId,
        organizationId: organizations.id,
      })
      .from(activitySharedWithOrgs)
      .innerJoin(
        organizations,
        eq(activitySharedWithOrgs.organizationId, organizations.id)
      )
      .where(
        and(
          inArray(activitySharedWithOrgs.activityId, activityIds),
          eq(activitySharedWithOrgs.isActive, true)
        )
      );

    const map = new Map<number, string[]>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push(row.organizationId);
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Fetch can edit users for multiple activities
   */
  private async fetchCanEditUsersForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityCanEditUsers.activityId,
        userId: systemUsers.id,
      })
      .from(activityCanEditUsers)
      .innerJoin(systemUsers, eq(activityCanEditUsers.userId, systemUsers.id))
      .where(
        and(
          inArray(activityCanEditUsers.activityId, activityIds),
          eq(activityCanEditUsers.isActive, true)
        )
      );

    const map = new Map<number, string[]>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push(row.userId.toString());
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Fetch can view users for multiple activities
   */
  private async fetchCanViewUsersForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityCanViewUsers.activityId,
        userId: systemUsers.id,
      })
      .from(activityCanViewUsers)
      .innerJoin(systemUsers, eq(activityCanViewUsers.userId, systemUsers.id))
      .where(
        and(
          inArray(activityCanViewUsers.activityId, activityIds),
          eq(activityCanViewUsers.isActive, true)
        )
      );

    const map = new Map<number, string[]>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push(row.userId.toString());
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Fetch additional owners for multiple activities
   */
  private async fetchAdditionalOwnersForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityAdditionalOwners.activityId,
        userId: systemUsers.id,
      })
      .from(activityAdditionalOwners)
      .innerJoin(
        systemUsers,
        eq(activityAdditionalOwners.userId, systemUsers.id)
      )
      .where(
        and(
          inArray(activityAdditionalOwners.activityId, activityIds),
          eq(activityAdditionalOwners.isActive, true)
        )
      );

    const map = new Map<number, string[]>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push(row.userId.toString());
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Map database Activity to API ActivityResponse
   * Validates against Zod schema to ensure DTO matches schema contract
   */
  private mapToResponseDto(
    activity: Activity,
    relatedData?: {
      categories?: string[];
      tags?: Array<{ id: string; text: string }>;
      pitchStatus?: string;
      dateStatus?: string;
      timeStatus?: string;
      venueStatus?: string | null;
      jointOrg?: string[];
      relatedActivities?: string[];
      commsMaterials?: string[];
      translationsRequired?: string[];
      jointEventOrg?: string[];
      representativesAttending?: Array<{
        representative: string;
        attendingStatus: 'requested' | 'declined' | 'confirmed';
      }>;
      sharedWith?: string[];
      canEdit?: string[];
      canView?: string[];
      additionalOwners?: string[];
    }
  ): ActivityResponseDto {
    // Format date to YYYY-MM-DD
    const formatDate = (date: Date | string | null): string | null => {
      if (!date) return null;
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toISOString().split('T')[0] ?? null;
    };

    // Format time to HH:mm
    const formatTime = (time: string | null): string | null => {
      if (!time) return null;
      // If it's already in HH:mm format, return as is
      if (time.match(/^\d{2}:\d{2}$/)) return time;
      // If it's a full time string, extract HH:mm
      return time.substring(0, 5);
    };

    const dto = {
      id: activity.id,
      displayId: activity.displayId ?? '',

      // Activity status and category
      activityStatusId: activity.activityStatusId?.toString() ?? 'unknown',
      pitchStatusId: activity.pitchStatusId?.toString() ?? 'unknown',
      dateStatusId: activity.dateStatusId?.toString() ?? 'unknown',
      timeStatusId: activity.timeStatusId?.toString() ?? 'unknown',
      venueStatusId: activity.venueStatusId?.toString() ?? null,
      category: relatedData?.categories ?? [],

      // Basic info
      title: activity.title ?? '',
      summary: activity.summary ?? '',
      isIssue: activity.isIssue ?? false,
      isActive: activity.isActive ?? true,

      // Organizations
      leadOrgId: activity.leadOrgId ?? null,
      leadOrgName: activity.leadOrgName ?? null,
      leadOrg: activity.leadOrgId ?? null, // Backward compatibility
      eventLeadOrgId: activity.eventLeadOrgId ?? null,
      eventLeadOrgName: activity.eventLeadOrgName ?? null,
      eventLeadOrg: activity.eventLeadOrgId ?? null, // Backward compatibility
      jointOrg: relatedData?.jointOrg ?? [],

      // Related activities and tags
      relatedActivities: relatedData?.relatedActivities ?? [],
      tags: relatedData?.tags ?? [],

      // Approvals
      significance: activity.significance ?? '',
      pitchStatus: relatedData?.pitchStatus ?? 'unknown',
      pitchComments: activity.pitchComments ?? null,

      // Scheduling
      dateStatus: relatedData?.dateStatus ?? 'unknown',
      timeStatus: relatedData?.timeStatus ?? 'unknown',
      isAllDay: activity.isAllDay ?? false,
      startDate: formatDate(activity.startDate),
      startTime: formatTime(activity.startTime),
      endDate: formatDate(activity.endDate),
      endTime: formatTime(activity.endTime),
      schedulingConsiderations: activity.schedulingConsiderations ?? '',

      // Comms
      commsMaterials: relatedData?.commsMaterials ?? [],
      newsReleaseId: activity.newsReleaseId ?? null,
      newsReleaseOriginId: activity.newsReleaseOriginId ?? null,
      newsReleaseOriginName: activity.newsReleaseOriginName ?? null,
      translationsRequired: relatedData?.translationsRequired ?? [],

      // Event
      jointEventOrg: relatedData?.jointEventOrg ?? [],
      representativesAttending: relatedData?.representativesAttending ?? [],
      venue: activity.venue ?? null,
      venueStatus: relatedData?.venueStatus ?? null,
      venueAddress:
        (activity.venueAddress as {
          street: string;
          city: string;
          provinceOrState: string;
          country: string;
        } | null) ?? null,
      eventLeadId: activity.eventLeadId?.toString() ?? null,
      eventLead:
        activity.eventLeadId?.toString() ??
        ('eventLeadName' in activity &&
        typeof activity.eventLeadName === 'string'
          ? activity.eventLeadName
          : null),
      eventLeadName:
        'eventLeadName' in activity &&
        typeof activity.eventLeadName === 'string'
          ? activity.eventLeadName
          : null,
      graphicsUserId: activity.graphicsUserId?.toString() ?? null,
      graphicsUser: activity.graphicsUserId?.toString() ?? null,

      // Reports
      notForLookAhead: activity.notForLookAhead ?? false,
      notForThirtySixtyNinety: activity.notForThirtySixtyNinety ?? false,
      lookAheadStatus:
        (activity.lookAheadStatus as 'none' | 'new' | 'changed') ?? 'none',
      lookAheadSection:
        (activity.lookAheadSection as
          | 'events'
          | 'issues'
          | 'news'
          | 'awareness') ?? 'events',

      // Sharing
      ownerId: activity.ownerId?.toString() ?? 'unknown',
      ministryOwnerId: activity.ministryOwnerId ?? null,
      owner: activity.ownerId?.toString() ?? 'unknown',
      sharedWith: relatedData?.sharedWith ?? [],
      canEdit: relatedData?.canEdit ?? [],
      canView: relatedData?.canView ?? [],
      additionalOwners: relatedData?.additionalOwners ?? [],
      calendarVisibility:
        (activity.calendarVisibility as 'visible' | 'partial' | 'hidden') ??
        'visible',

      // Meta
      createdDateTime:
        activity.createdDateTime?.toISOString() ?? new Date().toISOString(),
      createdBy: activity.createdBy?.toString() ?? 'unknown',
      lastUpdatedDateTime:
        activity.lastUpdatedDateTime?.toISOString() ??
        activity.createdDateTime?.toISOString() ??
        new Date().toISOString(),
      lastUpdatedBy: activity.lastUpdatedBy?.toString() ?? 'unknown',
    };

    // Compile-time validation: ensure the mapping produces a value that matches the schema
    // This provides compile-time guarantee that the mapping is correct
    // Using double assertion to work around type cache issues - runtime validation ensures correctness
    const validatedDto = ensureMatchesSchema(
      activityResponseSchema,
      dto as unknown as z.infer<typeof activityResponseSchema>
    );

    // Runtime validation to ensure DTO matches schema contract
    // This catches misalignment between the mapping logic and the schema
    // Runs in all environments to catch issues early
    try {
      activityResponseSchema.parse(validatedDto);
    } catch (error) {
      // Log validation errors with context for debugging
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown validation error';
      console.error(
        `[ActivitiesService] Response DTO validation failed for activity ${activity.id}:`,
        errorMessage
      );
      // Fail-fast in all environments to prevent invalid responses
      throw new Error(
        `Response DTO validation failed: ${errorMessage}. This indicates a mismatch between the mapping logic and the ActivityResponse schema.`
      );
    }

    // Return as DTO class instance for better IDE support and explicit contracts
    return ActivityResponseDto.from(validatedDto);
  }

  /**
   * Validate that all category IDs exist in the database
   */
  private async validateCategoryIds(categoryIds: number[]): Promise<void> {
    if (categoryIds.length === 0) {
      return;
    }

    const existingCategories = await this.databaseService.db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(inArray(categories.id, categoryIds), eq(categories.isActive, true))
      );

    const existingIds = new Set(existingCategories.map((c) => c.id));
    const missingIds = categoryIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Invalid category IDs: ${missingIds.join(', ')}. These categories do not exist or are not active.`
      );
    }
  }

  public async fetchCategories(): Promise<Category[]> {
    const results = await this.databaseService.db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.name);

    return results;
  }
}
