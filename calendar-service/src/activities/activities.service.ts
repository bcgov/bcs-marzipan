import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, gte, lte, inArray, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import {
  activities,
  activityStatuses,
  pitchStatuses,
  dateStatuses,
  timeStatuses,
  venueStatuses,
  venueAddresses,
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
  activitySharedWithMinistries,
  activityAdditionalOwners,
  organizations,
  commsMaterials,
  translatedLanguages,
  systemUsers,
  ministries,
  activityHistory,
  governmentRepresentatives,
} from '@corpcal/database/schema';
import type { Activity, Category } from '@corpcal/database/types';
import type {
  CreateActivityRequest,
  UpdateActivityRequest,
  FilterActivities,
} from '@corpcal/shared/schemas';
import {
  activityResponseSchema,
  type ActivityResponse,
} from '@corpcal/shared/schemas';
import type {
  AttendingStatus,
  LookAheadStatus,
  LookAheadSection,
  CalendarVisibility,
} from '@corpcal/shared';
import {
  LOOK_AHEAD_STATUS,
  LOOK_AHEAD_SECTION,
  CALENDAR_VISIBILITY,
} from '@corpcal/shared';
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
  async create(dto: CreateActivityRequest): Promise<ActivityResponse> {
    // Extract junction table IDs and venue address from the DTO
    // These fields are defined in createActivityRequestSchema but not in the base activity schema
    const {
      categoryIds,
      tagIds,
      jointOrgIds,
      relatedActivityIds,
      commsMaterialIds,
      translationLanguageIds,
      jointEventOrgIds,
      sharedWithMinistryIds,
      additionalOwnerIds,
      representatives,
      venueAddress,
      ...activityData
    } = dto;

    // Validate category IDs if provided
    if (categoryIds && categoryIds.length > 0) {
      await this.validateCategoryIds(categoryIds);
    }

    // TODO: Get current user ID from auth context
    const currentUserId = 1;
    const now = new Date();

    // Use transaction to ensure atomicity of activity and junction table inserts
    const result = await this.databaseService.db.transaction(async (tx) => {
      // Insert activity with displayId: null (will be updated after getting activity ID)
      const newActivity = {
        ...activityData,
        displayId: null as string | null,
        createdBy: currentUserId,
        lastUpdatedBy: currentUserId,
        createdDateTime: now,
        lastUpdatedDateTime: now,
      };

      // Insert the activity
      const [created] = await tx
        .insert(activities)
        .values(newActivity as unknown as typeof activities.$inferInsert)
        .returning();

      const activityId = created.id;

      // Fetch ministry abbreviation to generate displayId
      // ministryOwnerId is required, so it should always be present
      // TODO: refactor so that we do not need to fetch ministry abbreviation again here.
      if (!activityData.ministryOwnerId) {
        throw new BadRequestException('ministryOwnerId is required');
      }

      const [ministry] = await tx
        .select({ abbreviation: ministries.abbreviation })
        .from(ministries)
        .where(eq(ministries.id, activityData.ministryOwnerId))
        .limit(1);

      if (!ministry || !ministry.abbreviation) {
        throw new BadRequestException(
          `Ministry with ID ${activityData.ministryOwnerId} not found or missing abbreviation`
        );
      }

      // Generate displayId using ministry abbreviation and activity ID
      const displayId = this.generateDisplayId(
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
        await tx.insert(venueAddresses).values({
          activityId,
          venueName: venueAddress.venueName,
          street: venueAddress.street,
          city: venueAddress.city,
          provinceOrState: venueAddress.provinceOrState,
          country: venueAddress.country,
        });
      }

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
        // Shared With Ministries
        this.insertJunctionRecords(
          tx,
          activitySharedWithMinistries,
          activityId,
          sharedWithMinistryIds,
          (id: string) => ({ ministryId: id }),
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
        // Representatives with attending status
        this.insertRepresentatives(tx, activityId, representatives, now),
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
   * Generate displayId from ministry abbreviation and activity ID
   * Format: <ACRONYM>-<last 6 digits of id>
   * Example: AG-000123 (Attorney General, activity ID 123)
   * Example: HLTH-456789 (Health, activity ID 123456789)
   *
   * @param ministryAbbreviation - Ministry abbreviation from ministries table
   * @param activityId - Activity ID (serial)
   * @returns Formatted displayId string
   */
  private generateDisplayId(
    ministryAbbreviation: string,
    activityId: number
  ): string {
    // Get last 6 digits of activity ID
    const lastSixDigits = activityId.toString().slice(-6).padStart(6, '0');
    return `${ministryAbbreviation.toUpperCase().trim()}-${lastSixDigits}`;
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
   * Insert representatives with attending status into activityRepresentatives table
   *
   * @param tx - Database transaction
   * @param activityId - ID of the activity
   * @param representatives - Array of representatives with attending status
   * @param currentUserId - ID of the user creating the records
   * @param now - Current timestamp
   */
  private async insertRepresentatives(
    tx: Parameters<
      Parameters<typeof this.databaseService.db.transaction>[0]
    >[0],
    activityId: number,
    representatives:
      | Array<{ representativeId: number; attendingStatus: AttendingStatus }>
      | undefined,
    now: Date
  ): Promise<void> {
    if (!representatives || representatives.length === 0) {
      return;
    }

    // Fetch representative names from lookup table
    const representativeIds = representatives.map((r) => r.representativeId);
    const repLookup = await tx
      .select({
        id: governmentRepresentatives.id,
        name: governmentRepresentatives.name,
        displayName: governmentRepresentatives.displayName,
      })
      .from(governmentRepresentatives)
      .where(inArray(governmentRepresentatives.id, representativeIds));

    const repMap = new Map(
      repLookup.map((r) => [r.id, r.displayName || r.name])
    );

    // Insert representatives with attending status
    await tx.insert(activityRepresentatives).values(
      representatives.map((rep) => ({
        activityId,
        representativeId: rep.representativeId,
        representativeName: repMap.get(rep.representativeId) || null,
        attendingStatus: rep.attendingStatus,
        isActive: true,
        timestamp: now,
      }))
    );
  }

  /**
   * Find all activities with optional filtering
   */
  async findAll(filters?: FilterActivities): Promise<ActivityResponse[]> {
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
    // Collect all user IDs that need to be fetched
    const userIds = new Set<number>();
    for (const activity of activityResults) {
      if (activity.ownerId) userIds.add(activity.ownerId);
      if (activity.eventPlannerId) userIds.add(activity.eventPlannerId);
      if (activity.graphicsUserId) userIds.add(activity.graphicsUserId);
    }

    const [
      categoriesResult,
      tagsMap,
      activityStatusesMap,
      pitchStatusesMap,
      dateStatusesMap,
      timeStatusesMap,
      venueStatusesMap,
      venueAddressesMap,
      jointOrgMap,
      relatedActivitiesMap,
      commsMaterialsMap,
      translationsRequiredMap,
      jointEventOrgMap,
      representativesAttendingMap,
      sharedWithMap,
      additionalOwnersMap,
      userNamesMap,
      leadOrgNamesMap,
      eventLeadOrgNamesMap,
    ] = await Promise.all([
      this.fetchCategoriesForActivities(activityIds),
      this.fetchTagsForActivities(activityIds),
      this.fetchActivityStatusesForActivities(activityIds),
      this.fetchPitchStatusesForActivities(activityIds),
      this.fetchDateStatusesForActivities(activityIds),
      this.fetchTimeStatusesForActivities(activityIds),
      this.fetchVenueStatusesForActivities(activityIds),
      this.fetchVenueAddressesForActivities(activityIds),
      this.fetchJointOrgsForActivities(activityIds),
      this.fetchRelatedActivitiesForActivities(activityIds),
      this.fetchCommsMaterialsForActivities(activityIds),
      this.fetchTranslationsRequiredForActivities(activityIds),
      this.fetchjointEventOrgsForActivities(activityIds),
      this.fetchRepresentativesAttendingForActivities(activityIds),
      this.fetchSharedWithOrgsForActivities(activityIds),
      this.fetchAdditionalOwnersForActivities(activityIds),
      this.fetchUserNamesForUserIds(Array.from(userIds)),
      this.fetchLeadOrgNamesForActivities(activityResults),
      this.fetchEventLeadOrgNamesForActivities(activityResults),
    ]);

    const { namesMap: categoriesMap, idsMap: categoryIdsMap } =
      categoriesResult;

    return activityResults.map((activity) =>
      this.mapToResponseDto(activity, {
        categories: categoriesMap.get(activity.id) ?? [],
        categoryIds: categoryIdsMap.get(activity.id) ?? [],
        tags: tagsMap.get(activity.id) ?? [],
        activityStatus: activityStatusesMap.get(activity.id),
        pitchStatus: pitchStatusesMap.get(activity.id),
        dateStatus: dateStatusesMap.get(activity.id),
        timeStatus: timeStatusesMap.get(activity.id),
        venueStatus: venueStatusesMap.get(activity.id) ?? null,
        venueAddress: venueAddressesMap.get(activity.id) ?? null,
        jointOrg: jointOrgMap.get(activity.id) ?? [],
        relatedActivities: relatedActivitiesMap.get(activity.id) ?? [],
        commsMaterials: commsMaterialsMap.get(activity.id) ?? [],
        translationsRequired: translationsRequiredMap.get(activity.id) ?? [],
        jointEventOrg: jointEventOrgMap.get(activity.id) ?? [],
        representativesAttending:
          representativesAttendingMap.get(activity.id) ?? [],
        sharedWith: sharedWithMap.get(activity.id) ?? [],
        additionalOwners: additionalOwnersMap.get(activity.id) ?? [],
        ownerName: activity.ownerId
          ? (userNamesMap.get(activity.ownerId) ?? null)
          : null,
        eventLeadName: activity.eventPlannerId
          ? (userNamesMap.get(activity.eventPlannerId) ?? null)
          : null,
        graphicsUserName: activity.graphicsUserId
          ? (userNamesMap.get(activity.graphicsUserId) ?? null)
          : null,
        leadOrgName: leadOrgNamesMap.get(activity.id) ?? null,
        eventLeadOrgName: eventLeadOrgNamesMap.get(activity.id) ?? null,
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

    // Collect user IDs that need to be fetched
    const userIds: number[] = [];
    if (activity.ownerId) userIds.push(activity.ownerId);
    if (activity.eventPlannerId) userIds.push(activity.eventPlannerId);
    if (activity.graphicsUserId) userIds.push(activity.graphicsUserId);

    // Fetch related data
    const [
      categoriesResult,
      tagsList,
      activityStatus,
      pitchStatus,
      dateStatus,
      timeStatus,
      venueStatus,
      venueAddressesMap,
      jointOrg,
      relatedActivities,
      commsMaterials,
      translationsRequired,
      jointEventOrg,
      representativesAttending,
      sharedWith,
      additionalOwners,
      userNamesMap,
      leadOrgNamesMap,
      eventLeadOrgNamesMap,
    ] = await Promise.all([
      this.fetchCategoriesForActivities([id]),
      this.fetchTagsForActivities([id]),
      this.fetchActivityStatusesForActivities([id]),
      this.fetchPitchStatusesForActivities([id]),
      this.fetchDateStatusesForActivities([id]),
      this.fetchTimeStatusesForActivities([id]),
      this.fetchVenueStatusesForActivities([id]),
      this.fetchVenueAddressesForActivities([id]),
      this.fetchJointOrgsForActivities([id]),
      this.fetchRelatedActivitiesForActivities([id]),
      this.fetchCommsMaterialsForActivities([id]),
      this.fetchTranslationsRequiredForActivities([id]),
      this.fetchjointEventOrgsForActivities([id]),
      this.fetchRepresentativesAttendingForActivities([id]),
      this.fetchSharedWithOrgsForActivities([id]),
      this.fetchAdditionalOwnersForActivities([id]),
      this.fetchUserNamesForUserIds(userIds),
      this.fetchLeadOrgNamesForActivities([activity]),
      this.fetchEventLeadOrgNamesForActivities([activity]),
    ]);

    const { namesMap: categoriesList, idsMap: categoryIdsList } =
      categoriesResult;

    return this.mapToResponseDto(activity, {
      categories: categoriesList.get(id) ?? [],
      categoryIds: categoryIdsList.get(id) ?? [],
      tags: tagsList.get(id) ?? [],
      activityStatus: activityStatus.get(id),
      pitchStatus: pitchStatus.get(id),
      dateStatus: dateStatus.get(id),
      timeStatus: timeStatus.get(id),
      venueStatus: venueStatus.get(id) ?? null,
      venueAddress: venueAddressesMap.get(id) ?? null,
      jointOrg: jointOrg.get(id) ?? [],
      relatedActivities: relatedActivities.get(id) ?? [],
      commsMaterials: commsMaterials.get(id) ?? [],
      translationsRequired: translationsRequired.get(id) ?? [],
      jointEventOrg: jointEventOrg.get(id) ?? [],
      representativesAttending: representativesAttending.get(id) ?? [],
      sharedWith: sharedWith.get(id) ?? [],
      additionalOwners: additionalOwners.get(id) ?? [],
      ownerName: activity.ownerId
        ? (userNamesMap.get(activity.ownerId) ?? null)
        : null,
      eventLeadName: activity.eventPlannerId
        ? (userNamesMap.get(activity.eventPlannerId) ?? null)
        : null,
      graphicsUserName: activity.graphicsUserId
        ? (userNamesMap.get(activity.graphicsUserId) ?? null)
        : null,
      leadOrgName: leadOrgNamesMap.get(id) ?? null,
      eventLeadOrgName: eventLeadOrgNamesMap.get(id) ?? null,
    });
  }

  /**
   * Update an activity
   */
  async update(
    id: number,
    dto: UpdateActivityRequest
  ): Promise<ActivityResponse> {
    // Verify activity exists (throws NotFoundException if not found)
    await this.findOne(id);

    // Extract venueAddress from DTO
    const { venueAddress, ...activityUpdateData } = dto;

    const updateData: Partial<Activity> = {
      ...(activityUpdateData as Partial<Activity>),
      lastUpdatedDateTime: new Date(),
    };

    // TODO: Get current user ID from auth context
    // const currentUserId = 1;

    // Use transaction to ensure atomicity of activity and venue address updates
    const updated = await this.databaseService.db.transaction(async (tx) => {
      // If ministryOwnerId is being updated, recalculate displayId
      // TODO: consider if users still need to reference previous displayId.
      if (dto.ministryOwnerId !== undefined && dto.ministryOwnerId !== null) {
        // Fetch the new ministry abbreviation
        const [ministry] = await tx
          .select({ abbreviation: ministries.abbreviation })
          .from(ministries)
          .where(eq(ministries.id, dto.ministryOwnerId))
          .limit(1);

        if (!ministry || !ministry.abbreviation) {
          throw new BadRequestException(
            `Ministry with ID ${dto.ministryOwnerId} not found or missing abbreviation`
          );
        }

        // Generate new displayId using the new ministry abbreviation
        const newDisplayId = this.generateDisplayId(ministry.abbreviation, id);
        updateData.displayId = newDisplayId;
      }

      const [updatedActivity] = await tx
        .update(activities)
        .set(updateData)
        .where(eq(activities.id, id))
        .returning();

      // Handle venue address update
      if (venueAddress !== undefined) {
        if (venueAddress === null) {
          // Delete venue address if explicitly set to null
          await tx
            .delete(venueAddresses)
            .where(eq(venueAddresses.activityId, id));
        } else {
          // Upsert venue address
          const existingAddress = await tx
            .select()
            .from(venueAddresses)
            .where(eq(venueAddresses.activityId, id))
            .limit(1);

          if (existingAddress.length > 0) {
            // Update existing address
            await tx
              .update(venueAddresses)
              .set({
                venueName: venueAddress.venueName,
                street: venueAddress.street,
                city: venueAddress.city,
                provinceOrState: venueAddress.provinceOrState,
                country: venueAddress.country,
              })
              .where(eq(venueAddresses.activityId, id));
          } else {
            // Insert new address
            await tx.insert(venueAddresses).values({
              activityId: id,
              venueName: venueAddress.venueName,
              street: venueAddress.street,
              city: venueAddress.city,
              provinceOrState: venueAddress.provinceOrState,
              country: venueAddress.country,
            });
          }
        }
      }

      return updatedActivity;
    });

    // Collect user IDs that need to be fetched
    const userIds: number[] = [];
    if (updated.ownerId) userIds.push(updated.ownerId);
    if (updated.eventPlannerId) userIds.push(updated.eventPlannerId);
    if (updated.graphicsUserId) userIds.push(updated.graphicsUserId);

    // Fetch related data for the updated activity
    const [
      categoriesResult,
      tagsList,
      activityStatus,
      pitchStatus,
      dateStatus,
      timeStatus,
      venueStatus,
      venueAddressesMap,
      jointOrg,
      relatedActivities,
      commsMaterials,
      translationsRequired,
      jointEventOrg,
      representativesAttending,
      sharedWith,
      additionalOwners,
      userNamesMap,
    ] = await Promise.all([
      this.fetchCategoriesForActivities([id]),
      this.fetchTagsForActivities([id]),
      this.fetchActivityStatusesForActivities([id]),
      this.fetchPitchStatusesForActivities([id]),
      this.fetchDateStatusesForActivities([id]),
      this.fetchTimeStatusesForActivities([id]),
      this.fetchVenueStatusesForActivities([id]),
      this.fetchVenueAddressesForActivities([id]),
      this.fetchJointOrgsForActivities([id]),
      this.fetchRelatedActivitiesForActivities([id]),
      this.fetchCommsMaterialsForActivities([id]),
      this.fetchTranslationsRequiredForActivities([id]),
      this.fetchjointEventOrgsForActivities([id]),
      this.fetchRepresentativesAttendingForActivities([id]),
      this.fetchSharedWithOrgsForActivities([id]),
      this.fetchAdditionalOwnersForActivities([id]),
      this.fetchUserNamesForUserIds(userIds),
    ]);

    const { namesMap: categoriesList, idsMap: categoryIdsList } =
      categoriesResult;

    const result = this.mapToResponseDto(updated, {
      categories: categoriesList.get(id) ?? [],
      categoryIds: categoryIdsList.get(id) ?? [],
      tags: tagsList.get(id) ?? [],
      activityStatus: activityStatus.get(id),
      pitchStatus: pitchStatus.get(id),
      dateStatus: dateStatus.get(id),
      timeStatus: timeStatus.get(id),
      venueStatus: venueStatus.get(id) ?? null,
      venueAddress: venueAddressesMap.get(id) ?? null,
      jointOrg: jointOrg.get(id) ?? [],
      relatedActivities: relatedActivities.get(id) ?? [],
      commsMaterials: commsMaterials.get(id) ?? [],
      translationsRequired: translationsRequired.get(id) ?? [],
      jointEventOrg: jointEventOrg.get(id) ?? [],
      representativesAttending: representativesAttending.get(id) ?? [],
      sharedWith: sharedWith.get(id) ?? [],
      additionalOwners: additionalOwners.get(id) ?? [],
      ownerName: updated.ownerId
        ? (userNamesMap.get(updated.ownerId) ?? null)
        : null,
      eventLeadName: updated.eventPlannerId
        ? (userNamesMap.get(updated.eventPlannerId) ?? null)
        : null,
      graphicsUserName: updated.graphicsUserId
        ? (userNamesMap.get(updated.graphicsUserId) ?? null)
        : null,
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

    // Collect user IDs that need to be fetched
    const userIds: number[] = [];
    if (updated.ownerId) userIds.push(updated.ownerId);
    if (updated.eventPlannerId) userIds.push(updated.eventPlannerId);
    if (updated.graphicsUserId) userIds.push(updated.graphicsUserId);

    // Fetch related data for the soft-deleted activity
    const [
      categoriesResult,
      tagsList,
      activityStatus,
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
      additionalOwners,
      userNamesMap,
    ] = await Promise.all([
      this.fetchCategoriesForActivities([id]),
      this.fetchTagsForActivities([id]),
      this.fetchActivityStatusesForActivities([id]),
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
      this.fetchAdditionalOwnersForActivities([id]),
      this.fetchUserNamesForUserIds(userIds),
    ]);

    const { namesMap: categoriesList, idsMap: categoryIdsList } =
      categoriesResult;

    return this.mapToResponseDto(updated, {
      categories: categoriesList.get(id) ?? [],
      categoryIds: categoryIdsList.get(id) ?? [],
      tags: tagsList.get(id) ?? [],
      activityStatus: activityStatus.get(id),
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
      additionalOwners: additionalOwners.get(id) ?? [],
      ownerName: updated.ownerId
        ? (userNamesMap.get(updated.ownerId) ?? null)
        : null,
      eventLeadName: updated.eventPlannerId
        ? (userNamesMap.get(updated.eventPlannerId) ?? null)
        : null,
      graphicsUserName: updated.graphicsUserId
        ? (userNamesMap.get(updated.graphicsUserId) ?? null)
        : null,
    });
  }

  /**
   * Fetch categories for multiple activities
   * Returns both category names and IDs for each activity
   */
  private async fetchCategoriesForActivities(activityIds: number[]): Promise<{
    namesMap: Map<number, string[]>;
    idsMap: Map<number, number[]>;
  }> {
    if (activityIds.length === 0) {
      return { namesMap: new Map(), idsMap: new Map() };
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityCategories.activityId,
        categoryId: activityCategories.categoryId,
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

    const namesMap = new Map<number, string[]>();
    const idsMap = new Map<number, number[]>();
    for (const row of results) {
      // Add category name
      const existingNames = namesMap.get(row.activityId) ?? [];
      existingNames.push(row.categoryName);
      namesMap.set(row.activityId, existingNames);

      // Add category ID
      const existingIds = idsMap.get(row.activityId) ?? [];
      existingIds.push(row.categoryId);
      idsMap.set(row.activityId, existingIds);
    }
    return { namesMap, idsMap };
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
   * Streamlined to use nullish coalescing
   */
  private async fetchVenueStatusesForActivities(
    activityIds: number[]
  ): Promise<Map<number, string>> {
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
      return new Map();
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

    const resultMap = new Map<number, string>();
    for (const activity of activityResults) {
      if (activity.venueStatusId) {
        const statusName = statusMap.get(activity.venueStatusId);
        if (statusName) {
          resultMap.set(activity.id, statusName);
        }
      }
    }
    return resultMap;
  }

  /**
   * Fetch venue addresses for multiple activities
   */
  private async fetchVenueAddressesForActivities(
    activityIds: number[]
  ): Promise<
    Map<
      number,
      {
        venueName: string | null;
        street: string | null;
        city: string | null;
        provinceOrState: string | null;
        country: string | null;
      } | null
    >
  > {
    if (activityIds.length === 0) {
      return new Map();
    }

    const venueAddressResults = await this.databaseService.db
      .select({
        activityId: venueAddresses.activityId,
        venueName: venueAddresses.venueName,
        street: venueAddresses.street,
        city: venueAddresses.city,
        provinceOrState: venueAddresses.provinceOrState,
        country: venueAddresses.country,
      })
      .from(venueAddresses)
      .where(inArray(venueAddresses.activityId, activityIds));

    const resultMap = new Map<
      number,
      {
        venueName: string | null;
        street: string | null;
        city: string | null;
        provinceOrState: string | null;
        country: string | null;
      } | null
    >();

    // Initialize all activities with null (no address)
    for (const activityId of activityIds) {
      resultMap.set(activityId, null);
    }

    // Set addresses for activities that have them
    for (const address of venueAddressResults) {
      resultMap.set(address.activityId, {
        venueName: address.venueName,
        street: address.street,
        city: address.city,
        provinceOrState: address.provinceOrState,
        country: address.country,
      });
    }

    return resultMap;
  }

  /**
   * Fetch activity statuses for multiple activities
   */
  private async fetchActivityStatusesForActivities(
    activityIds: number[]
  ): Promise<Map<number, string>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const activityResults = await this.databaseService.db
      .select({
        id: activities.id,
        activityStatusId: activities.activityStatusId,
      })
      .from(activities)
      .where(inArray(activities.id, activityIds));

    const activityStatusIds = activityResults
      .map((a) => a.activityStatusId)
      .filter((id): id is number => id !== null && id !== undefined);

    if (activityStatusIds.length === 0) {
      return new Map();
    }

    const activityStatusResults = await this.databaseService.db
      .select({
        id: activityStatuses.id,
        name: activityStatuses.name,
      })
      .from(activityStatuses)
      .where(
        and(
          inArray(activityStatuses.id, activityStatusIds),
          eq(activityStatuses.isActive, true)
        )
      );

    const statusMap = new Map<number, string>(
      activityStatusResults.map((s) => [s.id, s.name])
    );

    const resultMap = new Map<number, string>();
    for (const activity of activityResults) {
      if (activity.activityStatusId) {
        const statusName = statusMap.get(activity.activityStatusId);
        if (statusName) {
          resultMap.set(activity.id, statusName);
        }
      }
    }
    return resultMap;
  }

  /**
   * Fetch joint organizations for multiple activities
   * Returns organization name or dispaly name for UI
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
        organizationName:
          sql<string>`COALESCE(${organizations.displayName}, ${organizations.name})`.as(
            'organizationName'
          ),
      })
      .from(activityJointOrgs)
      .innerJoin(
        organizations,
        eq(activityJointOrgs.organizationId, organizations.id)
      )
      .where(
        and(
          inArray(activityJointOrgs.activityId, activityIds),
          eq(activityJointOrgs.isActive, true),
          eq(organizations.isActive, true)
        )
      );

    const map = new Map<number, string[]>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push(row.organizationName);
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Fetch related activities for multiple activities
   * Returns activity displayIds (or generated from ministryOwner displayName + last 6 digits of id if displayId is null) for UI display
   */
  private async fetchRelatedActivitiesForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    // Create alias for related activities table to avoid conflict with main activities table
    const relatedActivities = activities;

    const results = await this.databaseService.db
      .select({
        activityId: activityRelatedEntries.activityId,
        relatedActivityDisplay: sql<string>`
          COALESCE(
            ${relatedActivities.displayId},
            ${ministries.displayName} || '-' || LPAD(RIGHT(${relatedActivities.id}::text, 6), 6, '0')
          )
        `.as('relatedActivityDisplay'),
      })
      .from(activityRelatedEntries)
      .innerJoin(
        relatedActivities,
        eq(activityRelatedEntries.relatedActivityId, relatedActivities.id)
      )
      .innerJoin(
        ministries,
        eq(relatedActivities.ministryOwnerId, ministries.id)
      )
      .where(
        and(
          inArray(activityRelatedEntries.activityId, activityIds),
          eq(activityRelatedEntries.isActive, true),
          eq(relatedActivities.isActive, true)
        )
      );

    const map = new Map<number, string[]>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push(row.relatedActivityDisplay);
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
   * Returns organization display names (or names if displayName is null) for UI display
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
        organizationName:
          sql<string>`COALESCE(${organizations.displayName}, ${organizations.name})`.as(
            'organizationName'
          ),
      })
      .from(activityJointEventOrgs)
      .innerJoin(
        organizations,
        eq(activityJointEventOrgs.organizationId, organizations.id)
      )
      .where(
        and(
          inArray(activityJointEventOrgs.activityId, activityIds),
          eq(activityJointEventOrgs.isActive, true),
          eq(organizations.isActive, true)
        )
      );

    const map = new Map<number, string[]>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push(row.organizationName);
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
        attendingStatus: AttendingStatus;
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
        attendingStatus: AttendingStatus;
      }>
    >();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      // Use representativeName (governmentRepresentatives lookup table has been removed)
      if (row.representativeName) {
        const attendingStatus = row.attendingStatus as AttendingStatus;
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
   * Fetch shared with ministries for multiple activities
   * Returns ministry display names for UI display
   */
  private async fetchSharedWithOrgsForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activitySharedWithMinistries.activityId,
        ministryName: sql<string>`${ministries.displayName}`.as('ministryName'),
      })
      .from(activitySharedWithMinistries)
      .innerJoin(
        ministries,
        eq(activitySharedWithMinistries.ministryId, ministries.id)
      )
      .where(
        and(
          inArray(activitySharedWithMinistries.activityId, activityIds),
          eq(activitySharedWithMinistries.isActive, true),
          eq(ministries.isActive, true)
        )
      );

    const map = new Map<number, string[]>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push(row.ministryName);
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Fetch additional owners for multiple activities
   * Returns user display names (adDisplayName or adUsername) for UI display
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
        userName:
          sql<string>`COALESCE(${systemUsers.adDisplayName}, ${systemUsers.adUsername}, 'User ' || ${systemUsers.id}::text)`.as(
            'userName'
          ),
      })
      .from(activityAdditionalOwners)
      .innerJoin(
        systemUsers,
        eq(activityAdditionalOwners.userId, systemUsers.id)
      )
      .where(
        and(
          inArray(activityAdditionalOwners.activityId, activityIds),
          eq(activityAdditionalOwners.isActive, true),
          eq(systemUsers.isActive, true)
        )
      );

    const map = new Map<number, string[]>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push(row.userName);
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Fetch user names for multiple user IDs
   * Returns a map of userId -> user display name for UI display
   */
  private async fetchUserNamesForUserIds(
    userIds: number[]
  ): Promise<Map<number, string>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        userId: systemUsers.id,
        userName:
          sql<string>`COALESCE(${systemUsers.adDisplayName}, ${systemUsers.adUsername}, 'User ' || ${systemUsers.id}::text)`.as(
            'userName'
          ),
      })
      .from(systemUsers)
      .where(
        and(inArray(systemUsers.id, userIds), eq(systemUsers.isActive, true))
      );

    return new Map(results.map((row) => [row.userId, row.userName]));
  }

  /**
   * Fetch organization names for leadOrg and eventLeadOrg
   * Returns maps of activityId -> organization name
   * Uses free text name if available, otherwise looks up from organizations table
   */
  private async fetchLeadOrgNamesForActivities(
    activities: Activity[]
  ): Promise<Map<number, string | null>> {
    const map = new Map<number, string | null>();

    // Collect organization IDs that need to be looked up
    const orgIdsToLookup = new Set<string>();
    const activityIdToOrgId = new Map<number, string>();

    for (const activity of activities) {
      // If free text name exists, use it
      if (activity.leadOrgName) {
        map.set(activity.id, activity.leadOrgName);
      } else if (activity.leadOrgId) {
        // Need to look up organization name
        orgIdsToLookup.add(activity.leadOrgId);
        activityIdToOrgId.set(activity.id, activity.leadOrgId);
      } else {
        // No lead org
        map.set(activity.id, null);
      }
    }

    // Bulk lookup organization names
    if (orgIdsToLookup.size > 0) {
      const results = await this.databaseService.db
        .select({
          orgId: organizations.id,
          orgName:
            sql<string>`COALESCE(${organizations.displayName}, ${organizations.name})`.as(
              'orgName'
            ),
        })
        .from(organizations)
        .where(
          and(
            inArray(organizations.id, Array.from(orgIdsToLookup)),
            eq(organizations.isActive, true)
          )
        );

      const orgIdToName = new Map(
        results.map((row) => [row.orgId, row.orgName])
      );

      // Map organization names back to activities
      for (const [activityId, orgId] of activityIdToOrgId.entries()) {
        const orgName = orgIdToName.get(orgId);
        map.set(activityId, orgName ?? null);
      }
    }

    return map;
  }

  /**
   * Fetch organization names for eventLeadOrg
   * Returns maps of activityId -> organization name
   * Uses free text name if available, otherwise looks up from organizations table
   */
  private async fetchEventLeadOrgNamesForActivities(
    activities: Activity[]
  ): Promise<Map<number, string | null>> {
    const map = new Map<number, string | null>();

    // Collect organization IDs that need to be looked up
    const orgIdsToLookup = new Set<string>();
    const activityIdToOrgId = new Map<number, string>();

    for (const activity of activities) {
      // If free text name exists, use it
      if (activity.eventLeadOrgName) {
        map.set(activity.id, activity.eventLeadOrgName);
      } else if (activity.eventLeadOrgId) {
        // Need to look up organization name
        orgIdsToLookup.add(activity.eventLeadOrgId);
        activityIdToOrgId.set(activity.id, activity.eventLeadOrgId);
      } else {
        // No event lead org
        map.set(activity.id, null);
      }
    }

    // Bulk lookup organization names
    if (orgIdsToLookup.size > 0) {
      const results = await this.databaseService.db
        .select({
          orgId: organizations.id,
          orgName:
            sql<string>`COALESCE(${organizations.displayName}, ${organizations.name})`.as(
              'orgName'
            ),
        })
        .from(organizations)
        .where(
          and(
            inArray(organizations.id, Array.from(orgIdsToLookup)),
            eq(organizations.isActive, true)
          )
        );

      const orgIdToName = new Map(
        results.map((row) => [row.orgId, row.orgName])
      );

      // Map organization names back to activities
      for (const [activityId, orgId] of activityIdToOrgId.entries()) {
        const orgName = orgIdToName.get(orgId);
        map.set(activityId, orgName ?? null);
      }
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
      categoryIds?: number[];
      tags?: Array<{ id: string; text: string }>;
      activityStatus?: string;
      pitchStatus?: string;
      dateStatus?: string;
      timeStatus?: string;
      venueStatus?: string | null;
      venueAddress?: {
        venueName: string | null;
        street: string | null;
        city: string | null;
        provinceOrState: string | null;
        country: string | null;
      } | null;
      jointOrg?: string[];
      relatedActivities?: string[];
      commsMaterials?: string[];
      translationsRequired?: string[];
      jointEventOrg?: string[];
      representativesAttending?: Array<{
        representative: string;
        attendingStatus: AttendingStatus;
      }>;
      sharedWith?: string[];
      additionalOwners?: string[];
      ownerName: string | null;
      eventLeadName?: string | null;
      graphicsUserName?: string | null;
      leadOrgName?: string | null;
      eventLeadOrgName?: string | null;
    }
  ): ActivityResponse {
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

    const dto: ActivityResponse = {
      id: activity.id,
      displayId: activity.displayId ?? null,

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
      leadOrg: relatedData?.leadOrgName ?? null,
      eventLeadOrgId: activity.eventLeadOrgId ?? null,
      eventLeadOrgName: activity.eventLeadOrgName ?? null,
      eventLeadOrg: relatedData?.eventLeadOrgName ?? null,
      jointOrg: relatedData?.jointOrg ?? [],

      // Related activities and tags
      relatedActivities: relatedData?.relatedActivities ?? [],
      tags: relatedData?.tags ?? [],

      // Approvals
      significance: activity.significance ?? '',
      activityStatus: relatedData?.activityStatus ?? 'unknown',
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
      schedulingConsiderations: activity.schedulingConsiderations ?? null,

      // Comms
      commsMaterials: relatedData?.commsMaterials ?? [],
      newsReleaseId: activity.newsReleaseId ?? null,
      newsReleaseOriginId: activity.newsReleaseOriginId ?? null,
      newsReleaseOriginName: activity.newsReleaseOriginName ?? null,
      translationsRequired: relatedData?.translationsRequired ?? [],

      // Event
      jointEventOrg: relatedData?.jointEventOrg ?? [],
      representativesAttending: relatedData?.representativesAttending ?? [],
      venueStatus: relatedData?.venueStatus ?? null,
      venueAddress: relatedData?.venueAddress ?? null,
      eventPlannerId: activity.eventPlannerId?.toString() ?? null,
      eventLead:
        // Use free-text name if available, otherwise use fetched user name
        activity.eventPlannerName ?? relatedData?.eventLeadName ?? null,
      eventPlannerName: activity.eventPlannerName ?? null,
      graphicsUserId: activity.graphicsUserId?.toString() ?? null,
      graphicsUser: relatedData?.graphicsUserName ?? null,

      // Reports
      notForLookAhead: activity.notForLookAhead ?? false,
      notForThirtySixtyNinety: activity.notForThirtySixtyNinety ?? false,
      executiveSummary: activity.executiveSummary ?? null,
      lookAheadStatus: LOOK_AHEAD_STATUS.includes(
        activity.lookAheadStatus as LookAheadStatus
      )
        ? (activity.lookAheadStatus as LookAheadStatus)
        : 'none',
      lookAheadSection: LOOK_AHEAD_SECTION.includes(
        activity.lookAheadSection as LookAheadSection
      )
        ? (activity.lookAheadSection as LookAheadSection)
        : 'events',

      // Sharing
      ownerId: activity.ownerId?.toString() ?? 'unknown',
      ministryOwnerId: activity.ministryOwnerId,
      owner:
        relatedData?.ownerName ?? activity.ownerId?.toString() ?? 'unknown',
      sharedWith: relatedData?.sharedWith ?? [],
      additionalOwners: relatedData?.additionalOwners ?? [],
      calendarVisibility: CALENDAR_VISIBILITY.includes(
        activity.calendarVisibility as CalendarVisibility
      )
        ? (activity.calendarVisibility as CalendarVisibility)
        : 'visible',

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

    // Runtime validation to ensure response matches schema contract
    try {
      return activityResponseSchema.parse(dto);
    } catch (error) {
      // Log validation errors with context for debugging
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown validation error';
      console.error(
        `[ActivitiesService] Response validation failed for activity ${activity.id}:`,
        errorMessage
      );
      // Fail-fast in all environments to prevent invalid responses
      throw new Error(
        `Response validation failed: ${errorMessage}. This indicates a mismatch between the mapping logic and the ActivityResponse schema.`
      );
    }
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
