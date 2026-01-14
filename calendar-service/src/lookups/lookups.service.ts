import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  categories,
  organizations,
  systemUsers,
  tags,
  pitchStatuses,
  schedulingStatuses,
  commsMaterials,
  translatedLanguages,
  governmentRepresentatives,
  activities,
  cities,
  ministries,
  themes,
  activityStatuses,
} from '@corpcal/database/schema';
import { DatabaseService } from '../database/database.service';

export interface LookupItem {
  id: string | number;
  label: string;
  value: string | number;
  [key: string]: unknown;
}

export interface LookupQueryParams {
  userId?: number;
  role?: string;
  organizationId?: string;
}

@Injectable()
export class LookupsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all active categories
   */
  async getCategories(): Promise<LookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: categories.id,
        name: categories.name,
        displayName: categories.displayName,
      })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.sortOrder);

    return results.map((cat) => ({
      id: cat.id,
      label: cat.displayName || cat.name,
      value: cat.id,
      name: cat.name,
      displayName: cat.displayName,
    }));
  }

  /**
   * Get all active organizations
   * TODO: Implement scoping based on userId, role, organizationId
   */
  async getOrganizations(_params?: LookupQueryParams): Promise<LookupItem[]> {
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
   * Computes display name from firstName/lastName or falls back to username
   * TODO: Implement scoping based on userId, role, organizationId
   */
  async getUsers(_params?: LookupQueryParams): Promise<LookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: systemUsers.id,
        username: systemUsers.username,
        firstName: systemUsers.firstName,
        lastName: systemUsers.lastName,
        email: systemUsers.email,
      })
      .from(systemUsers)
      .where(eq(systemUsers.isActive, true))
      .orderBy(systemUsers.lastName, systemUsers.firstName);

    return results.map((user) => {
      const name =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.username || `User ${user.id}`;
      return {
        id: user.id,
        label: name,
        value: user.id,
        name,
        email: user.email,
        username: user.username,
      };
    });
  }

  /**
   * Get all active tags
   */
  async getTags(): Promise<LookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: tags.id,
        key: tags.key,
        displayName: tags.displayName,
      })
      .from(tags)
      .where(eq(tags.isActive, true))
      .orderBy(tags.sortOrder);

    return results.map((tag) => ({
      id: tag.id,
      label: tag.displayName || tag.key || tag.id,
      value: tag.id,
      key: tag.key,
      displayName: tag.displayName,
    }));
  }

  /**
   * Get all active pitch statuses
   */
  async getPitchStatuses(): Promise<LookupItem[]> {
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
   * Get all active scheduling statuses
   */
  async getSchedulingStatuses(): Promise<LookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: schedulingStatuses.id,
        name: schedulingStatuses.name,
        displayName: schedulingStatuses.displayName,
      })
      .from(schedulingStatuses)
      .where(eq(schedulingStatuses.isActive, true))
      .orderBy(schedulingStatuses.sortOrder);

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
  async getCommsMaterials(): Promise<LookupItem[]> {
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
  async getTranslationLanguages(): Promise<LookupItem[]> {
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
  async getGovernmentRepresentatives(): Promise<LookupItem[]> {
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
      })
      .from(cities)
      .where(eq(cities.isActive, true))
      .orderBy(cities.sortOrder);

    return results.map((city) => ({
      id: city.id,
      label: city.displayName || city.name,
      value: city.id,
      name: city.name,
      displayName: city.displayName,
      province: city.province,
    }));
  }

  /**
   * Get all active ministries
   */
  async getMinistries(): Promise<LookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: ministries.id,
        displayName: ministries.displayName,
        abbreviation: ministries.abbreviation,
        ministerName: ministries.ministerName,
      })
      .from(ministries)
      .where(eq(ministries.isActive, true))
      .orderBy(ministries.sortOrder);

    return results.map((ministry) => ({
      id: ministry.id,
      label: ministry.displayName || ministry.abbreviation || ministry.id,
      value: ministry.id,
      displayName: ministry.displayName,
      abbreviation: ministry.abbreviation,
      ministerName: ministry.ministerName,
    }));
  }

  /**
   * Get all active themes
   */
  async getThemes(): Promise<LookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: themes.id,
        key: themes.key,
        displayName: themes.displayName,
      })
      .from(themes)
      .where(eq(themes.isActive, true))
      .orderBy(themes.sortOrder);

    return results.map((theme) => ({
      id: theme.id,
      label: theme.displayName || theme.key || theme.id,
      value: theme.id,
      key: theme.key,
      displayName: theme.displayName,
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
   * Create a new category
   */
  async createCategory(data: {
    name: string;
    displayName?: string;
    sortOrder: number;
    isActive?: boolean;
  }): Promise<any> {
    const [result] = await this.databaseService.db
      .insert(categories)
      .values({
        name: data.name,
        displayName: data.displayName || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
      })
      .returning();
    return result;
  }

  /**
   * Create a new city
   */
  async createCity(data: {
    name: string;
    displayName?: string;
    province?: string;
    sortOrder: number;
    isActive?: boolean;
  }): Promise<any> {
    const [result] = await this.databaseService.db
      .insert(cities)
      .values({
        name: data.name,
        displayName: data.displayName || null,
        province: data.province || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
      })
      .returning();
    return result;
  }

  /**
   * Create a new comms material
   */
  async createCommsMaterial(data: {
    name: string;
    displayName?: string;
    sortOrder: number;
    isActive?: boolean;
  }): Promise<any> {
    const [result] = await this.databaseService.db
      .insert(commsMaterials)
      .values({
        name: data.name,
        displayName: data.displayName || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
      })
      .returning();
    return result;
  }

  /**
   * Create a new government representative
   */
  async createGovernmentRepresentative(data: {
    name: string;
    displayName?: string;
    title?: string;
    sortOrder: number;
    isActive?: boolean;
  }): Promise<any> {
    const [result] = await this.databaseService.db
      .insert(governmentRepresentatives)
      .values({
        name: data.name,
        displayName: data.displayName || null,
        title: data.title || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
      })
      .returning();
    return result;
  }

  /**
   * Create a new tag
   */
  async createTag(data: {
    key: string;
    displayName?: string;
    sortOrder: number;
    isActive?: boolean;
  }): Promise<any> {
    const [result] = await this.databaseService.db
      .insert(tags)
      .values({
        key: data.key,
        displayName: data.displayName || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
      })
      .returning();
    return result;
  }

  /**
   * Create a new ministry
   */
  async createMinistry(data: {
    displayName: string;
    abbreviation?: string;
    ministerName?: string;
    sortOrder: number;
    isActive?: boolean;
  }): Promise<any> {
    const [result] = await this.databaseService.db
      .insert(ministries)
      .values({
        displayName: data.displayName,
        abbreviation: data.abbreviation || null,
        ministerName: data.ministerName || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
      })
      .returning();
    return result;
  }

  /**
   * Create a new activity status
   */
  async createActivityStatus(data: {
    name: string;
    displayName?: string;
    sortOrder: number;
    isActive?: boolean;
  }): Promise<any> {
    const [result] = await this.databaseService.db
      .insert(activityStatuses)
      .values({
        name: data.name,
        displayName: data.displayName || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
      })
      .returning();
    return result;
  }

  /**
   * Create a new theme
   */
  async createTheme(data: {
    key: string;
    displayName?: string;
    sortOrder: number;
    isActive?: boolean;
  }): Promise<any> {
    const [result] = await this.databaseService.db
      .insert(themes)
      .values({
        key: data.key,
        displayName: data.displayName || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
      })
      .returning();
    return result;
  }
}
