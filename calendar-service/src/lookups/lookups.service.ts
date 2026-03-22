import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, ne, type SQL } from 'drizzle-orm';

import {
  activities,
  activityStatuses,
  categories,
  cities,
  commsMaterials,
  dateStatuses,
  eventPlanners,
  governmentRepresentatives,
  ministries,
  newsReleaseDistributions,
  newsReleaseOrigins,
  organizations,
  pitchRequiredStatuses,
  pitchStatuses,
  premierRequested,
  reports,
  roles,
  tags,
  themes,
  timeStatuses,
  translatedLanguages,
  translationRequiredStatuses,
  users,
  venueAddresses,
  venueQuickPicks,
} from '@corpcal/database/schema';
import type { ActivityStatusName } from '@corpcal/shared';
import type {
  CategoryLookupItem,
  CommsMaterialsLookupItem,
  GovernmentRepresentativeLookupItem,
  LookupItem,
  LookupQueryParams,
  MinistryLookupItem,
  OrganizationLookupItem,
  PitchStatusLookupItem,
  ReportResponse,
  TagLookupItem,
  ThemeLookupItem,
  TranslationLanguageLookupItem,
  UserLookupItem,
  VenueQuickPickItem,
} from '@corpcal/shared/api/types';

import { DatabaseService } from '../database/database.service';
import { getVisibleCategoryIds } from '../policy/category-scoping.helper';

@Injectable()
export class LookupsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all active categories available to the user based on their team memberships
   * @param userTeams - Optional array of team IDs the user belongs to
   * @returns Categories that are either global or team-scoped for the user's teams
   */
  async getCategories(userTeams?: number[]): Promise<CategoryLookupItem[]> {
    const ids = await getVisibleCategoryIds(this.databaseService.db, userTeams);
    if (ids.length === 0) {
      return [];
    }
    const results = await this.databaseService.db
      .select({
        id: categories.id,
        name: categories.name,
        displayName: categories.displayName,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
      })
      .from(categories)
      .where(and(eq(categories.isActive, true), inArray(categories.id, ids)))
      .orderBy(categories.sortOrder);

    return results.map((cat) => ({
      id: cat.id,
      label: cat.displayName,
      value: cat.id,
      name: cat.name,
      displayName: cat.displayName,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    }));
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
        ministryId: organizations.ministryId,
      })
      .from(organizations)
      .where(eq(organizations.isActive, true))
      .orderBy(organizations.sortOrder);

    return results.map((org) => ({
      id: org.id,
      label: org.displayName,
      value: org.id,
      name: org.name,
      displayName: org.displayName,
      ministryId: org.ministryId,
    }));
  }

  /**
   * Get all active roles (id, name, description) for dropdowns
   */
  async getRoles(): Promise<
    {
      id: number;
      name: string;
      description: string | null;
    }[]
  > {
    const results = await this.databaseService.db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
      })
      .from(roles)
      .where(eq(roles.isActive, true))
      .orderBy(roles.name);
    return results;
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
        adJobTitle: users.adJobTitle,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(users.adDisplayName, users.adUsername);

    return results.map((user) => {
      const label = user.adDisplayName ?? user.adUsername ?? `User ${user.id}`;
      return {
        id: user.id,
        label,
        value: user.id,
        name: label,
        email: user.adEmail,
        username: user.adUsername,
        jobTitle: user.adJobTitle,
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
      label: tag.displayName,
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
      label: status.displayName,
      value: status.id,
      name: status.name,
      displayName: status.displayName,
    }));
  }

  /**
   * Get all active date statuses
   */
  async getDateStatuses(): Promise<LookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: dateStatuses.id,
        name: dateStatuses.name,
        displayName: dateStatuses.displayName,
      })
      .from(dateStatuses)
      .where(eq(dateStatuses.isActive, true))
      .orderBy(dateStatuses.sortOrder);

    return results.map((status) => ({
      id: status.id,
      label: status.displayName,
      value: status.id,
      name: status.name,
      displayName: status.displayName,
    }));
  }

  /**
   * Get all active time statuses
   */
  async getTimeStatuses(): Promise<LookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: timeStatuses.id,
        name: timeStatuses.name,
        displayName: timeStatuses.displayName,
      })
      .from(timeStatuses)
      .where(eq(timeStatuses.isActive, true))
      .orderBy(timeStatuses.sortOrder);

    return results.map((status) => ({
      id: status.id,
      label: status.displayName,
      value: status.id,
      name: status.name,
      displayName: status.displayName,
    }));
  }

  /**
   * Get all active pitch required statuses (pending, required, not_required)
   */
  async getPitchRequiredStatuses(): Promise<LookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: pitchRequiredStatuses.id,
        name: pitchRequiredStatuses.name,
        displayName: pitchRequiredStatuses.displayName,
      })
      .from(pitchRequiredStatuses)
      .where(eq(pitchRequiredStatuses.isActive, true))
      .orderBy(pitchRequiredStatuses.sortOrder);

    return results.map((status) => ({
      id: status.id,
      label: status.displayName,
      value: status.id,
      name: status.name,
      displayName: status.displayName,
    }));
  }

  /**
   * Get all active translation required statuses (pending, required, not_required)
   */
  async getTranslationRequiredStatuses(): Promise<LookupItem[]> {
    const results = await this.databaseService.db
      .select({
        id: translationRequiredStatuses.id,
        name: translationRequiredStatuses.name,
        displayName: translationRequiredStatuses.displayName,
      })
      .from(translationRequiredStatuses)
      .where(eq(translationRequiredStatuses.isActive, true))
      .orderBy(translationRequiredStatuses.sortOrder);

    return results.map((status) => ({
      id: status.id,
      label: status.displayName,
      value: status.id,
      name: status.name,
      displayName: status.displayName,
    }));
  }

  /**
   * Search for Canadian addresses using Canada Post API
   */
  async findAddresses(
    searchTerm: string,
    country: string = 'CAN',
    lastId?: string
  ): Promise<any[]> {
    const apiKey = process.env.CANADA_POST_API_KEY;
    if (!apiKey) {
      throw new Error('CANADA_POST_API_KEY environment variable not set');
    }

    const params = new URLSearchParams({
      Key: apiKey,
      SearchTerm: searchTerm,
      Country: country,
      ...(lastId && { LastId: lastId }),
    });

    const url = `https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Find/v2.10/json3ex.ws?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Canada Post API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.Items || [];
  }

  /**
   * Retrieve full address details using Canada Post API
   */
  async retrieveAddress(id: string): Promise<any> {
    const apiKey = process.env.CANADA_POST_API_KEY;
    if (!apiKey) {
      throw new Error('CANADA_POST_API_KEY environment variable not set');
    }

    const params = new URLSearchParams({
      Key: apiKey,
      Id: id,
    });

    const url = `https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Retrieve/v2.11/json3ex.ws?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Canada Post API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const items = data.Items || [];

    if (items.length === 0) {
      throw new Error('No address found');
    }

    const item = items[0];
    return {
      addressLine1: `${item.Line1}${item.Line2 ? ' ' + item.Line2 : ''}`.trim(),
      city: item.City,
      province: item.ProvinceName,
      provinceCode: item.ProvinceCode,
      country: item.CountryName,
      countryCode: item.CountryIso2,
      postalCode: item.PostalCode,
    };
  }

  /**
   * Get active venue quick-picks for the activity form (admin-configured, max 4).
   */
  async getVenueQuickPicks(): Promise<VenueQuickPickItem[]> {
    const results = await this.databaseService.db
      .select({
        id: venueQuickPicks.id,
        venueName: venueQuickPicks.venueName,
        addressLine1: venueQuickPicks.addressLine1,
        addressLine2: venueQuickPicks.addressLine2,
        city: venueQuickPicks.city,
        provinceOrState: venueQuickPicks.provinceOrState,
        country: venueQuickPicks.country,
      })
      .from(venueQuickPicks)
      .where(eq(venueQuickPicks.isActive, true))
      .orderBy(venueQuickPicks.sortOrder);
    return results.map((row) => ({
      id: row.id,
      venueName: row.venueName,
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2,
      city: row.city,
      provinceOrState: row.provinceOrState,
      country: row.country,
    }));
  }

  /**
   * Get last 2 distinct venue addresses used by the current user (from activities they last updated).
   */
  async getVenueLastUsed(userId: number): Promise<VenueQuickPickItem[]> {
    const rows = await this.databaseService.db
      .select({
        venueName: venueAddresses.venueName,
        addressLine1: venueAddresses.addressLine1,
        addressLine2: venueAddresses.addressLine2,
        city: venueAddresses.city,
        provinceOrState: venueAddresses.provinceOrState,
        country: venueAddresses.country,
        lastUpdated: activities.lastUpdatedDateTime,
      })
      .from(venueAddresses)
      .innerJoin(activities, eq(venueAddresses.activityId, activities.id))
      .where(eq(activities.lastUpdatedBy, userId))
      .orderBy(desc(activities.lastUpdatedDateTime))
      .limit(10);
    const seen = new Set<string>();
    const out: Array<{
      venueName: string | null;
      addressLine1: string | null;
      addressLine2: string | null;
      city: string | null;
      provinceOrState: string | null;
      country: string | null;
    }> = [];
    for (const row of rows) {
      const key = `${row.addressLine1 ?? ''}|${row.addressLine2 ?? ''}|${row.city ?? ''}|${row.country ?? ''}`;
      if (seen.has(key) || out.length >= 2) continue;
      seen.add(key);
      out.push({
        venueName: row.venueName,
        addressLine1: row.addressLine1,
        addressLine2: row.addressLine2,
        city: row.city,
        provinceOrState: row.provinceOrState,
        country: row.country,
      });
    }
    return out.map((item, index) => ({ id: -(index + 1), ...item }));
  }

  /**
   * Create a venue quick-pick. Enforce max 4 active.
   */
  async createVenueQuickPick(
    data: {
      venueName: string;
      addressLine1?: string | null;
      addressLine2?: string | null;
      city?: string | null;
      provinceOrState?: string | null;
      country?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    },
    currentUserId: number
  ): Promise<VenueQuickPickItem> {
    const activeList = await this.databaseService.db
      .select({ id: venueQuickPicks.id })
      .from(venueQuickPicks)
      .where(eq(venueQuickPicks.isActive, true));
    if (activeList.length >= 4) {
      throw new Error('Maximum 4 active venue quick-picks allowed');
    }
    const now = new Date();
    const [result] = await this.databaseService.db
      .insert(venueQuickPicks)
      .values({
        venueName: data.venueName,
        addressLine1: data.addressLine1 ?? undefined,
        addressLine2: data.addressLine2 ?? undefined,
        city: data.city ?? undefined,
        provinceOrState: data.provinceOrState ?? undefined,
        country: data.country ?? undefined,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
        createdBy: currentUserId,
        lastUpdatedBy: currentUserId,
        createdDateTime: now,
        lastUpdatedDateTime: now,
      })
      .returning();
    return {
      id: result.id,
      venueName: result.venueName,
      addressLine1: result.addressLine1,
      addressLine2: result.addressLine2,
      city: result.city,
      provinceOrState: result.provinceOrState,
      country: result.country,
    };
  }

  /**
   * Update a venue quick-pick. Enforce max 4 active when setting isActive to true.
   */
  async updateVenueQuickPick(
    id: number,
    data: {
      venueName?: string;
      addressLine1?: string | null;
      addressLine2?: string | null;
      city?: string | null;
      provinceOrState?: string | null;
      country?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    },
    currentUserId: number
  ): Promise<VenueQuickPickItem> {
    if (data.isActive === true) {
      const activeCount = await this.databaseService.db
        .select({ id: venueQuickPicks.id })
        .from(venueQuickPicks)
        .where(eq(venueQuickPicks.isActive, true));
      const current = await this.databaseService.db
        .select({ isActive: venueQuickPicks.isActive })
        .from(venueQuickPicks)
        .where(eq(venueQuickPicks.id, id))
        .limit(1);
      const wasAlreadyActive = current[0]?.isActive ?? false;
      if (!wasAlreadyActive && activeCount.length >= 4) {
        throw new Error('Maximum 4 active venue quick-picks allowed');
      }
    }
    const now = new Date();
    const [result] = await this.databaseService.db
      .update(venueQuickPicks)
      .set({
        ...(data.venueName !== undefined && { venueName: data.venueName }),
        ...(data.addressLine1 !== undefined && {
          addressLine1: data.addressLine1,
        }),
        ...(data.addressLine2 !== undefined && {
          addressLine2: data.addressLine2,
        }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.provinceOrState !== undefined && {
          provinceOrState: data.provinceOrState,
        }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        lastUpdatedBy: currentUserId,
        lastUpdatedDateTime: now,
      })
      .where(eq(venueQuickPicks.id, id))
      .returning();
    if (!result) throw new Error('Venue quick-pick not found');
    return {
      id: result.id,
      venueName: result.venueName,
      addressLine1: result.addressLine1,
      addressLine2: result.addressLine2,
      city: result.city,
      provinceOrState: result.provinceOrState,
      country: result.country,
    };
  }

  /**
   * Delete a venue quick-pick (hard delete).
   */
  async deleteVenueQuickPick(id: number): Promise<void> {
    const deleted = await this.databaseService.db
      .delete(venueQuickPicks)
      .where(eq(venueQuickPicks.id, id))
      .returning({ id: venueQuickPicks.id });
    if (deleted.length === 0) throw new Error('Venue quick-pick not found');
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
      label: material.displayName,
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
        shortcode: translatedLanguages.shortcode,
      })
      .from(translatedLanguages)
      .where(eq(translatedLanguages.isActive, true))
      .orderBy(translatedLanguages.sortOrder);

    return results.map((lang) => ({
      id: lang.id,
      label: lang.displayName,
      value: lang.id,
      name: lang.name,
      displayName: lang.displayName,
      shortcode: lang.shortcode,
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
      label: rep.displayName,
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
      label: planner.displayName,
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
      label: dist.displayName,
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
      label: premier.displayName,
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
      label: origin.displayName,
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
      label: activity.title,
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
        provinceOrState: cities.provinceOrState,
        country: cities.country,
        sortOrder: cities.sortOrder,
        isActive: cities.isActive,
      })
      .from(cities)
      .orderBy(cities.sortOrder);

    return results.map((city) => ({
      id: city.id,
      label: city.displayName,
      value: city.id,
      name: city.name,
      displayName: city.displayName,
      provinceOrState: city.provinceOrState,
      country: city.country,
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
        name: ministries.name,
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
      label: ministry.displayName,
      value: ministry.id,
      name: ministry.name,
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
        name: themes.name,
        displayName: themes.displayName,
        sortOrder: themes.sortOrder,
        isActive: themes.isActive,
      })
      .from(themes)
      .orderBy(themes.sortOrder);

    return results.map((theme) => ({
      id: theme.id,
      label: theme.displayName,
      value: theme.id,
      name: theme.name,
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
      label: status.displayName,
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
      description?: string | null;
    },
    currentUserId: number
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
      provinceOrState?: string | null;
      country?: string | null;
      sortOrder: number;
      isActive?: boolean;
    },
    currentUserId: number
  ): Promise<typeof cities.$inferSelect> {
    const now = new Date();
    const [result] = await this.databaseService.db
      .insert(cities)
      .values({
        name: data.name,
        displayName: data.displayName ?? data.name, // Schema requires notNull, fallback to name
        provinceOrState: data.provinceOrState ?? undefined,
        country: data.country ?? undefined,
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
    currentUserId: number
  ): Promise<typeof commsMaterials.$inferSelect> {
    const now = new Date();
    const [result] = await this.databaseService.db
      .insert(commsMaterials)
      .values({
        name: data.name,
        displayName: data.displayName ?? data.name,
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
      ministryId?: number | null;
      representativeType?: string | null;
    },
    currentUserId: number
  ): Promise<typeof governmentRepresentatives.$inferSelect> {
    const now = new Date();
    const [result] = await this.databaseService.db
      .insert(governmentRepresentatives)
      .values({
        name: data.name,
        displayName: data.displayName ?? data.name,
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
    currentUserId: number
  ): Promise<typeof tags.$inferSelect> {
    const now = new Date();
    const [result] = await this.databaseService.db
      .insert(tags)
      .values({
        name: data.name,
        displayName: data.displayName ?? data.name,
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
      name: string;
      displayName: string;
      abbreviation: string; // Required by schema
      ministerName?: string | null;
      sortOrder: number;
      isActive?: boolean;
    },
    currentUserId: number
  ): Promise<typeof ministries.$inferSelect> {
    const now = new Date();
    const [result] = await this.databaseService.db
      .insert(ministries)
      .values({
        name: data.name,
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
    currentUserId: number
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
      name: string;
      displayName?: string | null;
      sortOrder: number;
      isActive?: boolean;
    },
    currentUserId: number
  ): Promise<any> {
    const now = new Date();
    const [result] = await this.databaseService.db
      .insert(themes)
      .values({
        name: data.name,
        displayName: data.displayName ?? data.name,
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
      description: string | null;
    }>,
    currentUserId: number
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
      provinceOrState: string | null;
      country: string | null;
      sortOrder: number;
      isActive: boolean;
    }>,
    currentUserId: number
  ): Promise<typeof cities.$inferSelect | undefined> {
    // Build update object explicitly to ensure type safety
    const updateData: Partial<typeof cities.$inferInsert> = {
      lastUpdatedBy: currentUserId,
      lastUpdatedDateTime: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.displayName !== undefined)
      updateData.displayName = data.displayName;
    if (data.provinceOrState !== undefined)
      updateData.provinceOrState = data.provinceOrState ?? undefined;
    if (data.country !== undefined)
      updateData.country = data.country ?? undefined;
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
    currentUserId: number
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
      ministryId: number | null;
      representativeType: string | null;
    }>,
    currentUserId: number
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
    currentUserId: number
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
    id: number,
    data: Partial<{
      name: string;
      displayName: string;
      abbreviation: string;
      ministerName: string | null;
      sortOrder: number;
      isActive: boolean;
    }>,
    currentUserId: number
  ): Promise<typeof ministries.$inferSelect | undefined> {
    // Build update object explicitly to ensure type safety
    const updateData: Partial<typeof ministries.$inferInsert> = {
      lastUpdatedBy: currentUserId,
      lastUpdatedDateTime: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
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
    currentUserId: number
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
    id: number,
    data: Partial<{
      name: string;
      displayName: string | null;
      sortOrder: number;
      isActive: boolean;
    }>,
    currentUserId: number
  ): Promise<typeof themes.$inferSelect | undefined> {
    // Build update object explicitly to ensure type safety
    const updateData: Partial<typeof themes.$inferInsert> = {
      lastUpdatedBy: currentUserId,
      lastUpdatedDateTime: new Date(),
    };

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
