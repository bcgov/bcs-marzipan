import { Injectable } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';

import {
  activities,
  activityCategories,
  activityCommsContacts,
  activityCommsMaterials,
  activityEventPlanners,
  activityOrganizations,
  activityRepresentatives,
  activitySharedWithTeams,
  activityStatuses,
  activityTags,
  activityTranslationsRequired,
  categories,
  commsMaterials,
  dateStatuses,
  newsReleaseDistributions,
  newsReleaseOrigins,
  organizations,
  premierRequested,
  tags,
  teams,
  timeStatuses,
  translatedLanguages,
  translationRequiredStatuses,
  users,
  venueAddresses,
  venueStatuses,
} from '@corpcal/database/schema';
import type {
  EventPlannerDetail,
  OrganizationDetail,
} from '@corpcal/shared/schemas';

import { DatabaseService } from '../../database/database.service';
import { sortByStaffName } from '../../users/staff-name-sort';

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
   * Fetch news release origins for multiple activities.
   * Resolves API `newsReleaseOrigin` from `news_release_origins.display_name` via a single
   * join (active rows only); avoids any drift between bulk activity fetch and lookup fetch.
   */
  async fetchNewsReleaseOriginsForActivities(
    activityIds: number[]
  ): Promise<Map<number, string | null>> {
    if (activityIds.length === 0) {
      return new Map();
    }

    const rows = await this.databaseService.db
      .select({
        activityId: activities.id,
        /** Prefer human label column; trimmed empty becomes null */
        resolvedLabel: sql<
          string | null
        >`NULLIF(TRIM(${newsReleaseOrigins.displayName}), '')`,
      })
      .from(activities)
      .leftJoin(
        newsReleaseOrigins,
        and(
          eq(activities.newsReleaseOriginId, newsReleaseOrigins.id),
          eq(newsReleaseOrigins.isActive, true)
        )
      )
      .where(inArray(activities.id, activityIds));

    const resultMap = new Map<number, string | null>();
    for (const row of rows) {
      const label = row.resolvedLabel?.trim();
      resultMap.set(row.activityId, label && label.length > 0 ? label : null);
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
   * Fetch venue statuses for multiple activities
   */
  async fetchVenueStatusesForActivities(
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
        name: venueStatuses.displayName,
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
        addressLine1: string | null;
        addressLine2: string | null;
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
        addressLine1: venueAddresses.addressLine1,
        addressLine2: venueAddresses.addressLine2,
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
        addressLine1: string | null;
        addressLine2: string | null;
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
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
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
      const label = row.shortcode?.trim() || row.displayName?.trim();
      if (label) existing.push(label);
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
   * Fetch shared with teams for multiple activities.
   * Returns display names for UI text and team IDs for membership checks
   * (e.g. deciding whether a user's team can unshare the activity).
   */
  async fetchSharedWithTeamsForActivities(activityIds: number[]): Promise<{
    namesMap: Map<number, string[]>;
    idsMap: Map<number, number[]>;
  }> {
    if (activityIds.length === 0) {
      return { namesMap: new Map(), idsMap: new Map() };
    }

    const results = await this.databaseService.db
      .select({
        activityId: activitySharedWithTeams.activityId,
        teamId: activitySharedWithTeams.teamId,
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

    const namesMap = new Map<number, string[]>();
    const idsMap = new Map<number, number[]>();
    for (const row of results) {
      const names = namesMap.get(row.activityId) ?? [];
      names.push(row.teamName);
      namesMap.set(row.activityId, names);

      const ids = idsMap.get(row.activityId) ?? [];
      ids.push(row.teamId);
      idsMap.set(row.activityId, ids);
    }
    return { namesMap, idsMap };
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

    for (const [activityId, contacts] of map.entries()) {
      map.set(
        activityId,
        sortByStaffName(
          contacts,
          (contact) => contact.name,
          (contact) => contact.userId
        )
      );
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
   * Fetch ministries/organizations junction rows for activities.
   */
  async fetchOrganizationDetailsForActivities(
    activityIds: number[]
  ): Promise<Map<number, OrganizationDetail[]>> {
    const map = new Map<number, OrganizationDetail[]>();
    if (activityIds.length === 0) return map;

    const rows = await this.databaseService.db
      .select({
        activityId: activityOrganizations.activityId,
        organizationId: activityOrganizations.organizationId,
        organizationName: activityOrganizations.organizationName,
        isLead: activityOrganizations.isLead,
        displayName: organizations.displayName,
        orgName: organizations.name,
        orgAbbreviation: organizations.abbreviation,
      })
      .from(activityOrganizations)
      .leftJoin(
        organizations,
        eq(activityOrganizations.organizationId, organizations.id)
      )
      .where(
        and(
          inArray(activityOrganizations.activityId, activityIds),
          eq(activityOrganizations.isActive, true)
        )
      );

    for (const row of rows) {
      const fromFreeform = row.organizationName?.trim() ?? '';
      const fromLookup =
        row.organizationId != null
          ? (row.orgAbbreviation ?? row.displayName ?? row.orgName ?? '').trim()
          : '';
      const name =
        fromFreeform ||
        fromLookup ||
        (row.organizationId != null
          ? `Organization #${row.organizationId}`
          : 'Unknown organization');
      const abbreviation = row.orgAbbreviation?.trim() || null;

      const list = map.get(row.activityId) ?? [];
      list.push({
        organizationId: row.organizationId ?? undefined,
        organizationName: row.organizationName ?? undefined,
        name,
        abbreviation,
        isLead: row.isLead ?? false,
      });
      map.set(row.activityId, list);
    }

    for (const [activityId, details] of map.entries()) {
      details.sort((a, b) => {
        if (a.isLead !== b.isLead) return a.isLead ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      map.set(activityId, details);
    }

    return map;
  }

  /**
   * Fetch event planner details for multiple activities (id/name, display name, isLead).
   * Reads from activity_event_planners; resolves event planner user ids via users.
   * Returns activityId -> Array<EventPlannerDetail>.
   */
  async fetchEventPlannerDetailsForActivities(
    activityIds: number[]
  ): Promise<Map<number, EventPlannerDetail[]>> {
    type EventPlannerDetailWithSortName = EventPlannerDetail & {
      sortName: string;
    };

    const map = new Map<number, EventPlannerDetailWithSortName[]>();
    if (activityIds.length === 0) return map;

    const rows = await this.databaseService.db
      .select({
        activityId: activityEventPlanners.activityId,
        eventPlannerId: activityEventPlanners.eventPlannerId,
        eventPlannerName: activityEventPlanners.eventPlannerName,
        isLead: activityEventPlanners.isLead,
        displayName: users.adDisplayName,
        name: sql<
          string | null
        >`coalesce(${users.adDisplayName}, ${users.adUsername}, ${users.adEmail})`,
      })
      .from(activityEventPlanners)
      .leftJoin(users, eq(activityEventPlanners.eventPlannerId, users.id))
      .where(
        and(
          inArray(activityEventPlanners.activityId, activityIds),
          eq(activityEventPlanners.isActive, true)
        )
      );

    for (const row of rows) {
      const fromFreeform = row.eventPlannerName?.trim() ?? '';
      const fromLookup =
        row.eventPlannerId != null && (row.displayName || row.name)
          ? (row.displayName ?? row.name ?? '').trim()
          : '';
      const name =
        fromFreeform ||
        fromLookup ||
        (row.eventPlannerId != null
          ? `Planner #${row.eventPlannerId}`
          : 'Unknown planner');
      const sortName =
        fromFreeform ||
        (row.eventPlannerId != null && row.name
          ? row.name.trim()
          : fromLookup) ||
        name;

      const list = map.get(row.activityId) ?? [];
      list.push({
        eventPlannerId: row.eventPlannerId ?? undefined,
        eventPlannerName: row.eventPlannerName ?? undefined,
        name,
        isLead: row.isLead ?? false,
        sortName,
      });
      map.set(row.activityId, list);
    }

    const sortedMap = new Map<number, EventPlannerDetail[]>();

    for (const [activityId, planners] of map.entries()) {
      sortedMap.set(
        activityId,
        sortByStaffName(
          planners,
          (planner) => planner.sortName,
          (planner) => planner.eventPlannerId ?? planner.name
        ).map(({ sortName: _sortName, ...planner }) => planner)
      );
    }

    return sortedMap;
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
    const resultMap = new Map<number, string | null>();
    if (activityIds.length === 0) return resultMap;

    const rows = await this.databaseService.db
      .select({
        activityId: activityOrganizations.activityId,
        displayName: organizations.displayName,
      })
      .from(activityOrganizations)
      .innerJoin(
        organizations,
        eq(organizations.id, activityOrganizations.organizationId)
      )
      .where(
        and(
          inArray(activityOrganizations.activityId, activityIds),
          eq(activityOrganizations.isLead, true),
          eq(activityOrganizations.isActive, true)
        )
      );

    for (const id of activityIds) {
      resultMap.set(id, null);
    }
    for (const row of rows) {
      resultMap.set(row.activityId, row.displayName);
    }
    return resultMap;
  }

  /**
   * Fetch lead ministry abbreviations (acronyms) for multiple activities
   */
  async fetchLeadMinistryAbbreviationsForActivities(
    activityIds: number[]
  ): Promise<Map<number, string | null>> {
    const resultMap = new Map<number, string | null>();
    if (activityIds.length === 0) return resultMap;

    const rows = await this.databaseService.db
      .select({
        activityId: activityOrganizations.activityId,
        abbreviation: organizations.abbreviation,
      })
      .from(activityOrganizations)
      .innerJoin(
        organizations,
        eq(organizations.id, activityOrganizations.organizationId)
      )
      .where(
        and(
          inArray(activityOrganizations.activityId, activityIds),
          eq(activityOrganizations.isLead, true),
          eq(activityOrganizations.isActive, true)
        )
      );

    for (const id of activityIds) {
      resultMap.set(id, null);
    }
    for (const row of rows) {
      resultMap.set(row.activityId, row.abbreviation);
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
        primaryOrganizationId: teams.primaryOrganizationId,
      })
      .from(teams)
      .where(inArray(teams.id, teamIds));

    const orgIds = [
      ...new Set(
        teamRows
          .map((t) => t.primaryOrganizationId)
          .filter((id): id is number => id != null)
      ),
    ];
    const orgNameRows =
      orgIds.length > 0
        ? await this.databaseService.db
            .select({
              id: organizations.id,
              displayName: organizations.displayName,
            })
            .from(organizations)
            .where(inArray(organizations.id, orgIds))
        : [];
    const orgMap = new Map(orgNameRows.map((m) => [m.id, m.displayName ?? '']));

    const teamIdToLabel = new Map<number, string>();
    for (const t of teamRows) {
      const baseRaw = t.displayName?.trim() || t.name?.trim();
      const base =
        baseRaw != null && baseRaw.length > 0 ? baseRaw : `Team ${t.id}`;
      const ministryName =
        t.primaryOrganizationId != null
          ? orgMap.get(t.primaryOrganizationId)
          : undefined;
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
