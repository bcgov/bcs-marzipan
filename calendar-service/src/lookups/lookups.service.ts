import { Injectable } from '@nestjs/common';
import { eq, and, inArray, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { Visibility } from '@corpcal/shared';
import {
  categories,
  organizations,
  systemUsers,
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
        }));
    } else {
      // If no teams provided, return only global categories
      const results = await this.databaseService.db
        .select({
          id: categories.id,
          name: categories.name,
          displayName: categories.displayName,
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
   * Get all active system users
   * Computes display name from adDisplayName or falls back to adUsername
   * Supports filtering by userIds to fetch specific users
   * TODO: Implement scoping based on role, organizationId
   */
  async getUsers(params?: LookupQueryParams): Promise<UserLookupItem[]> {
    // Build where conditions
    const conditions: SQL[] = [eq(systemUsers.isActive, true)];

    // Filter by specific user IDs if provided
    if (params?.userIds && params.userIds.length > 0) {
      // Controller already parses userIds into number array, but TypeScript needs explicit type
      const userIdsArray = params.userIds;
      conditions.push(inArray(systemUsers.id, userIdsArray));
    }

    const results = await this.databaseService.db
      .select({
        id: systemUsers.id,
        adUsername: systemUsers.adUsername,
        adDisplayName: systemUsers.adDisplayName,
        adEmail: systemUsers.adEmail,
      })
      .from(systemUsers)
      .where(and(...conditions))
      .orderBy(systemUsers.adDisplayName, systemUsers.adUsername);

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
      })
      .from(tags)
      .where(eq(tags.isActive, true))
      .orderBy(tags.sortOrder);

    return results.map((tag) => ({
      id: tag.id,
      label: tag.displayName || tag.name || String(tag.id),
      value: tag.id,
      name: tag.name,
      displayName: tag.displayName,
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
      })
      .from(activityStatuses)
      .where(eq(activityStatuses.isActive, true))
      .orderBy(activityStatuses.sortOrder);

    return results.map((status) => ({
      id: status.id,
      label: status.displayName || status.name,
      value: status.id,
      name: status.name,
      displayName: status.displayName,
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
   * Get all active comms materials
   */
  async getCommsMaterials(): Promise<CommsMaterialsLookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: commsMaterials.id,
        name: commsMaterials.name,
        displayName: commsMaterials.displayName,
      })
      .from(commsMaterials)
      .where(eq(commsMaterials.isActive, true))
      .orderBy(commsMaterials.sortOrder);

    return results.map((material) => ({
      id: material.id,
      label: material.displayName || material.name,
      value: material.id,
      name: material.name,
      displayName: material.displayName,
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
      })
      .from(governmentRepresentatives)
      .where(eq(governmentRepresentatives.isActive, true))
      .orderBy(governmentRepresentatives.sortOrder);

    return results.map((rep) => ({
      id: rep.id,
      label: rep.displayName || rep.name,
      value: rep.id,
      name: rep.name,
      displayName: rep.displayName,
      title: rep.title,
      ministryId: rep.ministryId,
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
   * TODO: Implement scoping based on userId, role
   */
  async getActivitiesForLookup(
    _params?: LookupQueryParams
  ): Promise<LookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: activities.id,
        title: activities.title,
      })
      .from(activities)
      .where(eq(activities.isActive, true))
      .orderBy(activities.title);

    return results.map((activity) => ({
      id: activity.id,
      label: activity.title || `Activity ${activity.id}`,
      value: activity.id,
      title: activity.title,
    }));
  }
}
