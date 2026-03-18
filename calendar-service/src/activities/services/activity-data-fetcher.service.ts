import { Injectable } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';

import {
  activities,
  activityCategories,
  activityCommsContacts,
  activityCommsMaterials,
  activityEventPlanners,
  activityReportSettings,
  activityRepresentatives,
  activitySharedWithTeams,
  activityStatuses,
  activityTags,
  activityTranslationsRequired,
  categories,
  commsMaterials,
  dateStatuses,
  eventPlanners,
  ministries,
  newsReleaseDistributions,
  newsReleaseOrigins,
  organizations,
  pitchRequiredStatuses,
  premierRequested,
  reports,
  tags,
  teams,
  timeStatuses,
  translatedLanguages,
  translationRequiredStatuses,
  users,
  venueAddresses,
} from '@corpcal/database/schema';
import type { Activity } from '@corpcal/database/types';
import type { EventPlannerDetail } from '@corpcal/shared/schemas';

import { DatabaseService } from '../../database/database.service';

/**
 * Service for fetching related data for activities
 * Handles batch fetching of categories, tags, statuses, organizations, users, etc.
 */
@Injectable()
export class ActivityDataFetcherService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Fetch categories for multiple activities
   * Returns both category names and IDs for each activity
   */
  async fetchCategoriesForActivities(activityIds: number[]): Promise<{
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
        categoryName: categories.displayName,
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
  async fetchTagsForActivities(
    activityIds: number[]
  ): Promise<Map<number, Array<{ id: number; text: string }>>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityTags.activityId,
        tagId: tags.id,
        tagDisplayName: tags.displayName,
        tagName: tags.name,
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

    const map = new Map<number, Array<{ id: number; text: string }>>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push({
        id: row.tagId,
        text: row.tagDisplayName ?? row.tagName ?? '',
      });
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Fetch news release origins for multiple activities
   */
  async fetchNewsReleaseOriginsForActivities(
    activityIds: number[]
  ): Promise<Map<number, string | null>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const activityResults = await this.databaseService.db
      .select({
        id: activities.id,
        newsReleaseOriginId: activities.newsReleaseOriginId,
      })
      .from(activities)
      .where(inArray(activities.id, activityIds));

    const originIds = activityResults
      .map((a) => a.newsReleaseOriginId)
      .filter((id): id is number => id !== null && id !== undefined);

    if (originIds.length === 0) {
      // Return map with null values for all activities
      const resultMap = new Map<number, string | null>();
      for (const activity of activityResults) {
        resultMap.set(activity.id, null);
      }
      return resultMap;
    }

    const originResults = await this.databaseService.db
      .select({
        id: newsReleaseOrigins.id,
        name: newsReleaseOrigins.name,
      })
      .from(newsReleaseOrigins)
      .where(
        and(
          inArray(newsReleaseOrigins.id, originIds),
          eq(newsReleaseOrigins.isActive, true)
        )
      );

    const originMap = new Map<number, string>(
      originResults.map((o) => [o.id, o.name])
    );

    const resultMap = new Map<number, string | null>();
    for (const activity of activityResults) {
      if (activity.newsReleaseOriginId) {
        const originName = originMap.get(activity.newsReleaseOriginId);
        resultMap.set(activity.id, originName ?? null);
      } else {
        resultMap.set(activity.id, null);
      }
    }
    return resultMap;
  }

  /**
   * Fetch news release distributions for multiple activities
   */
  async fetchNewsReleaseDistributionsForActivities(
    activityIds: number[]
  ): Promise<Map<number, string | null>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const activityResults = await this.databaseService.db
      .select({
        id: activities.id,
        newsReleaseDistributionId: activities.newsReleaseDistributionId,
      })
      .from(activities)
      .where(inArray(activities.id, activityIds));

    const distributionIds = activityResults
      .map((a) => a.newsReleaseDistributionId)
      .filter((id): id is number => id !== null && id !== undefined);

    if (distributionIds.length === 0) {
      // Return map with null values for all activities
      const resultMap = new Map<number, string | null>();
      for (const activity of activityResults) {
        resultMap.set(activity.id, null);
      }
      return resultMap;
    }

    const distributionResults = await this.databaseService.db
      .select({
        id: newsReleaseDistributions.id,
        name: newsReleaseDistributions.name,
      })
      .from(newsReleaseDistributions)
      .where(
        and(
          inArray(newsReleaseDistributions.id, distributionIds),
          eq(newsReleaseDistributions.isActive, true)
        )
      );

    const distributionMap = new Map<number, string>(
      distributionResults.map((d) => [d.id, d.name])
    );

    const resultMap = new Map<number, string | null>();
    for (const activity of activityResults) {
      if (activity.newsReleaseDistributionId) {
        const distributionName = distributionMap.get(
          activity.newsReleaseDistributionId
        );
        resultMap.set(activity.id, distributionName ?? null);
      } else {
        resultMap.set(activity.id, null);
      }
    }
    return resultMap;
  }

  /**
   * Fetch premier requested for multiple activities
   */
  async fetchPremierRequestedForActivities(
    activityIds: number[]
  ): Promise<Map<number, string | null>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const activityResults = await this.databaseService.db
      .select({
        id: activities.id,
        premierRequestedId: activities.premierRequestedId,
      })
      .from(activities)
      .where(inArray(activities.id, activityIds));

    const premierRequestedIds = activityResults
      .map((a) => a.premierRequestedId)
      .filter((id): id is number => id !== null && id !== undefined);

    if (premierRequestedIds.length === 0) {
      // Return map with null values for all activities
      const resultMap = new Map<number, string | null>();
      for (const activity of activityResults) {
        resultMap.set(activity.id, null);
      }
      return resultMap;
    }

    const premierRequestedResults = await this.databaseService.db
      .select({
        id: premierRequested.id,
        displayName: premierRequested.displayName,
      })
      .from(premierRequested)
      .where(
        and(
          inArray(premierRequested.id, premierRequestedIds),
          eq(premierRequested.isActive, true)
        )
      );

    const premierRequestedMap = new Map<number, string>(
      premierRequestedResults.map((p) => [p.id, p.displayName])
    );

    const resultMap = new Map<number, string | null>();
    for (const activity of activityResults) {
      if (activity.premierRequestedId) {
        const premierRequestedName = premierRequestedMap.get(
          activity.premierRequestedId
        );
        resultMap.set(activity.id, premierRequestedName ?? null);
      } else {
        resultMap.set(activity.id, null);
      }
    }
    return resultMap;
  }

  /**
   * Fetch date statuses for multiple activities
   */
  async fetchDateStatusesForActivities(
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
        name: dateStatuses.displayName,
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
  async fetchTimeStatusesForActivities(
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
        name: timeStatuses.displayName,
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
   * Fetch venue addresses for multiple activities
   */
  async fetchVenueAddressesForActivities(activityIds: number[]): Promise<
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
  async fetchActivityStatusesForActivities(
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
        displayName: activityStatuses.displayName,
      })
      .from(activityStatuses)
      .where(
        and(
          inArray(activityStatuses.id, activityStatusIds),
          eq(activityStatuses.isActive, true)
        )
      );

    const statusMap = new Map<number, string>(
      activityStatusResults.map((s) => [s.id, s.displayName])
    );

    const resultMap = new Map<number, string>();
    for (const activity of activityResults) {
      if (activity.activityStatusId) {
        const statusDisplayName = statusMap.get(activity.activityStatusId);
        if (statusDisplayName) {
          resultMap.set(activity.id, statusDisplayName);
        }
      }
    }
    return resultMap;
  }
  /**
   * Fetch comms materials for multiple activities
   */
  async fetchCommsMaterialsForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityCommsMaterials.activityId,
        commsMaterialName: commsMaterials.displayName,
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
  async fetchTranslationsRequiredForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityTranslationsRequired.activityId,
        shortcode: translatedLanguages.shortcode,
        displayName: translatedLanguages.displayName,
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
      const code = row.shortcode ?? row.displayName;
      if (code) existing.push(code);
      map.set(row.activityId, existing);
    }
    return map;
  }
  /**
   * Fetch representatives attending for multiple activities
   */
  async fetchRepresentativesAttendingForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityRepresentatives.activityId,
        representativeName: activityRepresentatives.representativeName,
      })
      .from(activityRepresentatives)
      .where(
        and(
          inArray(activityRepresentatives.activityId, activityIds),
          eq(activityRepresentatives.isActive, true)
        )
      );

    const map = new Map<number, string[]>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      if (row.representativeName) {
        existing.push(row.representativeName);
        map.set(row.activityId, existing);
      }
    }
    return map;
  }

  /**
   * Fetch shared with teams for multiple activities
   * Returns team display names for UI display
   */
  async fetchSharedWithTeamsForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activitySharedWithTeams.activityId,
        teamName: sql<string>`COALESCE(${teams.displayName}, ${teams.name})`.as(
          'teamName'
        ),
      })
      .from(activitySharedWithTeams)
      .innerJoin(teams, eq(activitySharedWithTeams.teamId, teams.id))
      .where(
        and(
          inArray(activitySharedWithTeams.activityId, activityIds),
          eq(activitySharedWithTeams.isActive, true),
          eq(teams.isActive, true)
        )
      );

    const map = new Map<number, string[]>();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push(row.teamName);
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Fetch comms contacts for multiple activities
   * Returns user info including userId, display name, and isLead flag
   */
  async fetchCommsContactsForActivities(activityIds: number[]): Promise<
    Map<
      number,
      Array<{
        userId: number;
        name: string;
        isLead: boolean;
      }>
    >
  > {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityCommsContacts.activityId,
        userId: activityCommsContacts.userId,
        userName:
          sql<string>`COALESCE(${users.adDisplayName}, ${users.adUsername}, 'User ' || ${users.id}::text)`.as(
            'userName'
          ),
        isLead: activityCommsContacts.isLead,
      })
      .from(activityCommsContacts)
      .innerJoin(users, eq(activityCommsContacts.userId, users.id))
      .where(
        and(
          inArray(activityCommsContacts.activityId, activityIds),
          eq(activityCommsContacts.isActive, true),
          eq(users.isActive, true)
        )
      );

    const map = new Map<
      number,
      Array<{
        userId: number;
        name: string;
        isLead: boolean;
      }>
    >();
    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push({
        userId: row.userId,
        name: row.userName,
        isLead: row.isLead,
      });
      map.set(row.activityId, existing);
    }
    return map;
  }

  /**
   * Fetch user names for multiple user IDs
   * Returns a map of userId -> user display name for UI display
   */
  async fetchUserNamesForUserIds(
    userIds: number[]
  ): Promise<Map<number, string>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        userId: users.id,
        userName:
          sql<string>`COALESCE(${users.adDisplayName}, ${users.adUsername}, 'User ' || ${users.id}::text)`.as(
            'userName'
          ),
      })
      .from(users)
      .where(and(inArray(users.id, userIds), eq(users.isActive, true)));

    return new Map(results.map((row) => [row.userId, row.userName]));
  }

  /**
   * Fetch organization names for leadOrg and eventLeadOrg
   * Returns maps of activityId -> organization name
   * Uses free text name if available, otherwise looks up from organizations table
   */
  async fetchLeadOrgNamesForActivities(
    activities: Activity[]
  ): Promise<Map<number, string | null>> {
    const map = new Map<number, string | null>();

    // Collect organization IDs that need to be looked up
    const orgIdsToLookup = new Set<number>();
    const activityIdToOrgId = new Map<number, number>();

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

    // Bulk lookup organization display: use ministry abbreviation when org links to ministry, else display name
    if (orgIdsToLookup.size > 0) {
      const results = await this.databaseService.db
        .select({
          orgId: organizations.id,
          orgName:
            sql<string>`COALESCE(${ministries.abbreviation}, ${organizations.displayName}, ${organizations.name})`.as(
              'orgName'
            ),
        })
        .from(organizations)
        .leftJoin(ministries, eq(organizations.ministryId, ministries.id))
        .where(
          and(
            inArray(organizations.id, Array.from(orgIdsToLookup)),
            eq(organizations.isActive, true)
          )
        );

      const orgIdToName = new Map<number, string>(
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
   * Fetch event planner details for multiple activities (id/name, display name, isLead).
   * Reads from activity_event_planners junction; resolves lookup ids via event_planners table.
   * Returns activityId -> Array<EventPlannerDetail>.
   */
  async fetchEventPlannerDetailsForActivities(
    activityIds: number[]
  ): Promise<Map<number, EventPlannerDetail[]>> {
    const map = new Map<number, EventPlannerDetail[]>();
    if (activityIds.length === 0) return map;

    const rows = await this.databaseService.db
      .select({
        activityId: activityEventPlanners.activityId,
        eventPlannerId: activityEventPlanners.eventPlannerId,
        eventPlannerName: activityEventPlanners.eventPlannerName,
        isLead: activityEventPlanners.isLead,
        displayName: eventPlanners.displayName,
        name: eventPlanners.name,
      })
      .from(activityEventPlanners)
      .leftJoin(
        eventPlanners,
        and(
          eq(activityEventPlanners.eventPlannerId, eventPlanners.id),
          eq(eventPlanners.isActive, true)
        )
      )
      .where(
        and(
          inArray(activityEventPlanners.activityId, activityIds),
          eq(activityEventPlanners.isActive, true)
        )
      );

    for (const row of rows) {
      const name =
        row.eventPlannerName?.trim() ||
        (row.eventPlannerId && (row.displayName || row.name)
          ? (row.displayName ?? row.name ?? '')
          : null);
      if (name) {
        const list = map.get(row.activityId) ?? [];
        list.push({
          eventPlannerId: row.eventPlannerId ?? undefined,
          eventPlannerName: row.eventPlannerName ?? undefined,
          name,
          isLead: row.isLead ?? false,
        });
        map.set(row.activityId, list);
      }
    }
    return map;
  }

  /**
   * Fetch event planner display names for multiple activities (derived from details).
   * Kept for backward compatibility; prefer building from fetchEventPlannerDetailsForActivities.
   */
  async fetchEventPlannersForActivities(
    activityIds: number[]
  ): Promise<Map<number, string[]>> {
    const detailsMap =
      await this.fetchEventPlannerDetailsForActivities(activityIds);
    const map = new Map<number, string[]>();
    for (const [activityId, details] of detailsMap) {
      map.set(
        activityId,
        details.map((d) => d.name)
      );
    }
    return map;
  }

  /**
   * Fetch event planner lookup IDs for multiple activities (for client-side filtering).
   * Returns activityId -> number[] (only planners that have eventPlannerId set).
   */
  async fetchEventPlannerIdsForActivities(
    activityIds: number[]
  ): Promise<Map<number, number[]>> {
    const map = new Map<number, number[]>();
    if (activityIds.length === 0) return map;
    const rows = await this.databaseService.db
      .select({
        activityId: activityEventPlanners.activityId,
        eventPlannerId: activityEventPlanners.eventPlannerId,
      })
      .from(activityEventPlanners)
      .where(
        and(
          inArray(activityEventPlanners.activityId, activityIds),
          eq(activityEventPlanners.isActive, true)
        )
      );
    for (const row of rows) {
      if (row.eventPlannerId != null) {
        const list = map.get(row.activityId) ?? [];
        list.push(row.eventPlannerId);
        map.set(row.activityId, list);
      }
    }
    return map;
  }

  /**
   * Fetch report settings for multiple activities
   * Returns all report settings with omitted flags for each activity
   */
  async fetchReportSettingsForActivities(activityIds: number[]): Promise<
    Map<
      number,
      Array<{
        id: number;
        name: string;
        displayName: string;
        omitted: boolean;
      }>
    >
  > {
    if (activityIds.length === 0) {
      return new Map();
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityReportSettings.activityId,
        reportId: reports.id,
        reportName: reports.name,
        reportDisplayName: reports.displayName,
        omitted: activityReportSettings.omitted,
      })
      .from(activityReportSettings)
      .innerJoin(reports, eq(activityReportSettings.reportId, reports.id))
      .where(
        and(
          inArray(activityReportSettings.activityId, activityIds),
          eq(reports.isActive, true)
        )
      )
      .orderBy(reports.sortOrder, reports.displayName);

    const map = new Map<
      number,
      Array<{
        id: number;
        name: string;
        displayName: string;
        omitted: boolean;
      }>
    >();

    for (const row of results) {
      const existing = map.get(row.activityId) ?? [];
      existing.push({
        id: row.reportId,
        name: row.reportName,
        displayName: row.reportDisplayName,
        omitted: row.omitted,
      });
      map.set(row.activityId, existing);
    }

    return map;
  }

  /**
   * Fetch pitch required status display names for multiple activities
   */
  async fetchPitchRequiredStatusForActivities(
    activityIds: number[]
  ): Promise<Map<number, string | null>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const activityResults = await this.databaseService.db
      .select({
        id: activities.id,
        pitchRequiredStatusId: activities.pitchRequiredStatusId,
      })
      .from(activities)
      .where(inArray(activities.id, activityIds));

    const statusIds = activityResults
      .map((a) => a.pitchRequiredStatusId)
      .filter((id): id is number => id !== null && id !== undefined);

    if (statusIds.length === 0) {
      const resultMap = new Map<number, string | null>();
      for (const activity of activityResults) {
        resultMap.set(activity.id, null);
      }
      return resultMap;
    }

    const statusResults = await this.databaseService.db
      .select({
        id: pitchRequiredStatuses.id,
        name: pitchRequiredStatuses.displayName,
      })
      .from(pitchRequiredStatuses)
      .where(
        and(
          inArray(pitchRequiredStatuses.id, statusIds),
          eq(pitchRequiredStatuses.isActive, true)
        )
      );

    const statusMap = new Map<number, string>(
      statusResults.map((s) => [s.id, s.name])
    );

    const resultMap = new Map<number, string | null>();
    for (const activity of activityResults) {
      if (activity.pitchRequiredStatusId) {
        resultMap.set(
          activity.id,
          statusMap.get(activity.pitchRequiredStatusId) ?? null
        );
      } else {
        resultMap.set(activity.id, null);
      }
    }
    return resultMap;
  }

  /**
   * Fetch translations required status display names for multiple activities
   */
  async fetchTranslationsRequiredStatusForActivities(
    activityIds: number[]
  ): Promise<Map<number, string | null>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const activityResults = await this.databaseService.db
      .select({
        id: activities.id,
        translationsRequiredStatusId: activities.translationsRequiredStatusId,
      })
      .from(activities)
      .where(inArray(activities.id, activityIds));

    const statusIds = activityResults
      .map((a) => a.translationsRequiredStatusId)
      .filter((id): id is number => id !== null && id !== undefined);

    if (statusIds.length === 0) {
      const resultMap = new Map<number, string | null>();
      for (const activity of activityResults) {
        resultMap.set(activity.id, null);
      }
      return resultMap;
    }

    const statusResults = await this.databaseService.db
      .select({
        id: translationRequiredStatuses.id,
        name: translationRequiredStatuses.displayName,
      })
      .from(translationRequiredStatuses)
      .where(
        and(
          inArray(translationRequiredStatuses.id, statusIds),
          eq(translationRequiredStatuses.isActive, true)
        )
      );

    const statusMap = new Map<number, string>(
      statusResults.map((s) => [s.id, s.name])
    );

    const resultMap = new Map<number, string | null>();
    for (const activity of activityResults) {
      if (activity.translationsRequiredStatusId) {
        resultMap.set(
          activity.id,
          statusMap.get(activity.translationsRequiredStatusId) ?? null
        );
      } else {
        resultMap.set(activity.id, null);
      }
    }
    return resultMap;
  }

  /**
   * Fetch lead ministry display names for multiple activities
   */
  async fetchLeadMinistryNamesForActivities(
    activityIds: number[]
  ): Promise<Map<number, string | null>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const activityResults = await this.databaseService.db
      .select({
        id: activities.id,
        leadMinistryId: activities.leadMinistryId,
      })
      .from(activities)
      .where(inArray(activities.id, activityIds));

    const ministryIds = activityResults
      .map((a) => a.leadMinistryId)
      .filter((id): id is number => id !== null && id !== undefined);

    if (ministryIds.length === 0) {
      const resultMap = new Map<number, string | null>();
      for (const activity of activityResults) {
        resultMap.set(activity.id, null);
      }
      return resultMap;
    }

    const ministryResults = await this.databaseService.db
      .select({
        id: ministries.id,
        displayName: ministries.displayName,
      })
      .from(ministries)
      .where(
        and(inArray(ministries.id, ministryIds), eq(ministries.isActive, true))
      );

    const ministryMap = new Map<number, string>(
      ministryResults.map((m) => [m.id, m.displayName])
    );

    const resultMap = new Map<number, string | null>();
    for (const activity of activityResults) {
      if (activity.leadMinistryId != null) {
        resultMap.set(
          activity.id,
          ministryMap.get(activity.leadMinistryId) ?? null
        );
      } else {
        resultMap.set(activity.id, null);
      }
    }
    return resultMap;
  }

  /**
   * Fetch lead ministry abbreviations (acronyms) for multiple activities
   */
  async fetchLeadMinistryAbbreviationsForActivities(
    activityIds: number[]
  ): Promise<Map<number, string | null>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const activityResults = await this.databaseService.db
      .select({
        id: activities.id,
        leadMinistryId: activities.leadMinistryId,
      })
      .from(activities)
      .where(inArray(activities.id, activityIds));

    const ministryIds = activityResults
      .map((a) => a.leadMinistryId)
      .filter((id): id is number => id !== null && id !== undefined);

    if (ministryIds.length === 0) {
      const resultMap = new Map<number, string | null>();
      for (const activity of activityResults) {
        resultMap.set(activity.id, null);
      }
      return resultMap;
    }

    const ministryResults = await this.databaseService.db
      .select({
        id: ministries.id,
        abbreviation: ministries.abbreviation,
      })
      .from(ministries)
      .where(
        and(inArray(ministries.id, ministryIds), eq(ministries.isActive, true))
      );

    const ministryMap = new Map<number, string>(
      ministryResults.map((m) => [m.id, m.abbreviation])
    );

    const resultMap = new Map<number, string | null>();
    for (const activity of activityResults) {
      if (activity.leadMinistryId != null) {
        resultMap.set(
          activity.id,
          ministryMap.get(activity.leadMinistryId) ?? null
        );
      } else {
        resultMap.set(activity.id, null);
      }
    }
    return resultMap;
  }

  /**
   * Human-readable lead team label per activity (for clients that cannot call lead-options).
   */
  async fetchLeadTeamDisplayForActivities(
    activityRows: Array<{ id: number; leadTeamId: number }>
  ): Promise<Map<number, string | null>> {
    const result = new Map<number, string | null>();
    if (activityRows.length === 0) {
      return result;
    }

    const teamIds = [...new Set(activityRows.map((a) => a.leadTeamId))];
    const teamRows = await this.databaseService.db
      .select({
        id: teams.id,
        name: teams.name,
        displayName: teams.displayName,
        ministryId: teams.ministryId,
      })
      .from(teams)
      .where(inArray(teams.id, teamIds));

    const ministryIds = [
      ...new Set(
        teamRows
          .map((t) => t.ministryId)
          .filter((id): id is number => id != null)
      ),
    ];
    const ministryNameRows =
      ministryIds.length > 0
        ? await this.databaseService.db
            .select({
              id: ministries.id,
              displayName: ministries.displayName,
            })
            .from(ministries)
            .where(inArray(ministries.id, ministryIds))
        : [];
    const ministryMap = new Map(
      ministryNameRows.map((m) => [m.id, m.displayName ?? ''])
    );

    const teamIdToLabel = new Map<number, string>();
    for (const t of teamRows) {
      const baseRaw = t.displayName?.trim() || t.name?.trim();
      const base =
        baseRaw != null && baseRaw.length > 0 ? baseRaw : `Team ${t.id}`;
      const ministryName =
        t.ministryId != null ? ministryMap.get(t.ministryId) : undefined;
      const label =
        ministryName != null && ministryName.length > 0
          ? `${base} (${ministryName})`
          : base;
      teamIdToLabel.set(t.id, label);
    }

    for (const a of activityRows) {
      result.set(a.id, teamIdToLabel.get(a.leadTeamId) ?? null);
    }
    return result;
  }
}
