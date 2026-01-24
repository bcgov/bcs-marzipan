import { Injectable } from '@nestjs/common';
import { eq, and, inArray, sql, ne } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { Visibility, ActivityStatusName } from '@corpcal/shared';
import {
  categories,
  organizations,
  users,
  tags,
  pitchStatuses,
  activityStatuses,
  commsMaterials,
  translatedLanguages,
  governmentRepresentatives,
  activities,
  eventPlanners,
  newsReleaseDistributions,
  premierRequested,
  newsReleaseOrigins,
  teamCategories,
  cities,
  ministries,
  themes,
  reports,
} from '@corpcal/database/schema';
import type {
  LookupItem,
  LookupQueryParams,
  CategoryLookupItem,
  OrganizationLookupItem,
  UserLookupItem,
  TagLookupItem,
  PitchStatusLookupItem,
  CommsMaterialsLookupItem,
  TranslationLanguageLookupItem,
  GovernmentRepresentativeLookupItem,
  MinistryLookupItem,
  ThemeLookupItem,
  ReportResponse,
} from '@corpcal/shared/api/types';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class LookupsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all active categories available to the user based on their team memberships
   * @param userTeams - Optional array of team IDs the user belongs to
   * @returns Categories that are either global or team-scoped for the user's teams
   */
  async getCategories(userTeams?: number[]): Promise<CategoryLookupItem[]> {
    if (userTeams && userTeams.length > 0) {
      // Return global categories OR team-scoped categories for user's teams
      // Query global categories
      const globalCategories = await this.databaseService.db
        .select({
          id: categories.id,
          name: categories.name,
          displayName: categories.displayName,
          sortOrder: categories.sortOrder,
          isActive: categories.isActive,
          allowsPitch: categories.allowsPitch,
        })
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
          isActive: categories.isActive,
          allowsPitch: categories.allowsPitch,
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

      return uniqueCategories
        .sort((a, b) =>
          (a.displayName || a.name).localeCompare(b.displayName || b.name)
        )
        .map((cat) => ({
          id: cat.id,
          label: cat.displayName || cat.name,
          value: cat.id,
          name: cat.name,
          displayName: cat.displayName,
          sortOrder: cat.sortOrder,
          isActive: cat.isActive,
          allowsPitch: cat.allowsPitch,
        }));
    } else {
      // If no teams provided, return only global categories
      const results = await this.databaseService.db
        .select({
          id: categories.id,
          name: categories.name,
          displayName: categories.displayName,
          sortOrder: categories.sortOrder,
          isActive: categories.isActive,
          allowsPitch: categories.allowsPitch,
        })
        .from(categories)
        .where(
          and(
            eq(categories.isActive, true),
            sql`${categories.visibility} = ${'global' satisfies Visibility}`
          )
        )
        .orderBy(categories.sortOrder);

      return results.map((cat) => ({
        id: cat.id,
        label: cat.displayName || cat.name,
        value: cat.id,
        name: cat.name,
        displayName: cat.displayName,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        allowsPitch: cat.allowsPitch,
      }));
    }
  }

  /**
   * Get all active organizations
   * TODO: Implement scoping based on userId, role, organizationId
   */
  async getOrganizations(
    _params?: LookupQueryParams
  ): Promise<OrganizationLookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: organizations.id,
        name: organizations.name,
        displayName: organizations.displayName,
      })
      .from(organizations)
      .where(eq(organizations.isActive, true))
      .orderBy(organizations.sortOrder);

    return results.map((org) => ({
      id: org.id,
      label: org.displayName || org.name,
      value: org.id,
      name: org.name,
      displayName: org.displayName,
    }));
  }

  /**
   * Get all active users
   * Computes display name from adDisplayName or falls back to adUsername
   * Supports filtering by userIds to fetch specific users
   * TODO: Implement scoping based on role, organizationId
   */
  async getUsers(params?: LookupQueryParams): Promise<UserLookupItem[]> {
    // Build where conditions
    const conditions: SQL[] = [eq(users.isActive, true)];

    // Filter by specific user IDs if provided
    if (params?.userIds && params.userIds.length > 0) {
      // Controller already parses userIds into number array, but TypeScript needs explicit type
      const userIdsArray = params.userIds;
      conditions.push(inArray(users.id, userIdsArray));
    }

    const results = await this.databaseService.db
      .select({
        id: users.id,
        adUsername: users.adUsername,
        adDisplayName: users.adDisplayName,
        adEmail: users.adEmail,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(users.adDisplayName, users.adUsername);

    return results.map((user) => {
      const name = user.adDisplayName || user.adUsername || `User ${user.id}`;
      return {
        id: user.id,
        label: name,
        value: user.id,
        name,
        email: user.adEmail,
        username: user.adUsername,
      };
    });
  }

  /**
   * Get all active tags
   * All tags are currently global (visibility='global'). Team visibility is a future feature flag.
   */
  async getTags(): Promise<TagLookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: tags.id,
        name: tags.name,
        displayName: tags.displayName,
        sortOrder: tags.sortOrder,
        isActive: tags.isActive,
      })
      .from(tags)
      .orderBy(tags.sortOrder);

    return results.map((tag) => ({
      id: tag.id,
      label: tag.displayName || tag.name || String(tag.id),
      value: tag.id,
      name: tag.name,
      displayName: tag.displayName,
      sortOrder: tag.sortOrder,
      isActive: tag.isActive,
    }));
  }

  /**
   * Get all active pitch statuses
   */
  async getPitchStatuses(): Promise<PitchStatusLookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: pitchStatuses.id,
        name: pitchStatuses.name,
        displayName: pitchStatuses.displayName,
      })
      .from(pitchStatuses)
      .where(eq(pitchStatuses.isActive, true))
      .orderBy(pitchStatuses.sortOrder);

    return results.map((status) => ({
      id: status.id,
      label: status.displayName || status.name,
      value: status.id,
      name: status.name,
      displayName: status.displayName,
    }));
  }

  /**
   * Get all active reports
   */
  async getReports(): Promise<ReportResponse[]> {
    const results = await this.databaseService.db
      .select({
        id: reports.id,
        name: reports.name,
        displayName: reports.displayName,
        sortOrder: reports.sortOrder,
        isActive: reports.isActive,
        visibility: reports.visibility,
        config: reports.config,
        description: reports.description,
      })
      .from(reports)
      .where(eq(reports.isActive, true))
      .orderBy(reports.sortOrder);

    return results as ReportResponse[];
  }

  /**
   * Get all active comms materials
   */
  async getCommsMaterials(): Promise<CommsMaterialsLookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: commsMaterials.id,
        name: commsMaterials.name,
        displayName: commsMaterials.displayName,
        sortOrder: commsMaterials.sortOrder,
        isActive: commsMaterials.isActive,
      })
      .from(commsMaterials)
      .orderBy(commsMaterials.sortOrder);

    return results.map((material) => ({
      id: material.id,
      label: material.displayName || material.name,
      value: material.id,
      name: material.name,
      displayName: material.displayName,
      sortOrder: material.sortOrder,
      isActive: material.isActive,
    }));
  }

  /**
   * Get all active translation languages
   */
  async getTranslationLanguages(): Promise<TranslationLanguageLookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: translatedLanguages.id,
        name: translatedLanguages.name,
        displayName: translatedLanguages.displayName,
      })
      .from(translatedLanguages)
      .where(eq(translatedLanguages.isActive, true))
      .orderBy(translatedLanguages.sortOrder);

    return results.map((lang) => ({
      id: lang.id,
      label: lang.displayName || lang.name,
      value: lang.id,
      name: lang.name,
      displayName: lang.displayName,
    }));
  }

  /**
   * Get all active government representatives
   */
  async getGovernmentRepresentatives(): Promise<
    GovernmentRepresentativeLookupItem[]
  > {
    const results = await this.databaseService.db
      .select({
        id: governmentRepresentatives.id,
        name: governmentRepresentatives.name,
        displayName: governmentRepresentatives.displayName,
        title: governmentRepresentatives.title,
        ministryId: governmentRepresentatives.ministryId,
        sortOrder: governmentRepresentatives.sortOrder,
        isActive: governmentRepresentatives.isActive,
      })
      .from(governmentRepresentatives)
      .orderBy(governmentRepresentatives.sortOrder);

    return results.map((rep) => ({
      id: rep.id,
      label: rep.displayName || rep.name,
      value: rep.id,
      name: rep.name,
      displayName: rep.displayName,
      title: rep.title,
      ministryId: rep.ministryId,
      sortOrder: rep.sortOrder,
      isActive: rep.isActive,
    }));
  }

  /**
   * Get all active event planners
   */
  async getEventPlanners(): Promise<LookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: eventPlanners.id,
        name: eventPlanners.name,
        displayName: eventPlanners.displayName,
      })
      .from(eventPlanners)
      .where(eq(eventPlanners.isActive, true))
      .orderBy(eventPlanners.sortOrder);

    return results.map((planner) => ({
      id: planner.id,
      label: planner.displayName || planner.name,
      value: planner.id,
      name: planner.name,
      displayName: planner.displayName,
    }));
  }

  /**
   * Get all active news release distributions
   */
  async getNewsReleaseDistributions(): Promise<LookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: newsReleaseDistributions.id,
        name: newsReleaseDistributions.name,
        displayName: newsReleaseDistributions.displayName,
      })
      .from(newsReleaseDistributions)
      .where(eq(newsReleaseDistributions.isActive, true))
      .orderBy(newsReleaseDistributions.sortOrder);

    return results.map((dist) => ({
      id: dist.id,
      label: dist.displayName || dist.name,
      value: dist.id,
      name: dist.name,
      displayName: dist.displayName,
    }));
  }

  /**
   * Get all active premier requested options
   */
  async getPremierRequested(): Promise<LookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: premierRequested.id,
        name: premierRequested.name,
        displayName: premierRequested.displayName,
      })
      .from(premierRequested)
      .where(eq(premierRequested.isActive, true))
      .orderBy(premierRequested.sortOrder);

    return results.map((premier) => ({
      id: premier.id,
      label: premier.displayName || premier.name,
      value: premier.id,
      name: premier.name,
      displayName: premier.displayName,
    }));
  }

  /**
   * Get all active news release origins
   */
  async getNewsReleaseOrigins(): Promise<LookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: newsReleaseOrigins.id,
        name: newsReleaseOrigins.name,
        displayName: newsReleaseOrigins.displayName,
      })
      .from(newsReleaseOrigins)
      .where(eq(newsReleaseOrigins.isActive, true))
      .orderBy(newsReleaseOrigins.sortOrder);

    return results.map((origin) => ({
      id: origin.id,
      label: origin.displayName || origin.name,
      value: origin.id,
      name: origin.name,
      displayName: origin.displayName,
    }));
  }

  /**
   * Get activities for "Related Activities" dropdown
   * Returns simplified list with id and title
   * Excludes deleted activities by default
   * TODO: Implement scoping based on userId, role
   */
  async getActivitiesForLookup(
    _params?: LookupQueryParams
  ): Promise<LookupItem[]> {
    // Get deleted status ID to exclude deleted activities
    const [deletedStatus] = await this.databaseService.db
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(eq(activityStatuses.name, 'deleted' satisfies ActivityStatusName))
      .limit(1);

    const conditions: SQL[] = [];
    if (deletedStatus?.id !== undefined) {
      conditions.push(ne(activities.activityStatusId, deletedStatus.id));
    }

    const results = await this.databaseService.db
      .select({
        id: activities.id,
        title: activities.title,
      })
      .from(activities)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(activities.title);

    return results.map((activity) => ({
      id: activity.id,
      label: activity.title || `Activity ${activity.id}`,
      value: activity.id,
      title: activity.title,
    }));
  }

  /**
   * Get all active cities
   */
  async getCities(): Promise<LookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: cities.id,
        name: cities.name,
        displayName: cities.displayName,
        province: cities.province,
        sortOrder: cities.sortOrder,
        isActive: cities.isActive,
      })
      .from(cities)
      .orderBy(cities.sortOrder);

    return results.map((city) => ({
      id: city.id,
      label: city.displayName || city.name,
      value: city.id,
      name: city.name,
      displayName: city.displayName,
      province: city.province,
      sortOrder: city.sortOrder,
      isActive: city.isActive,
    }));
  }

  /**
   * Get all active ministries
   */
  async getMinistries(): Promise<MinistryLookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: ministries.id,
        displayName: ministries.displayName,
        abbreviation: ministries.abbreviation,
        ministerName: ministries.ministerName,
        sortOrder: ministries.sortOrder,
        isActive: ministries.isActive,
      })
      .from(ministries)
      .orderBy(ministries.sortOrder);

    return results.map((ministry) => ({
      id: ministry.id,
      label: ministry.displayName || ministry.abbreviation || ministry.id,
      value: ministry.id,
      displayName: ministry.displayName,
      abbreviation: ministry.abbreviation,
      ministerName: ministry.ministerName,
      sortOrder: ministry.sortOrder,
      isActive: ministry.isActive,
    }));
  }

  /**
   * Get all active themes
   */
  async getThemes(): Promise<ThemeLookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: themes.id,
        key: themes.key,
        displayName: themes.displayName,
        sortOrder: themes.sortOrder,
        isActive: themes.isActive,
      })
      .from(themes)
      .orderBy(themes.sortOrder);

    return results.map((theme) => ({
      id: theme.id,
      label: theme.displayName || theme.key || theme.id,
      value: theme.id,
      key: theme.key,
      displayName: theme.displayName,
      sortOrder: theme.sortOrder,
      isActive: theme.isActive,
    }));
  }

  /**
   * Get all active activity statuses
   */
  async getActivityStatuses(): Promise<LookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: activityStatuses.id,
        name: activityStatuses.name,
        displayName: activityStatuses.displayName,
        sortOrder: activityStatuses.sortOrder,
        isActive: activityStatuses.isActive,
      })
      .from(activityStatuses)
      .orderBy(activityStatuses.sortOrder);

    return results.map((status) => ({
      id: status.id,
      label: status.displayName || status.name,
      value: status.id,
      name: status.name,
      displayName: status.displayName,
      sortOrder: status.sortOrder,
      isActive: status.isActive,
    }));
  }

  /**
   * Create a new category
   */
  async createCategory(
    data: {
      name: string;
      displayName?: string | null;
      sortOrder: number;
      isActive?: boolean;
      visibility?: 'global' | 'team';
      allowsPitch?: boolean;
      description?: string | null;
    },
    currentUserId: number = 1
  ): Promise<typeof categories.$inferSelect> {
    const now = new Date();
    const [result] = await this.databaseService.db
      .insert(categories)
      .values({
        name: data.name,
        displayName: data.displayName ?? data.name, // Schema requires notNull, fallback to name
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
        visibility: data.visibility || 'global',
        allowsPitch: data.allowsPitch ?? true,
        description: data.description ?? undefined,
        createdBy: currentUserId,
        lastUpdatedBy: currentUserId,
        createdDateTime: now,
        lastUpdatedDateTime: now,
      })
      .returning();
    return result;
  }

  /**
   * Create a new city
   */
  async createCity(
    data: {
      name: string;
      displayName?: string | null;
      province?: string | null;
      sortOrder: number;
      isActive?: boolean;
    },
    currentUserId: number = 1
  ): Promise<typeof cities.$inferSelect> {
    const now = new Date();
    const [result] = await this.databaseService.db
      .insert(cities)
      .values({
        name: data.name,
        displayName: data.displayName ?? data.name, // Schema requires notNull, fallback to name
        province: data.province ?? undefined,
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
        createdBy: currentUserId,
        lastUpdatedBy: currentUserId,
        createdDateTime: now,
        lastUpdatedDateTime: now,
      })
      .returning();
    return result;
  }

  /**
   * Create a new comms material
   */
  async createCommsMaterial(
    data: {
      name: string;
      displayName?: string | null;
      sortOrder: number;
      isActive?: boolean;
      description?: string | null;
    },
    currentUserId: number = 1
  ): Promise<typeof commsMaterials.$inferSelect> {
    const now = new Date();
    const [result] = await this.databaseService.db
      .insert(commsMaterials)
      .values({
        name: data.name,
        displayName: data.displayName ?? undefined,
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
        description: data.description ?? undefined,
        createdBy: currentUserId,
        lastUpdatedBy: currentUserId,
        createdDateTime: now,
        lastUpdatedDateTime: now,
      })
      .returning();
    return result;
  }

  /**
   * Create a new government representative
   */
  async createGovernmentRepresentative(
    data: {
      name: string;
      displayName?: string | null;
      title?: string | null;
      sortOrder: number;
      isActive?: boolean;
      ministryId?: string | null;
      representativeType?: string | null;
    },
    currentUserId: number = 1
  ): Promise<typeof governmentRepresentatives.$inferSelect> {
    const now = new Date();
    const [result] = await this.databaseService.db
      .insert(governmentRepresentatives)
      .values({
        name: data.name,
        displayName: data.displayName ?? undefined,
        title: data.title ?? undefined,
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
        ministryId: data.ministryId ?? undefined,
        representativeType: data.representativeType ?? undefined,
        createdBy: currentUserId,
        lastUpdatedBy: currentUserId,
        createdDateTime: now,
        lastUpdatedDateTime: now,
      })
      .returning();
    return result;
  }

  /**
   * Create a new tag
   */
  async createTag(
    data: {
      name: string;
      displayName?: string | null;
      sortOrder: number;
      isActive?: boolean;
      visibility?: 'global' | 'team';
      description?: string | null;
    },
    currentUserId: number = 1
  ): Promise<typeof tags.$inferSelect> {
    const now = new Date();
    const [result] = await this.databaseService.db
      .insert(tags)
      .values({
        name: data.name,
        displayName: data.displayName ?? undefined,
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
        visibility: data.visibility || 'global',
        description: data.description ?? undefined,
        createdBy: currentUserId,
        lastUpdatedBy: currentUserId,
        createdDateTime: now,
        lastUpdatedDateTime: now,
      })
      .returning();
    return result;
  }

  /**
   * Create a new ministry
   */
  async createMinistry(
    data: {
      displayName: string;
      abbreviation: string; // Required by schema
      ministerName?: string | null;
      sortOrder: number;
      isActive?: boolean;
    },
    currentUserId: number = 1
  ): Promise<typeof ministries.$inferSelect> {
    const now = new Date();
    const [result] = await this.databaseService.db
      .insert(ministries)
      .values({
        displayName: data.displayName,
        abbreviation: data.abbreviation,
        ministerName: data.ministerName ?? undefined,
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
        createdBy: currentUserId,
        lastUpdatedBy: currentUserId,
        createdDateTime: now,
        lastUpdatedDateTime: now,
      })
      .returning();
    return result;
  }

  /**
   * Create a new activity status
   */
  async createActivityStatus(
    data: {
      name: string;
      displayName?: string | null;
      sortOrder: number;
      isActive?: boolean;
      description?: string | null;
    },
    currentUserId: number = 1
  ): Promise<typeof activityStatuses.$inferSelect> {
    const now = new Date();
    const [result] = await this.databaseService.db
      .insert(activityStatuses)
      .values({
        name: data.name,
        displayName: data.displayName ?? data.name, // Schema requires notNull, fallback to name
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
        description: data.description ?? undefined,
        createdBy: currentUserId,
        lastUpdatedBy: currentUserId,
        createdDateTime: now,
        lastUpdatedDateTime: now,
      })
      .returning();
    return result;
  }

  /**
   * Create a new theme
   */
  async createTheme(
    data: {
      key?: string | null;
      name: string;
      displayName?: string | null;
      sortOrder: number;
      isActive?: boolean;
    },
    currentUserId: number = 1
  ): Promise<any> {
    const now = new Date();
    const [result] = await this.databaseService.db
      .insert(themes)
      .values({
        key: data.key ?? null,
        name: data.name,
        displayName: data.displayName ?? null,
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
        createdBy: currentUserId,
        lastUpdatedBy: currentUserId,
        createdDateTime: now,
        lastUpdatedDateTime: now,
      })
      .returning();
    return result;
  }

  /**
   * Update methods
   */

  async updateCategory(
    id: number,
    data: Partial<{
      name: string;
      displayName: string;
      sortOrder: number;
      isActive: boolean;
      visibility: 'global' | 'team';
      allowsPitch: boolean;
      description: string | null;
    }>,
    currentUserId: number = 1
  ): Promise<typeof categories.$inferSelect | undefined> {
    // Build update object explicitly to ensure type safety
    const updateData: Partial<typeof categories.$inferInsert> = {
      lastUpdatedBy: currentUserId,
      lastUpdatedDateTime: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.displayName !== undefined)
      updateData.displayName = data.displayName;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.allowsPitch !== undefined)
      updateData.allowsPitch = data.allowsPitch;
    if (data.description !== undefined)
      updateData.description = data.description ?? undefined;

    const [result] = await this.databaseService.db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();
    return result;
  }

  async updateCity(
    id: number,
    data: Partial<{
      name: string;
      displayName: string;
      province: string | null;
      sortOrder: number;
      isActive: boolean;
    }>,
    currentUserId: number = 1
  ): Promise<typeof cities.$inferSelect | undefined> {
    // Build update object explicitly to ensure type safety
    const updateData: Partial<typeof cities.$inferInsert> = {
      lastUpdatedBy: currentUserId,
      lastUpdatedDateTime: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.displayName !== undefined)
      updateData.displayName = data.displayName;
    if (data.province !== undefined)
      updateData.province = data.province ?? undefined;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [result] = await this.databaseService.db
      .update(cities)
      .set(updateData)
      .where(eq(cities.id, id))
      .returning();
    return result;
  }

  async updateCommsMaterial(
    id: number,
    data: Partial<{
      name: string;
      displayName: string | null;
      sortOrder: number;
      isActive: boolean;
      description: string | null;
    }>,
    currentUserId: number = 1
  ): Promise<typeof commsMaterials.$inferSelect | undefined> {
    // Build update object explicitly to ensure type safety
    const updateData: Partial<typeof commsMaterials.$inferInsert> = {
      lastUpdatedBy: currentUserId,
      lastUpdatedDateTime: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.displayName !== undefined)
      updateData.displayName = data.displayName ?? undefined;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.description !== undefined)
      updateData.description = data.description ?? undefined;

    const [result] = await this.databaseService.db
      .update(commsMaterials)
      .set(updateData)
      .where(eq(commsMaterials.id, id))
      .returning();
    return result;
  }

  async updateGovernmentRepresentative(
    id: number,
    data: Partial<{
      name: string;
      displayName: string | null;
      title: string | null;
      sortOrder: number;
      isActive: boolean;
      ministryId: string | null;
      representativeType: string | null;
    }>,
    currentUserId: number = 1
  ): Promise<typeof governmentRepresentatives.$inferSelect | undefined> {
    // Build update object explicitly to ensure type safety
    const updateData: Partial<typeof governmentRepresentatives.$inferInsert> = {
      lastUpdatedBy: currentUserId,
      lastUpdatedDateTime: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.displayName !== undefined)
      updateData.displayName = data.displayName ?? undefined;
    if (data.title !== undefined) updateData.title = data.title ?? undefined;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.ministryId !== undefined)
      updateData.ministryId = data.ministryId ?? undefined;
    if (data.representativeType !== undefined)
      updateData.representativeType = data.representativeType ?? undefined;

    const [result] = await this.databaseService.db
      .update(governmentRepresentatives)
      .set(updateData)
      .where(eq(governmentRepresentatives.id, id))
      .returning();
    return result;
  }

  async updateTag(
    id: number,
    data: Partial<{
      name: string;
      displayName: string | null;
      sortOrder: number;
      isActive: boolean;
      visibility: 'global' | 'team';
      description: string | null;
    }>,
    currentUserId: number = 1
  ): Promise<typeof tags.$inferSelect | undefined> {
    // Build update object explicitly to ensure type safety
    const updateData: Partial<typeof tags.$inferInsert> = {
      lastUpdatedBy: currentUserId,
      lastUpdatedDateTime: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.displayName !== undefined)
      updateData.displayName = data.displayName ?? undefined;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.description !== undefined)
      updateData.description = data.description ?? undefined;

    const [result] = await this.databaseService.db
      .update(tags)
      .set(updateData)
      .where(eq(tags.id, id))
      .returning();
    return result;
  }

  async updateMinistry(
    id: string,
    data: Partial<{
      displayName: string;
      abbreviation: string;
      ministerName: string | null;
      sortOrder: number;
      isActive: boolean;
    }>,
    currentUserId: number = 1
  ): Promise<typeof ministries.$inferSelect | undefined> {
    // Build update object explicitly to ensure type safety
    const updateData: Partial<typeof ministries.$inferInsert> = {
      lastUpdatedBy: currentUserId,
      lastUpdatedDateTime: new Date(),
    };

    if (data.displayName !== undefined)
      updateData.displayName = data.displayName;
    if (data.abbreviation !== undefined)
      updateData.abbreviation = data.abbreviation;
    if (data.ministerName !== undefined)
      updateData.ministerName = data.ministerName ?? undefined;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [result] = await this.databaseService.db
      .update(ministries)
      .set(updateData)
      .where(eq(ministries.id, id))
      .returning();
    return result;
  }

  async updateActivityStatus(
    id: number,
    data: Partial<{
      name: string;
      displayName: string;
      sortOrder: number;
      isActive: boolean;
      description: string | null;
    }>,
    currentUserId: number = 1
  ): Promise<typeof activityStatuses.$inferSelect | undefined> {
    // Build update object explicitly to ensure type safety
    const updateData: Partial<typeof activityStatuses.$inferInsert> = {
      lastUpdatedBy: currentUserId,
      lastUpdatedDateTime: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.displayName !== undefined)
      updateData.displayName = data.displayName;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.description !== undefined)
      updateData.description = data.description ?? undefined;

    const [result] = await this.databaseService.db
      .update(activityStatuses)
      .set(updateData)
      .where(eq(activityStatuses.id, id))
      .returning();
    return result;
  }

  async updateTheme(
    id: string,
    data: Partial<{
      key: string | null;
      name: string;
      displayName: string | null;
      sortOrder: number;
      isActive: boolean;
    }>,
    currentUserId: number = 1
  ): Promise<typeof themes.$inferSelect | undefined> {
    // Build update object explicitly to ensure type safety
    const updateData: Partial<typeof themes.$inferInsert> = {
      lastUpdatedBy: currentUserId,
      lastUpdatedDateTime: new Date(),
    };

    if (data.key !== undefined) updateData.key = data.key ?? undefined;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.displayName !== undefined)
      updateData.displayName = data.displayName ?? undefined;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [result] = await this.databaseService.db
      .update(themes)
      .set(updateData)
      .where(eq(themes.id, id))
      .returning();
    return result;
  }
}
