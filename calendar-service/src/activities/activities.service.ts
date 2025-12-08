import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, SQL, gte, lte, inArray } from 'drizzle-orm';
import {
  activities,
  pitchStatuses,
  schedulingStatuses,
  activityCategories,
  activityTags,
  categories,
  tags,
  activityJointOrganizations,
  activityRelatedEntries,
  activityCommsMaterials,
  activityTranslationLanguages,
  activityJointEventOrganizations,
  activityRepresentatives,
  activitySharedWithOrganizations,
  activityCanEditUsers,
  activityCanViewUsers,
  organizations,
  commsMaterials,
  translatedLanguages,
  systemUsers,
} from '@corpcal/database/schema';
import type { Activity, NewActivity } from '@corpcal/database/types';
import type {
  CreateActivityRequest,
  UpdateActivityRequest,
  FilterActivities,
} from '@corpcal/shared/schemas';
import type { ActivityResponse } from '@corpcal/shared/api';
import { activityResponseSchema } from '@corpcal/shared/schemas';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ActivitiesService {
  constructor(private readonly databaseService: DatabaseService) {}
  /**
   * Create a new activity
   */
  async create(dto: CreateActivityRequest): Promise<ActivityResponse> {
    // Extract junction table data from DTO
    // Type assertion needed because CreateActivityRequest extends the base schema
    const dtoWithJunctions = dto as CreateActivityRequest & {
      categoryIds?: number[];
      tagIds?: string[];
      jointOrganizationIds?: string[];
      relatedActivityIds?: number[];
      commsMaterialIds?: number[];
      translationLanguageIds?: number[];
      jointEventOrganizationIds?: string[];
      representativeIds?: number[];
      sharedWithOrganizationIds?: string[];
      canEditUserIds?: number[];
      canViewUserIds?: number[];
    };

    const {
      categoryIds,
      tagIds,
      jointOrganizationIds,
      relatedActivityIds,
      commsMaterialIds,
      translationLanguageIds,
      jointEventOrganizationIds,
      representativeIds,
      sharedWithOrganizationIds,
      canEditUserIds,
      canViewUserIds,
      ...activityData
    } = dtoWithJunctions;

    // TODO: Replace with actual authenticated user ID
    const currentUserId = 1;

    // Validate foreign key references before starting transaction
    if (categoryIds && categoryIds.length > 0) {
      await this.validateCategoryIds(categoryIds);
    }

    // Use transaction to ensure all inserts succeed or fail together
    const result = await this.databaseService.db.transaction(async (tx) => {
      const newActivity: NewActivity = {
        ...(activityData as Partial<NewActivity>),
        createdDateTime: new Date(),
      };

      const [created] = await tx
        .insert(activities)
        .values(newActivity)
        .returning();

      const activityId = created.id;
      const now = new Date();

      // Insert junction table relationships using helper function
      await this.insertJunctionRecords(
        tx,
        activityCategories,
        activityId,
        categoryIds,
        (categoryId) => ({ categoryId }),
        currentUserId,
        now
      );

      await this.insertJunctionRecords(
        tx,
        activityTags,
        activityId,
        tagIds,
        (tagId) => ({ tagId }),
        currentUserId,
        now
      );

      await this.insertJunctionRecords(
        tx,
        activityJointOrganizations,
        activityId,
        jointOrganizationIds,
        (orgId) => ({ organizationId: orgId }),
        currentUserId,
        now
      );

      await this.insertJunctionRecords(
        tx,
        activityRelatedEntries,
        activityId,
        relatedActivityIds,
        (relatedId) => ({ relatedActivityId: relatedId }),
        currentUserId,
        now
      );

      await this.insertJunctionRecords(
        tx,
        activityCommsMaterials,
        activityId,
        commsMaterialIds,
        (materialId) => ({ commsMaterialId: materialId }),
        currentUserId,
        now
      );

      await this.insertJunctionRecords(
        tx,
        activityTranslationLanguages,
        activityId,
        translationLanguageIds,
        (languageId) => ({ languageId }),
        currentUserId,
        now
      );

      await this.insertJunctionRecords(
        tx,
        activityJointEventOrganizations,
        activityId,
        jointEventOrganizationIds,
        (orgId) => ({ organizationId: orgId }),
        currentUserId,
        now
      );

      // Special case: activityRepresentatives has additional attendingStatus field
      if (representativeIds && representativeIds.length > 0) {
        await tx.insert(activityRepresentatives).values(
          representativeIds.map((repId) => ({
            activityId,
            representativeId: repId,
            attendingStatus: 'requested', // Default status
            createdBy: currentUserId,
            lastUpdatedBy: currentUserId,
            createdDateTime: now,
            lastUpdatedDateTime: now,
          }))
        );
      }

      await this.insertJunctionRecords(
        tx,
        activitySharedWithOrganizations,
        activityId,
        sharedWithOrganizationIds,
        (orgId) => ({ organizationId: orgId }),
        currentUserId,
        now
      );

      await this.insertJunctionRecords(
        tx,
        activityCanEditUsers,
        activityId,
        canEditUserIds,
        (userId) => ({ userId }),
        currentUserId,
        now
      );

      await this.insertJunctionRecords(
        tx,
        activityCanViewUsers,
        activityId,
        canViewUserIds,
        (userId) => ({ userId }),
        currentUserId,
        now
      );

      return created;
    });

    // Fetch the created activity with all related data
    return this.findOne(result.id);
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
  async findAll(filters?: FilterActivities): Promise<ActivityResponse[]> {
    let activityResults: Activity[];

    if (filters) {
      const conditions: SQL[] = [];
      if (filters.title) {
        conditions.push(eq(activities.title as any, filters.title));
      }
      if (filters.activityStatusId !== undefined) {
        conditions.push(
          eq(activities.activityStatusId as any, filters.activityStatusId)
        );
      }
      if (filters.isActive !== undefined) {
        conditions.push(eq(activities.isActive as any, filters.isActive));
      }
      if (filters.isConfidential !== undefined) {
        conditions.push(eq(activities.isConfidential, filters.isConfidential));
      }
      if (filters.isIssue !== undefined) {
        conditions.push(eq(activities.isIssue, filters.isIssue));
      }
      if (filters.contactMinistryId) {
        conditions.push(
          eq(activities.contactMinistryId, filters.contactMinistryId)
        );
      }
      if (filters.cityId) {
        conditions.push(eq(activities.cityId, filters.cityId));
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
      schedulingStatusesMap,
      jointOrgMap,
      relatedActivitiesMap,
      commsMaterialsMap,
      translationsRequiredMap,
      jointEventOrgMap,
      representativesAttendingMap,
      sharedWithMap,
      canEditMap,
      canViewMap,
    ] = await Promise.all([
      this.fetchCategoriesForActivities(activityIds),
      this.fetchTagsForActivities(activityIds),
      this.fetchPitchStatusesForActivities(activityIds),
      this.fetchSchedulingStatusesForActivities(activityIds),
      this.fetchJointOrganizationsForActivities(activityIds),
      this.fetchRelatedActivitiesForActivities(activityIds),
      this.fetchCommsMaterialsForActivities(activityIds),
      this.fetchTranslationsRequiredForActivities(activityIds),
      this.fetchJointEventOrganizationsForActivities(activityIds),
      this.fetchRepresentativesAttendingForActivities(activityIds),
      this.fetchSharedWithOrganizationsForActivities(activityIds),
      this.fetchCanEditUsersForActivities(activityIds),
      this.fetchCanViewUsersForActivities(activityIds),
    ]);

    return activityResults.map((activity) =>
      this.mapToResponseDto(activity, {
        categories: categoriesMap.get(activity.id) ?? [],
        tags: tagsMap.get(activity.id) ?? [],
        pitchStatus: pitchStatusesMap.get(activity.id),
        schedulingStatus: schedulingStatusesMap.get(activity.id),
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

    // Fetch related data
    const [
      categoriesList,
      tagsList,
      pitchStatus,
      schedulingStatus,
      jointOrg,
      relatedActivities,
      commsMaterials,
      translationsRequired,
      jointEventOrg,
      representativesAttending,
      sharedWith,
      canEdit,
      canView,
    ] = await Promise.all([
      this.fetchCategoriesForActivities([id]),
      this.fetchTagsForActivities([id]),
      this.fetchPitchStatusesForActivities([id]),
      this.fetchSchedulingStatusesForActivities([id]),
      this.fetchJointOrganizationsForActivities([id]),
      this.fetchRelatedActivitiesForActivities([id]),
      this.fetchCommsMaterialsForActivities([id]),
      this.fetchTranslationsRequiredForActivities([id]),
      this.fetchJointEventOrganizationsForActivities([id]),
      this.fetchRepresentativesAttendingForActivities([id]),
      this.fetchSharedWithOrganizationsForActivities([id]),
      this.fetchCanEditUsersForActivities([id]),
      this.fetchCanViewUsersForActivities([id]),
    ]);

    return this.mapToResponseDto(activity, {
      categories: categoriesList.get(id) ?? [],
      tags: tagsList.get(id) ?? [],
      pitchStatus: pitchStatus.get(id),
      schedulingStatus: schedulingStatus.get(id),
      jointOrg: jointOrg.get(id) ?? [],
      relatedActivities: relatedActivities.get(id) ?? [],
      commsMaterials: commsMaterials.get(id) ?? [],
      translationsRequired: translationsRequired.get(id) ?? [],
      jointEventOrg: jointEventOrg.get(id) ?? [],
      representativesAttending: representativesAttending.get(id) ?? [],
      sharedWith: sharedWith.get(id) ?? [],
      canEdit: canEdit.get(id) ?? [],
      canView: canView.get(id) ?? [],
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
      schedulingStatus,
      jointOrg,
      relatedActivities,
      commsMaterials,
      translationsRequired,
      jointEventOrg,
      representativesAttending,
      sharedWith,
      canEdit,
      canView,
    ] = await Promise.all([
      this.fetchCategoriesForActivities([id]),
      this.fetchTagsForActivities([id]),
      this.fetchPitchStatusesForActivities([id]),
      this.fetchSchedulingStatusesForActivities([id]),
      this.fetchJointOrganizationsForActivities([id]),
      this.fetchRelatedActivitiesForActivities([id]),
      this.fetchCommsMaterialsForActivities([id]),
      this.fetchTranslationsRequiredForActivities([id]),
      this.fetchJointEventOrganizationsForActivities([id]),
      this.fetchRepresentativesAttendingForActivities([id]),
      this.fetchSharedWithOrganizationsForActivities([id]),
      this.fetchCanEditUsersForActivities([id]),
      this.fetchCanViewUsersForActivities([id]),
    ]);

    return this.mapToResponseDto(updated, {
      categories: categoriesList.get(id) ?? [],
      tags: tagsList.get(id) ?? [],
      pitchStatus: pitchStatus.get(id),
      schedulingStatus: schedulingStatus.get(id),
      jointOrg: jointOrg.get(id) ?? [],
      relatedActivities: relatedActivities.get(id) ?? [],
      commsMaterials: commsMaterials.get(id) ?? [],
      translationsRequired: translationsRequired.get(id) ?? [],
      jointEventOrg: jointEventOrg.get(id) ?? [],
      representativesAttending: representativesAttending.get(id) ?? [],
      sharedWith: sharedWith.get(id) ?? [],
      canEdit: canEdit.get(id) ?? [],
      canView: canView.get(id) ?? [],
    });
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
  async softDelete(id: number): Promise<ActivityResponse> {
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
      schedulingStatus,
      jointOrg,
      relatedActivities,
      commsMaterials,
      translationsRequired,
      jointEventOrg,
      representativesAttending,
      sharedWith,
      canEdit,
      canView,
    ] = await Promise.all([
      this.fetchCategoriesForActivities([id]),
      this.fetchTagsForActivities([id]),
      this.fetchPitchStatusesForActivities([id]),
      this.fetchSchedulingStatusesForActivities([id]),
      this.fetchJointOrganizationsForActivities([id]),
      this.fetchRelatedActivitiesForActivities([id]),
      this.fetchCommsMaterialsForActivities([id]),
      this.fetchTranslationsRequiredForActivities([id]),
      this.fetchJointEventOrganizationsForActivities([id]),
      this.fetchRepresentativesAttendingForActivities([id]),
      this.fetchSharedWithOrganizationsForActivities([id]),
      this.fetchCanEditUsersForActivities([id]),
      this.fetchCanViewUsersForActivities([id]),
    ]);

    return this.mapToResponseDto(updated, {
      categories: categoriesList.get(id) ?? [],
      tags: tagsList.get(id) ?? [],
      pitchStatus: pitchStatus.get(id),
      schedulingStatus: schedulingStatus.get(id),
      jointOrg: jointOrg.get(id) ?? [],
      relatedActivities: relatedActivities.get(id) ?? [],
      commsMaterials: commsMaterials.get(id) ?? [],
      translationsRequired: translationsRequired.get(id) ?? [],
      jointEventOrg: jointEventOrg.get(id) ?? [],
      representativesAttending: representativesAttending.get(id) ?? [],
      sharedWith: sharedWith.get(id) ?? [],
      canEdit: canEdit.get(id) ?? [],
      canView: canView.get(id) ?? [],
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
   * Fetch scheduling statuses for multiple activities
   */
  private async fetchSchedulingStatusesForActivities(
    activityIds: number[]
  ): Promise<Map<number, string>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const activityResults = await this.databaseService.db
      .select({
        id: activities.id,
        schedulingStatusId: activities.schedulingStatusId,
      })
      .from(activities)
      .where(inArray(activities.id, activityIds));

    const schedulingStatusIds = activityResults
      .map((a) => a.schedulingStatusId)
      .filter((id): id is number => id !== null && id !== undefined);

    if (schedulingStatusIds.length === 0) {
      return new Map();
    }

    const schedulingStatusResults = await this.databaseService.db
      .select({
        id: schedulingStatuses.id,
        name: schedulingStatuses.name,
      })
      .from(schedulingStatuses)
      .where(
        and(
          inArray(schedulingStatuses.id, schedulingStatusIds),
          eq(schedulingStatuses.isActive, true)
        )
      );

    const statusMap = new Map<number, string>(
      schedulingStatusResults.map((s) => [s.id, s.name])
    );

    const resultMap = new Map<number, string>();
    for (const activity of activityResults) {
      if (activity.schedulingStatusId) {
        const statusName = statusMap.get(activity.schedulingStatusId);
        if (statusName) {
          resultMap.set(activity.id, statusName);
        }
      }
    }
    return resultMap;
  }

  /**
   * Fetch joint organizations for multiple activities
   */
  private async fetchJointOrganizationsForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityJointOrganizations.activityId,
        organizationId: organizations.id,
      })
      .from(activityJointOrganizations)
      .innerJoin(
        organizations,
        eq(activityJointOrganizations.organizationId, organizations.id)
      )
      .where(
        and(
          inArray(activityJointOrganizations.activityId, activityIds),
          eq(activityJointOrganizations.isActive, true)
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
        activityId: activityTranslationLanguages.activityId,
        languageName: translatedLanguages.name,
      })
      .from(activityTranslationLanguages)
      .innerJoin(
        translatedLanguages,
        eq(activityTranslationLanguages.languageId, translatedLanguages.id)
      )
      .where(
        and(
          inArray(activityTranslationLanguages.activityId, activityIds),
          eq(activityTranslationLanguages.isActive, true),
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
  private async fetchJointEventOrganizationsForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityJointEventOrganizations.activityId,
        organizationId: organizations.id,
      })
      .from(activityJointEventOrganizations)
      .innerJoin(
        organizations,
        eq(activityJointEventOrganizations.organizationId, organizations.id)
      )
      .where(
        and(
          inArray(activityJointEventOrganizations.activityId, activityIds),
          eq(activityJointEventOrganizations.isActive, true)
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
  private async fetchSharedWithOrganizationsForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activitySharedWithOrganizations.activityId,
        organizationId: organizations.id,
      })
      .from(activitySharedWithOrganizations)
      .innerJoin(
        organizations,
        eq(activitySharedWithOrganizations.organizationId, organizations.id)
      )
      .where(
        and(
          inArray(activitySharedWithOrganizations.activityId, activityIds),
          eq(activitySharedWithOrganizations.isActive, true)
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
   * Map database Activity to API ActivityResponse
   * Validates against Zod schema to ensure DTO matches schema contract
   */
  private mapToResponseDto(
    activity: Activity,
    relatedData?: {
      categories?: string[];
      tags?: Array<{ id: string; text: string }>;
      pitchStatus?: string;
      schedulingStatus?: string;
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
      category: relatedData?.categories ?? [],

      // Basic info
      title: activity.title ?? '',
      summary: activity.summary ?? null,
      isIssue: activity.isIssue ?? false,
      oicRelated: activity.oicRelated ?? false,
      isActive: activity.isActive ?? true,

      // Organizations
      leadOrg: activity.leadOrgId ?? null,
      jointOrg: relatedData?.jointOrg ?? [],

      // Related activities and tags
      relatedActivities: relatedData?.relatedActivities ?? [],
      tags: relatedData?.tags ?? [],

      // Approvals
      significance: activity.significance ?? null,
      pitchStatus: relatedData?.pitchStatus ?? 'unknown',
      pitchComments: activity.pitchComments ?? null,
      confidential: activity.isConfidential ?? false,

      // Scheduling
      schedulingStatus: relatedData?.schedulingStatus ?? 'unknown',
      isAllDay: activity.isAllDay ?? false,
      startDate: formatDate(activity.startDate),
      startTime: formatTime(activity.startTime),
      endDate: formatDate(activity.endDate),
      endTime: formatTime(activity.endTime),
      schedulingConsiderations: activity.schedulingConsiderations ?? null,

      // Comms
      commsLead: activity.commsLeadId?.toString() ?? null,
      commsMaterials: relatedData?.commsMaterials ?? [],
      newsReleaseId: activity.newsReleaseId ?? null,
      translationsRequired: relatedData?.translationsRequired ?? [],

      // Event
      eventLeadOrg: activity.eventLeadOrgId ?? null,
      jointEventOrg: relatedData?.jointEventOrg ?? [],
      representativesAttending: relatedData?.representativesAttending ?? [],
      venueAddress:
        (activity.venueAddress as {
          street: string;
          city: string;
          provinceOrState: string;
          country: string;
        } | null) ?? null,
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
      videographer: null, // videographerUserId column has been removed
      graphics: activity.graphicsUserId?.toString() ?? null,

      // Reports
      notForLookAhead: activity.notForLookAhead ?? false,
      lookAheadStatus:
        (activity.lookAheadStatus as 'none' | 'new' | 'changed') ?? 'none',
      lookAheadSection:
        (activity.lookAheadSection as
          | 'events'
          | 'issues'
          | 'news'
          | 'awareness') ?? 'events',
      planningReport: activity.planningReport ?? false,
      thirtySixtyNinetyReport: activity.thirtySixtyNinetyReport ?? false,

      // Sharing
      owner: activity.ownerId?.toString() ?? null,
      sharedWith: relatedData?.sharedWith ?? [],
      canEdit: relatedData?.canEdit ?? [],
      canView: relatedData?.canView ?? [],
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

    // Runtime validation to ensure DTO matches schema contract
    // This catches misalignment between the mapping logic and the schema
    // Runs in all environments to catch issues early
    try {
      activityResponseSchema.parse(dto);
    } catch (error) {
      // Log validation errors with context for debugging
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown validation error';
      console.error(
        `[ActivitiesService] Response DTO validation failed for activity ${activity.id}:`,
        errorMessage
      );
      // In production, we might want to throw here to prevent invalid responses
      // For now, we log and continue to avoid breaking the API
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          `Response DTO validation failed: ${errorMessage}. This indicates a mismatch between the mapping logic and the ActivityResponse schema.`
        );
      }
    }

    return dto;
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
}
