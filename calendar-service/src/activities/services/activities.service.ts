import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte, inArray, isNull, lte, ne, type SQL } from 'drizzle-orm';

import {
  activities,
  activityCategories,
  activityCommsContacts,
  activityCommsMaterials,
  activityHistory,
  activityReportSettings,
  activityRepresentatives,
  activitySectors,
  activitySharedWithTeams,
  activityStatuses,
  activitySubscriptions,
  activityTags,
  activityThemes,
  activityTranslationsRequired,
  categories,
  commsMaterials,
  dateStatuses,
  deletionAudit,
  favoriteActivities,
  ministries,
  pitchRequiredStatuses,
  teams,
  timeStatuses,
  translatedLanguages,
  translationRequiredStatuses,
  userTeams,
  venueAddresses,
} from '@corpcal/database/schema';
import type { Activity, Category } from '@corpcal/database/types';
import {
  buildEffectiveReviewExemptKeys,
  DEFAULT_CONFIGURABLE_REVIEW_EXEMPT_FIELD_KEYS,
  isManualCompleteEligible,
  normalizeActivityStatusLabel,
  PERMISSIONS,
  PITCH_TRANSLATION_PENDING_LOOKUP_NAME,
  REVIEW_SNAPSHOT_VERSION,
  SYSTEM_ROLES,
  type ActivityStatusName,
} from '@corpcal/shared';
import {
  CLONE_ADVANCED_FIELD_PATHS,
  CLONE_ALLOWED_INCLUDE_PATHS,
  CLONE_MODAL_SCHEDULE_FIELD_KEYS,
  CLONE_NEVER_COPIED_FIELD_KEYS,
  CLONE_SYSTEM_FIELD_KEYS,
  type ActivityFormData,
  type ActivityHistoryEntry,
  type ActivityResponse,
  type CloneActivityRequest,
  type CreateActivityRequest,
  type FilterActivitiesQueryParams,
  type GlobalActivityHistoryEntry,
  type HistoryChange,
  type UpdateActivityRequest,
  type VenueAddressBase,
} from '@corpcal/shared/schemas';
import {
  applyFieldLevelWritePolicy,
  applyUpdateActivityRequestToFormData,
  buildReviewDiffLookups,
  buildReviewSnapshot,
  diffReviewFields,
  getEmptyReviewBaseline,
  isDeepEqual,
  mapResponseToFormData,
  normalizeVenueAddressForForm,
  plainTextFromActivityRichField,
  tipTapDocJsonFromPlainText,
  type MapResponseToFormDataLookups,
} from '@corpcal/shared/utils';

import type { DrizzleDbExecutor } from '../../database/database.provider';
import { DatabaseService } from '../../database/database.service';
import { ApplicationSettingsService } from '../../locks/application-settings.service';
import { LocksService } from '../../locks/locks.service';
import { LookAheadPolicyService } from '../../look-ahead/look-ahead-policy.service';
import { getVisibleCategoryIds } from '../../policy/category-scoping.helper';
import type { RequestContext as RequestContextType } from '../../policy/dto/user-context.dto';
import { PolicyService } from '../../policy/policy.service';
import { getVisibleTagIds } from '../../policy/tag-scoping.helper';
import { TeamsService } from '../../teams/teams.service';
import { ActivitiesGateway } from '../activities.gateway';
import { ActivityDataFetcherService } from './activity-data-fetcher.service';
import { ActivityHistoryService } from './activity-history.service';
import { ActivityJunctionService } from './activity-junction.service';
import { ActivityMapperService } from './activity-mapper.service';
import { ActivityUtilsService } from './activity-utils.service';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly activitiesGateway: ActivitiesGateway,
    private readonly activityHistoryService: ActivityHistoryService,
    private readonly junctionService: ActivityJunctionService,
    private readonly dataFetcherService: ActivityDataFetcherService,
    private readonly mapperService: ActivityMapperService,
    private readonly utilsService: ActivityUtilsService,
    private readonly locksService: LocksService,
    private readonly applicationSettings: ApplicationSettingsService,
    private readonly policyService: PolicyService,
    private readonly teamsService: TeamsService,
    private readonly lookAheadPolicy: LookAheadPolicyService
  ) {}

  private async getEffectiveReviewExemptFieldKeys(
    executor?: DrizzleDbExecutor
  ): Promise<ReadonlySet<string>> {
    const fromDb =
      await this.applicationSettings.getReviewExemptFieldKeys(executor);
    return buildEffectiveReviewExemptKeys(fromDb);
  }

  /**
   * Normalize venue address data by trimming whitespace and converting empty strings to null.
   * This prevents false change detection due to whitespace differences.
   *
   * @param venue - Venue address data to normalize
   * @returns Normalized venue address with trimmed strings and empty strings as null
   */
  private normalizeVenueAddress(
    venue: VenueAddressBase | null | undefined
  ): VenueAddressBase | null {
    if (!venue) {
      return null;
    }

    return {
      venueName:
        typeof venue.venueName === 'string'
          ? venue.venueName.trim() || null
          : (venue.venueName ?? null),
      addressLine1:
        typeof venue.addressLine1 === 'string'
          ? venue.addressLine1.trim() || null
          : (venue.addressLine1 ?? null),
      addressLine2:
        typeof venue.addressLine2 === 'string'
          ? venue.addressLine2.trim() || null
          : (venue.addressLine2 ?? null),
      city:
        typeof venue.city === 'string'
          ? venue.city.trim() || null
          : (venue.city ?? null),
      provinceOrState:
        typeof venue.provinceOrState === 'string'
          ? venue.provinceOrState.trim() || null
          : (venue.provinceOrState ?? null),
      country:
        typeof venue.country === 'string'
          ? venue.country.trim() || null
          : (venue.country ?? null),
    };
  }

  /**
   * Validates that all submitted tag IDs are within the set of tags visible
   * to the user's teams (global tags + team-scoped tags for those teams).
   * Users with ACTIVITIES.CREATE_ANY bypass this check — they act on behalf
   * of any team and may legitimately use any tag.
   */
  private async validateTagIds(
    tagIds: number[],
    teamIds: number[] | undefined,
    permissions: string[] | undefined
  ): Promise<void> {
    if (!tagIds.length) return;
    const canUseAny =
      permissions?.includes(PERMISSIONS.ACTIVITIES.CREATE_ANY) ?? false;
    if (canUseAny) return;

    const visibleIds = await getVisibleTagIds(this.databaseService.db, teamIds);
    const visibleSet = new Set(visibleIds);
    const forbidden = tagIds.filter((id) => !visibleSet.has(id));
    if (forbidden.length > 0) {
      throw new BadRequestException(
        `Tag IDs not available to your teams: ${forbidden.join(', ')}`
      );
    }
  }

  /**
   * Load all active lookup rows needed to resolve response display-name arrays
   * (categories, comms materials, translation languages, teams) to form-data
   * ID arrays. Uses unscoped queries so review diffs resolve correctly even
   * when the reviewer's team scoping would hide a category in the picker.
   */
  private async getReviewDiffLookups(): Promise<MapResponseToFormDataLookups> {
    const [categoryRows, commsMaterialRows, translationLanguageRows, teamRows] =
      await Promise.all([
        this.databaseService.db
          .select({
            id: categories.id,
            name: categories.name,
            displayName: categories.displayName,
          })
          .from(categories)
          .where(eq(categories.isActive, true)),
        this.databaseService.db
          .select({
            id: commsMaterials.id,
            name: commsMaterials.name,
            displayName: commsMaterials.displayName,
          })
          .from(commsMaterials)
          .where(eq(commsMaterials.isActive, true)),
        this.databaseService.db
          .select({
            id: translatedLanguages.id,
            name: translatedLanguages.name,
            displayName: translatedLanguages.displayName,
            shortcode: translatedLanguages.shortcode,
          })
          .from(translatedLanguages)
          .where(eq(translatedLanguages.isActive, true)),
        this.databaseService.db
          .select({
            id: teams.id,
            name: teams.name,
            displayName: teams.displayName,
          })
          .from(teams)
          .where(eq(teams.isActive, true)),
      ]);
    return buildReviewDiffLookups({
      categories: categoryRows,
      commsMaterials: commsMaterialRows,
      translationLanguages: translationLanguageRows,
      sharedWithTeams: teamRows,
    });
  }

  /**
   * Build the canonical review snapshot from a fully-hydrated ActivityResponse.
   * Maps the response back to form-data shape (ID-based), then canonicalizes
   * so comparison uses the same normalisation as dirty-field detection.
   */
  private buildSnapshotFromResponse(
    response: ActivityResponse,
    lookups?: MapResponseToFormDataLookups
  ): unknown {
    const formData = mapResponseToFormData(response, lookups);
    return buildReviewSnapshot(formData);
  }

  /**
   * Persist the review snapshot for an activity.
   * Called inside a transaction when status transitions to 'reviewed'.
   */
  private async persistReviewSnapshot(
    db: DrizzleDbExecutor,
    activityId: number,
    response: ActivityResponse,
    lookups?: MapResponseToFormDataLookups
  ): Promise<void> {
    const snapshot = this.buildSnapshotFromResponse(response, lookups);
    await db
      .update(activities)
      .set({
        reviewedFieldSnapshot: snapshot,
        reviewedFieldSnapshotVersion: REVIEW_SNAPSHOT_VERSION,
      })
      .where(eq(activities.id, activityId));
  }

  /**
   * Clear the review snapshot (e.g. on soft delete).
   */
  private async clearReviewSnapshot(
    db: DrizzleDbExecutor,
    activityId: number
  ): Promise<void> {
    await db
      .update(activities)
      .set({
        reviewedFieldSnapshot: null,
        reviewedFieldSnapshotVersion: REVIEW_SNAPSHOT_VERSION,
      })
      .where(eq(activities.id, activityId));
  }

  /**
   * Compute changedFieldsSinceReview from the stored snapshot vs current response.
   * Returns undefined when snapshot version mismatches; [] when status is New (not yet reviewed);
   * otherwise the diff paths vs last Reviewed snapshot (empty baseline when snapshot is null).
   */
  computeChangedFieldsSinceReview(
    response: ActivityResponse,
    snapshot: unknown,
    snapshotVersion: number,
    lookups?: MapResponseToFormDataLookups,
    exemptFieldKeys: ReadonlySet<string> = buildEffectiveReviewExemptKeys(
      DEFAULT_CONFIGURABLE_REVIEW_EXEMPT_FIELD_KEYS
    )
  ): string[] | undefined {
    if (snapshotVersion !== REVIEW_SNAPSHOT_VERSION) {
      return undefined;
    }
    if (normalizeActivityStatusLabel(response.activityStatus) === 'new') {
      return [];
    }
    const currentFormData = mapResponseToFormData(response, lookups);
    const baseline = snapshot
      ? (snapshot as ReturnType<typeof buildReviewSnapshot>)
      : getEmptyReviewBaseline();
    return diffReviewFields(currentFormData, baseline, { exemptFieldKeys });
  }

  /**
   * Decide whether an update to a currently-Reviewed activity should keep the
   * status as Reviewed rather than transitioning it to Changed.
   *
   * Builds the "before" form representation from the current persisted row,
   * merges the partial DTO on top to get the "after" shape, and runs the
   * review-diff comparison. Code- and admin-configured review-exempt top-level
   * fields are ignored by {@link diffReviewFields}, so updates that touch only
   * those fields preserve Reviewed.
   */
  private async shouldPreserveReviewedStatus(
    activityId: number,
    oldActivity: Activity,
    dto: UpdateActivityRequest
  ): Promise<boolean> {
    const [lookups, exemptFieldKeys] = await Promise.all([
      this.getReviewDiffLookups(),
      this.getEffectiveReviewExemptFieldKeys(),
    ]);
    const related = await this.fetchRelatedForActivityIds(
      [activityId],
      [oldActivity]
    );
    const beforeResponse = this.mapFetchedActivityToResponseDto(
      oldActivity,
      related
    );
    const beforeForm = mapResponseToFormData(beforeResponse, lookups);
    const afterForm = applyUpdateActivityRequestToFormData(beforeForm, dto);
    return (
      diffReviewFields(afterForm, beforeForm, { exemptFieldKeys }).length === 0
    );
  }

  /**
   * One-time deploy backfill: set `reviewed_field_snapshot` to the canonical
   * current form state for **Reviewed** activities that still have a NULL
   * snapshot (e.g. after shipping the review-diff feature).
   */
  async backfillReviewedFieldSnapshotsWhereNull(): Promise<number> {
    const reviewedId = await this.getActivityStatusIdByName('reviewed');
    const targets = await this.databaseService.db
      .select({ id: activities.id })
      .from(activities)
      .where(
        and(
          eq(activities.activityStatusId, reviewedId),
          isNull(activities.reviewedFieldSnapshot)
        )
      );

    const lookups = await this.getReviewDiffLookups();
    let updated = 0;
    for (const { id } of targets) {
      const [row] = await this.databaseService.db
        .select()
        .from(activities)
        .where(eq(activities.id, id))
        .limit(1);
      if (!row) continue;
      const related = await this.fetchRelatedForActivityIds([id], [row]);
      const response = this.mapFetchedActivityToResponseDto(row, related);
      const snapshot = this.buildSnapshotFromResponse(response, lookups);
      await this.databaseService.db
        .update(activities)
        .set({
          reviewedFieldSnapshot: snapshot,
          reviewedFieldSnapshotVersion: REVIEW_SNAPSHOT_VERSION,
        })
        .where(eq(activities.id, id));
      updated++;
    }
    return updated;
  }

  /**
   * Recompute `reviewed_field_snapshot` for all **Reviewed** activities
   * that already have a non-null snapshot. Used after changing the name-to-ID
   * lookup resolution so existing baselines align with the new mapping.
   */
  async recomputeAllReviewedSnapshots(): Promise<number> {
    const reviewedId = await this.getActivityStatusIdByName('reviewed');
    const targets = await this.databaseService.db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.activityStatusId, reviewedId));

    const lookups = await this.getReviewDiffLookups();
    let updated = 0;
    for (const { id } of targets) {
      const [row] = await this.databaseService.db
        .select()
        .from(activities)
        .where(eq(activities.id, id))
        .limit(1);
      if (!row) continue;
      const related = await this.fetchRelatedForActivityIds([id], [row]);
      const response = this.mapFetchedActivityToResponseDto(row, related);
      const snapshot = this.buildSnapshotFromResponse(response, lookups);
      await this.databaseService.db
        .update(activities)
        .set({
          reviewedFieldSnapshot: snapshot,
          reviewedFieldSnapshotVersion: REVIEW_SNAPSHOT_VERSION,
        })
        .where(eq(activities.id, id));
      updated++;
    }
    return updated;
  }

  /**
   * Mock / local DB: for **Changed** activities, persist a synthetic
   * prior-reviewed snapshot so `changedFieldsSinceReview` is non-empty for
   * reviewers (deterministic 1–6 field deltas, weighted toward summary,
   * schedule, and venue).
   */
  async seedMockReviewSnapshotsForChangedActivities(): Promise<number> {
    const changedId = await this.getActivityStatusIdByName('changed');
    const targets = await this.databaseService.db
      .select()
      .from(activities)
      .where(eq(activities.activityStatusId, changedId));

    const [lookups, reviewExemptFieldKeys] = await Promise.all([
      this.getReviewDiffLookups(),
      this.getEffectiveReviewExemptFieldKeys(),
    ]);
    let updated = 0;
    for (const row of targets) {
      const related = await this.fetchRelatedForActivityIds([row.id], [row]);
      const response = this.mapFetchedActivityToResponseDto(row, related);
      const currentForm = mapResponseToFormData(response, lookups);
      const priorForm = this.buildMockPriorReviewForm(
        currentForm,
        row.id,
        reviewExemptFieldKeys
      );
      const snapshot = buildReviewSnapshot(priorForm);
      const diff = diffReviewFields(currentForm, snapshot, {
        exemptFieldKeys: reviewExemptFieldKeys,
      });
      if (diff.length === 0) {
        continue;
      }
      await this.databaseService.db
        .update(activities)
        .set({
          reviewedFieldSnapshot: snapshot,
          reviewedFieldSnapshotVersion: REVIEW_SNAPSHOT_VERSION,
        })
        .where(eq(activities.id, row.id));
      updated++;
    }
    return updated;
  }

  private shiftIsoDateString(
    isoDate: string | undefined,
    deltaDays: number
  ): string | undefined {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      return undefined;
    }
    const d = new Date(`${isoDate}T12:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + deltaDays);
    return d.toISOString().slice(0, 10);
  }

  private tweakClockTime(
    clock: string | undefined,
    deltaMinutes: number
  ): string | undefined {
    if (!clock || !/^\d{2}:\d{2}$/.test(clock)) {
      return undefined;
    }
    const [h, m] = clock.split(':').map((x) => parseInt(x, 10));
    let total = h * 60 + m + deltaMinutes;
    total = ((total % 1440) + 1440) % 1440;
    const nh = Math.floor(total / 60);
    const nm = total % 60;
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
  }

  /**
   * Builds a fake "last reviewed" form state that differs from `current` in
   * 1–6 fields (deterministic per activity id).
   */
  private buildMockPriorReviewForm(
    current: ActivityFormData,
    activityId: number,
    exemptFieldKeys: ReadonlySet<string>
  ): ActivityFormData {
    const prior = structuredClone(current);
    const targetCount = 1 + (activityId % 6);
    const pool = [
      'summary',
      'summary',
      'summary',
      'startDate',
      'startDate',
      'endDate',
      'startTime',
      'endTime',
      'venueAddress.venueName',
      'venueAddress.city',
      'venueAddress.addressLine1',
      'venueAddress.addressLine2',
      'title',
    ] as const;

    const selected = new Set<string>();
    let h = activityId * 0x9e3779b9;
    while (selected.size < targetCount) {
      h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
      h ^= h >>> 15;
      selected.add(pool[Math.abs(h) % pool.length]);
    }

    for (const key of selected) {
      if (key.startsWith('venueAddress.')) {
        const sub = key.slice('venueAddress.'.length) as
          | 'venueName'
          | 'addressLine1'
          | 'addressLine2'
          | 'city'
          | 'provinceOrState'
          | 'country';
        prior.venueAddress =
          prior.venueAddress ?? normalizeVenueAddressForForm(null);
        const curVal = prior.venueAddress[sub];
        const base =
          curVal != null && String(curVal).trim() !== ''
            ? String(curVal).trim()
            : 'Venue (prior)';
        (prior.venueAddress as Record<string, string | null>)[sub] =
          base.includes('(prior review)') ? base : `${base} (prior review)`;
        continue;
      }
      if (key === 'summary') {
        const plain = plainTextFromActivityRichField(current.summary);
        const shortened =
          plain.length > 48
            ? plain.slice(0, plain.length - 24).trimEnd()
            : `[Prior reviewed text] ${plain}`;
        prior.summary = tipTapDocJsonFromPlainText(shortened);
        continue;
      }
      if (key === 'title') {
        const t = current.title;
        prior.title = t.endsWith('(prior title)')
          ? t
          : `${t.slice(0, Math.min(120, t.length))} (prior title)`;
        continue;
      }
      if (key === 'startDate') {
        const next = this.shiftIsoDateString(
          current.startDate ?? undefined,
          -7
        );
        if (next) prior.startDate = next;
        continue;
      }
      if (key === 'endDate') {
        const next = this.shiftIsoDateString(current.endDate ?? undefined, -4);
        if (next) prior.endDate = next;
        continue;
      }
      if (key === 'startTime') {
        const next = this.tweakClockTime(current.startTime ?? undefined, -45);
        if (next) prior.startTime = next;
        continue;
      }
      if (key === 'endTime') {
        const next = this.tweakClockTime(current.endTime ?? undefined, -30);
        if (next) prior.endTime = next;
        continue;
      }
    }

    const snap = buildReviewSnapshot(prior);
    const diff = diffReviewFields(current, snap, { exemptFieldKeys });
    if (diff.length === 0) {
      const t = current.title;
      prior.title = t.endsWith('(prior title)')
        ? t
        : `${t.slice(0, Math.min(120, t.length))} (prior title)`;
    }

    return prior;
  }

  /**
   * Map a row plus bulk-fetched relations to an {@link ActivityResponse}
   * (no permission-derived flags except optional `canEdit`).
   */
  private mapFetchedActivityToResponseDto(
    activity: Activity,
    related: Awaited<
      ReturnType<ActivitiesService['fetchRelatedForActivityIds']>
    >,
    opts?: { canEdit?: boolean }
  ): ActivityResponse {
    const id = activity.id;
    const { namesMap: categoriesList, idsMap: categoryIdsList } =
      related.categoriesResult;
    const commsContacts = related.commsContactsMap.get(id) ?? [];
    return this.mapperService.mapToResponseDto(activity, {
      categories: categoriesList.get(id) ?? [],
      categoryIds: categoryIdsList.get(id) ?? [],
      tags: related.tagsMap.get(id) ?? [],
      activityStatus: related.activityStatusesMap.get(id),
      dateStatus: related.dateStatusesMap.get(id),
      timeStatus: related.timeStatusesMap.get(id),
      venueStatus: related.venueStatusesMap.get(id),
      venueAddress: related.venueAddressesMap.get(id) ?? null,
      commsMaterials: related.commsMaterialsMap.get(id) ?? [],
      translationsRequired: related.translationsRequiredMap.get(id) ?? [],
      representativesAttending:
        related.representativesAttendingMap.get(id) ?? [],
      sharedWith: related.sharedWithMap.get(id) ?? [],
      commsContacts,
      eventPlannerDetails: related.eventPlannerDetailsMap.get(id) ?? [],
      eventPlanners: related.eventPlannersMap.get(id) ?? [],
      eventPlannerLeadIds: related.eventPlannerIdsMap.get(id) ?? [],
      leadOrgName: related.leadOrgNamesMap.get(id) ?? null,
      newsReleaseOrigin: related.newsReleaseOriginsMap.get(id) ?? null,
      newsReleaseDistribution:
        related.newsReleaseDistributionsMap.get(id) ?? null,
      premierRequested: related.premierRequestedMap.get(id) ?? null,
      reportSettings: related.reportSettingsMap.get(id) ?? [],
      pitchRequiredStatus: related.pitchRequiredStatusMap.get(id) ?? null,
      translationsRequiredStatus:
        related.translationsRequiredStatusMap.get(id) ?? null,
      leadMinistry: related.leadMinistryNamesMap.get(id) ?? null,
      leadMinistryAbbreviation:
        related.leadMinistryAbbreviationsMap.get(id) ?? null,
      leadTeamDisplayName: related.leadTeamDisplayMap.get(id) ?? null,
      ...(opts?.canEdit !== undefined ? { canEdit: opts.canEdit } : {}),
    });
  }

  /**
   * Validate that every comms contact userId is an active member of the lead
   * team and has a role that grants activities.edit.
   */
  private async validateCommsContactsForTeam(
    commsContacts: Array<{ userId: number; isLead: boolean }> | undefined,
    leadTeamId: number
  ): Promise<void> {
    if (!commsContacts || commsContacts.length === 0) return;
    const eligible =
      await this.teamsService.getEligibleCommsUserIds(leadTeamId);
    const invalid = commsContacts.filter((c) => !eligible.has(c.userId));
    if (invalid.length > 0) {
      const ids = invalid.map((c) => c.userId).join(', ');
      throw new BadRequestException(
        `Comms contact(s) [${ids}] are not eligible for lead team ${leadTeamId}. ` +
          'Contacts must be active members of the lead team with activities.edit permission.'
      );
    }
  }

  /**
   * Fetch all related data (categories, tags, statuses, etc.) for the given activity IDs.
   * Used by mapToResponseDto (bulk), findOne, update, requestDelete, and restore.
   */
  private async fetchRelatedForActivityIds(
    activityIds: number[],
    activityRows: Activity[]
  ) {
    const [
      categoriesResult,
      tagsMap,
      activityStatusesMap,
      dateStatusesMap,
      timeStatusesMap,
      venueStatusesMap,
      venueAddressesMap,
      commsMaterialsMap,
      translationsRequiredMap,
      representativesAttendingMap,
      sharedWithMap,
      commsContactsMap,
      leadOrgNamesMap,
      eventPlannerDetailsMap,
      newsReleaseOriginsMap,
      newsReleaseDistributionsMap,
      premierRequestedMap,
      reportSettingsMap,
      pitchRequiredStatusMap,
      translationsRequiredStatusMap,
      leadMinistryNamesMap,
      leadMinistryAbbreviationsMap,
      leadTeamDisplayMap,
    ] = await Promise.all([
      this.dataFetcherService.fetchCategoriesForActivities(activityIds),
      this.dataFetcherService.fetchTagsForActivities(activityIds),
      this.dataFetcherService.fetchActivityStatusesForActivities(activityIds),
      this.dataFetcherService.fetchDateStatusesForActivities(activityIds),
      this.dataFetcherService.fetchTimeStatusesForActivities(activityIds),
      this.dataFetcherService.fetchVenueStatusesForActivities(activityIds),
      this.dataFetcherService.fetchVenueAddressesForActivities(activityIds),
      this.dataFetcherService.fetchCommsMaterialsForActivities(activityIds),
      this.dataFetcherService.fetchTranslationsRequiredForActivities(
        activityIds
      ),
      this.dataFetcherService.fetchRepresentativesAttendingForActivities(
        activityIds
      ),
      this.dataFetcherService.fetchSharedWithTeamsForActivities(activityIds),
      this.dataFetcherService.fetchCommsContactsForActivities(activityIds),
      this.dataFetcherService.fetchLeadOrgNamesForActivities(activityRows),
      this.dataFetcherService.fetchEventPlannerDetailsForActivities(
        activityIds
      ),
      this.dataFetcherService.fetchNewsReleaseOriginsForActivities(activityIds),
      this.dataFetcherService.fetchNewsReleaseDistributionsForActivities(
        activityIds
      ),
      this.dataFetcherService.fetchPremierRequestedForActivities(activityIds),
      this.dataFetcherService.fetchReportSettingsForActivities(activityIds),
      this.dataFetcherService.fetchPitchRequiredStatusForActivities(
        activityIds
      ),
      this.dataFetcherService.fetchTranslationsRequiredStatusForActivities(
        activityIds
      ),
      this.dataFetcherService.fetchLeadMinistryNamesForActivities(activityIds),
      this.dataFetcherService.fetchLeadMinistryAbbreviationsForActivities(
        activityIds
      ),
      this.dataFetcherService.fetchLeadTeamDisplayForActivities(
        activityRows.map((a) => ({ id: a.id, leadTeamId: a.leadTeamId }))
      ),
    ]);
    // Derive eventPlannersMap and eventPlannerIdsMap from details for backward compatibility
    const eventPlannersMap = new Map<number, string[]>();
    const eventPlannerIdsMap = new Map<number, number[]>();
    for (const [activityId, details] of eventPlannerDetailsMap) {
      eventPlannersMap.set(
        activityId,
        details.map((d) => d.name)
      );
      eventPlannerIdsMap.set(
        activityId,
        details
          .filter((d) => d.eventPlannerId != null)
          .map((d) => d.eventPlannerId as number)
      );
    }
    return {
      categoriesResult,
      tagsMap,
      activityStatusesMap,
      dateStatusesMap,
      timeStatusesMap,
      venueStatusesMap,
      venueAddressesMap,
      commsMaterialsMap,
      translationsRequiredMap,
      representativesAttendingMap,
      sharedWithMap,
      commsContactsMap,
      leadOrgNamesMap,
      eventPlannerDetailsMap,
      eventPlannersMap,
      eventPlannerIdsMap,
      newsReleaseOriginsMap,
      newsReleaseDistributionsMap,
      premierRequestedMap,
      reportSettingsMap,
      pitchRequiredStatusMap,
      translationsRequiredStatusMap,
      leadMinistryNamesMap,
      leadMinistryAbbreviationsMap,
      leadTeamDisplayMap,
    };
  }

  /**
   * Normalize representatives array by filtering valid entries and sorting consistently.
   * For comparison purposes, we normalize based on the unique identifier:
   * - If representativeId is present, we use that (ignore representativeName for lookup entries)
   * - If only representativeName is present, we use that (freeform entry)
   * This prevents false change detection from representativeName lookups.
   *
   * @param reps - Array of representatives to normalize
   * @returns Normalized array with sorted, canonical representatives for comparison
   */
  private normalizeRepresentatives(
    reps:
      | Array<{
          representativeId?: number | null;
          representativeName?: string | null;
        }>
      | undefined
  ): Array<{
    representativeId: number | null;
    representativeName: string | null;
  }> | null {
    if (!reps || !Array.isArray(reps) || reps.length === 0) {
      return null;
    }

    // Filter to only valid entries (must have at least one identifier)
    const validReps = reps
      .filter(
        (r) =>
          (typeof r.representativeId === 'number' && r.representativeId > 0) ||
          (typeof r.representativeName === 'string' &&
            r.representativeName.trim().length > 0)
      )
      .map((r) => {
        const repId =
          typeof r.representativeId === 'number' && r.representativeId > 0
            ? r.representativeId
            : null;
        const repName =
          typeof r.representativeName === 'string'
            ? r.representativeName.trim() || null
            : null;

        // For comparison: if we have a representativeId (lookup table entry),
        // set representativeName to null so that looked-up names don't cause false change detection.
        // Only keep representativeName for freeform entries (where representativeId is null).
        return {
          representativeId: repId,
          representativeName: repId ? null : repName,
        };
      });

    if (validReps.length === 0) {
      return null;
    }

    // Sort for consistent comparison: by representativeId first, then by name
    validReps.sort((a, b) => {
      if (a.representativeId && b.representativeId) {
        return a.representativeId - b.representativeId;
      }
      if (a.representativeId) return -1;
      if (b.representativeId) return 1;
      return (a.representativeName || '').localeCompare(
        b.representativeName || ''
      );
    });

    return validReps;
  }

  /**
   * Resolve activity status ID by status name (e.g. 'new', 'reviewed', 'changed').
   */
  private async getActivityStatusIdByName(
    name: ActivityStatusName
  ): Promise<number> {
    const [row] = await this.databaseService.db
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(eq(activityStatuses.name, name))
      .limit(1);
    if (!row) {
      throw new BadRequestException(
        `Activity status '${name}' not found in database`
      );
    }
    return row.id;
  }

  /**
   * Resolve activity status name by ID (for checking delete_requested/deleted).
   */
  private async getActivityStatusNameById(id: number): Promise<string | null> {
    const [row] = await this.databaseService.db
      .select({ name: activityStatuses.name })
      .from(activityStatuses)
      .where(eq(activityStatuses.id, id))
      .limit(1);
    return row?.name ?? null;
  }

  private async getDateStatusNameById(id: number): Promise<string> {
    const [row] = await this.databaseService.db
      .select({ name: dateStatuses.name })
      .from(dateStatuses)
      .where(eq(dateStatuses.id, id))
      .limit(1);
    return row?.name ?? 'unknown';
  }

  private async getTimeStatusNameById(id: number): Promise<string> {
    const [row] = await this.databaseService.db
      .select({ name: timeStatuses.name })
      .from(timeStatuses)
      .where(eq(timeStatuses.id, id))
      .limit(1);
    return row?.name ?? 'unknown';
  }

  /**
   * Resolve DB IDs for tri-state "pending" row (display "Pending review") used as create defaults.
   */
  private async resolvePendingPitchAndTranslationStatusIds(): Promise<{
    pitchRequiredStatusId: number;
    translationsRequiredStatusId: number;
  }> {
    const [pitchRow] = await this.databaseService.db
      .select({ id: pitchRequiredStatuses.id })
      .from(pitchRequiredStatuses)
      .where(
        eq(pitchRequiredStatuses.name, PITCH_TRANSLATION_PENDING_LOOKUP_NAME)
      )
      .limit(1);
    const [translationRow] = await this.databaseService.db
      .select({ id: translationRequiredStatuses.id })
      .from(translationRequiredStatuses)
      .where(
        eq(
          translationRequiredStatuses.name,
          PITCH_TRANSLATION_PENDING_LOOKUP_NAME
        )
      )
      .limit(1);
    if (pitchRow?.id == null) {
      throw new InternalServerErrorException(
        'Pitch required status "pending" is not configured in lookups.'
      );
    }
    if (translationRow?.id == null) {
      throw new InternalServerErrorException(
        'Translation required status "pending" is not configured in lookups.'
      );
    }
    return {
      pitchRequiredStatusId: pitchRow.id,
      translationsRequiredStatusId: translationRow.id,
    };
  }

  /**
   * Resolve the first (lowest sort_order) date and time status IDs for use as
   * server-side defaults when the create request omits them.
   */
  private async resolveDefaultDateTimeStatusIds(): Promise<{
    dateStatusId: number;
    timeStatusId: number;
  }> {
    const [dateRow] = await this.databaseService.db
      .select({ id: dateStatuses.id })
      .from(dateStatuses)
      .orderBy(dateStatuses.sortOrder)
      .limit(1);
    const [timeRow] = await this.databaseService.db
      .select({ id: timeStatuses.id })
      .from(timeStatuses)
      .orderBy(timeStatuses.sortOrder)
      .limit(1);
    if (dateRow?.id == null) {
      throw new InternalServerErrorException(
        'No date statuses configured in lookups.'
      );
    }
    if (timeRow?.id == null) {
      throw new InternalServerErrorException(
        'No time statuses configured in lookups.'
      );
    }
    return {
      dateStatusId: dateRow.id,
      timeStatusId: timeRow.id,
    };
  }

  /**
   * Create a new activity with related junction table records.
   * Initial activityStatusId is set by backend: 'reviewed' if user has activities.review and markAsReviewed, else 'new'.
   * Client activityStatusId is ignored.
   * When context.permissions does not include activities.create.any, leadMinistryId must be in a ministry linked to context.teamIds.
   */
  async create(
    dto: CreateActivityRequest,
    userId: number,
    context?: {
      roleName?: string;
      permissions?: string[];
      teamIds?: number[];
    },
    options?: {
      /**
       * Additional structured `HistoryChange` entries appended to the
       * auto-recorded `created` history row. Used by the clone flow to record
       * provenance (source activity id / displayId) on the new activity.
       */
      extraCreateChanges?: HistoryChange[];
    }
  ): Promise<ActivityResponse> {
    // Extract junction table IDs, venue address, and status/options from the DTO
    // activityStatusId is ignored (backend sets from markAsReviewed + activities.review permission)
    const {
      categoryIds,
      tagIds,
      commsMaterialIds,
      translationLanguageIds,
      sharedWithTeamIds,
      commsContacts: commsContactsArray,
      eventPlanners: eventPlannersArray,
      representatives,
      venueAddress,
      reportSettings: reportSettingsArray,
      activityHistoryNotes,
      activityStatusId: _activityStatusIdIgnored,
      markAsReviewed,
      commsContactLeadId: _commsContactLeadIdCreateIgnored,
      ...activityData
    } = dto;

    const canReview =
      context?.permissions?.includes(PERMISSIONS.ACTIVITIES.REVIEW) ?? false;
    const initialStatusName: ActivityStatusName =
      canReview && markAsReviewed === true ? 'reviewed' : 'new';
    const initialStatusId =
      await this.getActivityStatusIdByName(initialStatusName);

    // leadTeamId is required
    if (
      activityData.leadTeamId == null ||
      typeof activityData.leadTeamId !== 'number'
    ) {
      throw new BadRequestException('leadTeamId is required');
    }

    // Resolve lead team and derive leadMinistryId from team.ministryId
    const [leadTeam] = await this.databaseService.db
      .select({
        id: teams.id,
        name: teams.name,
        abbreviation: teams.abbreviation,
        ministryId: teams.ministryId,
      })
      .from(teams)
      .where(eq(teams.id, activityData.leadTeamId))
      .limit(1);
    if (!leadTeam) {
      throw new BadRequestException(
        `Team with ID ${activityData.leadTeamId} not found`
      );
    }
    const resolvedLeadMinistryId = leadTeam.ministryId ?? null;

    // Data scope: without activities.create.any, user may only create for teams they belong to.
    // Guards enforce permission; service enforces scope.
    const canCreateAny =
      context?.permissions?.includes(PERMISSIONS.ACTIVITIES.CREATE_ANY) ??
      false;
    if (!canCreateAny) {
      const teamIds = context?.teamIds;
      if (!Array.isArray(teamIds) || teamIds.length === 0) {
        throw new ForbiddenException(
          'You may only create activities for teams you belong to.'
        );
      }
      if (!teamIds.includes(activityData.leadTeamId)) {
        throw new ForbiddenException(
          'You may only create activities for teams you belong to.'
        );
      }
    }

    // Override leadMinistryId with resolved value from team
    const activityDataWithResolvedMinistry = {
      ...activityData,
      leadMinistryId: resolvedLeadMinistryId,
    };

    if (!categoryIds?.length) {
      throw new BadRequestException('At least one category is required.');
    }
    await this.utilsService.validateCategoryIds(categoryIds);
    if (tagIds?.length) {
      await this.validateTagIds(tagIds, context?.teamIds, context?.permissions);
    }
    await this.lookAheadPolicy.assertAllowedLookAheadSection(
      activityData.lookAheadSection
    );

    const pendingStatuses =
      await this.resolvePendingPitchAndTranslationStatusIds();
    const {
      pitchRequiredStatusId: dtoPitchStatus,
      translationsRequiredStatusId: dtoTranslationStatus,
      dateStatusId: dtoDateStatus,
      timeStatusId: dtoTimeStatus,
      significance: dtoSignificance,
      ...activityRowWithoutDefaults
    } = activityDataWithResolvedMinistry;

    const defaultDateTimeStatuses =
      await this.resolveDefaultDateTimeStatusIds();

    const activityRowForInsert = {
      ...activityRowWithoutDefaults,
      significance: dtoSignificance ?? null,
      dateStatusId: dtoDateStatus ?? defaultDateTimeStatuses.dateStatusId,
      timeStatusId: dtoTimeStatus ?? defaultDateTimeStatuses.timeStatusId,
      pitchRequiredStatusId:
        dtoPitchStatus ?? pendingStatuses.pitchRequiredStatusId,
      translationsRequiredStatusId:
        dtoTranslationStatus ?? pendingStatuses.translationsRequiredStatusId,
    };

    await this.validateCommsContactsForTeam(
      commsContactsArray,
      activityData.leadTeamId
    );

    const now = new Date();

    // Use transaction to ensure atomicity of activity and junction table inserts
    const result = await this.databaseService.db.transaction(async (tx) => {
      // Insert activity with displayId: null (will be updated after getting activity ID)
      // activityData contains only core activity fields (junction table fields were destructured out)
      // activityStatusId is set by backend from initialStatusId (client value ignored)
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
        ...activityRowForInsert,
        activityStatusId: initialStatusId,
        displayId: null,
        createdBy: userId,
        lastUpdatedBy: userId,
        createdDateTime: now,
        lastUpdatedDateTime: now,
      };

      // Insert the activity
      const [created] = await tx
        .insert(activities)
        .values(newActivity)
        .returning();

      const activityId = created.id;

      // Generate displayId: use ministry abbreviation when leadMinistryId is set, else teams.abbreviation.
      // Create enforces the stricter rule: ministry must have an abbreviation when set.
      let ministryAbbreviation: string | null = null;
      if (resolvedLeadMinistryId != null) {
        const [ministry] = await tx
          .select({ abbreviation: ministries.abbreviation })
          .from(ministries)
          .where(eq(ministries.id, resolvedLeadMinistryId))
          .limit(1);
        if (!ministry?.abbreviation) {
          throw new BadRequestException(
            `Ministry with ID ${resolvedLeadMinistryId} not found or missing abbreviation`
          );
        }
        ministryAbbreviation = ministry.abbreviation;
      }
      const displayId = this.utilsService.computeDisplayIdFromLeadContext({
        activityId,
        leadMinistryId: resolvedLeadMinistryId,
        ministryAbbreviation,
        teamAbbreviation: leadTeam.abbreviation,
      });

      // Update activity with generated displayId
      await tx
        .update(activities)
        .set({ displayId })
        .where(eq(activities.id, activityId));

      // Insert venue address if provided
      if (venueAddress) {
        const normalizedVenue = this.normalizeVenueAddress(venueAddress);
        if (normalizedVenue) {
          await this.junctionService.insertVenueAddress(
            tx,
            activityId,
            normalizedVenue
          );
        }
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
          userId,
          now
        ),
        // Tags
        this.junctionService.insertJunctionRecords(
          tx,
          activityTags,
          activityId,
          tagIds,
          (id: number) => ({ tagId: id }),
          userId,
          now
        ),
        // Comms Materials
        this.junctionService.insertJunctionRecords(
          tx,
          activityCommsMaterials,
          activityId,
          commsMaterialIds,
          (id: number) => ({ commsMaterialId: id }),
          userId,
          now
        ),
        // Translation Languages
        this.junctionService.insertJunctionRecords(
          tx,
          activityTranslationsRequired,
          activityId,
          translationLanguageIds,
          (id: number) => ({ languageId: id }),
          userId,
          now
        ),
        // Shared With Teams
        this.junctionService.insertJunctionRecords(
          tx,
          activitySharedWithTeams,
          activityId,
          sharedWithTeamIds,
          (id: number) => ({ teamId: id }),
          userId,
          now
        ),
        // Comms Contacts (with isLead flag)
        this.junctionService.insertCommsContacts(
          tx,
          activityId,
          commsContactsArray,
          now
        ),
        // Event planners
        this.junctionService.insertEventPlanners(
          tx,
          activityId,
          eventPlannersArray,
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
          const reportId =
            typeof setting.reportId === 'number' ? setting.reportId : undefined;
          if (typeof reportId === 'number') {
            reportSettingsMap.set(reportId, setting.omitted);
          } else {
            // Log and skip malformed entries
            this.logger.warn(
              'create: skipping malformed reportSettings entry',
              setting
            );
          }
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

    // Record activity creation in history (include initial status)
    const createdChanges: HistoryChange[] = [
      {
        field: 'activityStatusId',
        oldValue: null,
        newValue: initialStatusId,
      },
    ];
    if (options?.extraCreateChanges?.length) {
      createdChanges.push(...options.extraCreateChanges);
    }
    await this.activityHistoryService.recordChange(
      result.id,
      userId,
      'created',
      createdChanges,
      activityHistoryNotes || 'Activity created'
    );

    // When created as Reviewed, persist the review snapshot so the diff starts empty.
    if (initialStatusName === 'reviewed' && createdActivity) {
      const lookups = await this.getReviewDiffLookups();
      await this.persistReviewSnapshot(
        this.databaseService.db,
        result.id,
        createdActivity,
        lookups
      );
    }

    // Broadcast to all clients that a new activity was created
    // Only broadcast if the activity was successfully fetched
    if (createdActivity) {
      this.activitiesGateway.broadcastActivityCreated(createdActivity.id);
    }

    return createdActivity;
  }

  /**
   * Get activity IDs visible to the given teams by visibility rules:
   * - Global: all activities with visibility = 'global' (visible to everyone).
   * - Team: when teamIds.length > 0, activities with visibility = 'team' where
   *   leadTeamId is in teamIds OR activity is in activity_shared_with_teams for one of teamIds.
   * When teamIds.length === 0, only global visibility activities are returned.
   */
  private async getVisibleActivityIdsForTeams(
    teamIds: number[]
  ): Promise<Set<number>> {
    const globalIds = await this.databaseService.db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.visibility, 'global'))
      .then((rows) => new Set(rows.map((r) => r.id)));

    if (teamIds.length === 0) {
      return globalIds;
    }

    const [teamLeadIds, teamSharedIds] = await Promise.all([
      this.databaseService.db
        .select({ id: activities.id })
        .from(activities)
        .where(
          and(
            eq(activities.visibility, 'team'),
            inArray(activities.leadTeamId, teamIds)
          )
        )
        .then((rows) => new Set(rows.map((r) => r.id))),
      this.databaseService.db
        .selectDistinct({ activityId: activitySharedWithTeams.activityId })
        .from(activitySharedWithTeams)
        .where(
          and(
            inArray(activitySharedWithTeams.teamId, teamIds),
            eq(activitySharedWithTeams.isActive, true)
          )
        )
        .then(async (rows) => {
          const sharedIds = rows.map((r) => r.activityId);
          if (sharedIds.length === 0) return new Set<number>();
          return this.databaseService.db
            .select({ id: activities.id })
            .from(activities)
            .where(
              and(
                eq(activities.visibility, 'team'),
                inArray(activities.id, sharedIds)
              )
            )
            .then((activityRows) => new Set(activityRows.map((r) => r.id)));
        }),
    ]);

    return new Set<number>([...globalIds, ...teamLeadIds, ...teamSharedIds]);
  }

  /**
   * Find all activities with optional filtering
   * @param filters - Optional query filters (title, dates, status, etc.)
   * @param ctx - Request context (user + dataScope). Used to enforce includeDeleted only for Admin/System Admin.
   */
  async findAll(
    filters?: FilterActivitiesQueryParams,
    ctx?: RequestContextType
  ): Promise<ActivityResponse[]> {
    let activityResults: Activity[];

    // Resolve status IDs for default exclusions
    const [deletedStatus] = await this.databaseService.db
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(eq(activityStatuses.name, 'deleted' satisfies ActivityStatusName))
      .limit(1);
    const [completedStatus] = await this.databaseService.db
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(
        eq(activityStatuses.name, 'completed' satisfies ActivityStatusName)
      )
      .limit(1);

    const deletedStatusId = deletedStatus?.id;
    const completedStatusId = completedStatus?.id;

    const allowIncludeDeleted =
      filters?.includeDeleted === true &&
      (ctx?.user?.roleName === SYSTEM_ROLES.ADMIN ||
        ctx?.user?.roleName === SYSTEM_ROLES.SYSTEM_ADMIN);

    if (filters) {
      const conditions: SQL[] = [];
      if (filters.title) {
        conditions.push(eq(activities.title, filters.title));
      }
      if (filters.activityStatusId !== undefined) {
        conditions.push(
          eq(activities.activityStatusId, filters.activityStatusId)
        );
      } else {
        if (!allowIncludeDeleted && deletedStatusId !== undefined) {
          conditions.push(ne(activities.activityStatusId, deletedStatusId));
        }
        if (
          filters.includeCompleted !== true &&
          completedStatusId !== undefined
        ) {
          conditions.push(ne(activities.activityStatusId, completedStatusId));
        }
      }
      if (filters.isIssue !== undefined) {
        conditions.push(eq(activities.isIssue, filters.isIssue));
      }
      if (filters.leadMinistryId !== undefined) {
        conditions.push(eq(activities.leadMinistryId, filters.leadMinistryId));
      }
      if (filters.leadTeamId !== undefined) {
        conditions.push(eq(activities.leadTeamId, filters.leadTeamId));
      }
      if (filters.lookAheadSection) {
        conditions.push(
          eq(activities.lookAheadSection, filters.lookAheadSection)
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
        // No other conditions: apply default status exclusions
        const statusConditions: SQL[] = [];
        if (!allowIncludeDeleted && deletedStatusId !== undefined) {
          statusConditions.push(
            ne(activities.activityStatusId, deletedStatusId)
          );
        }
        if (
          filters.includeCompleted !== true &&
          completedStatusId !== undefined
        ) {
          statusConditions.push(
            ne(activities.activityStatusId, completedStatusId)
          );
        }
        if (statusConditions.length > 0) {
          activityResults = await this.databaseService.db
            .select()
            .from(activities)
            .where(and(...statusConditions));
        } else {
          activityResults = await this.databaseService.db
            .select()
            .from(activities);
        }
      }
    } else {
      // No filters: exclude deleted only (other callers e.g. calendar may want completed)
      if (deletedStatusId !== undefined) {
        activityResults = await this.databaseService.db
          .select()
          .from(activities)
          .where(ne(activities.activityStatusId, deletedStatusId));
      } else {
        activityResults = await this.databaseService.db
          .select()
          .from(activities);
      }
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

    // Restrict to activities where this user is the comms contact lead
    if (filters?.commsContactLeadUserId !== undefined) {
      const commsLeadRows = await this.databaseService.db
        .select({ activityId: activityCommsContacts.activityId })
        .from(activityCommsContacts)
        .where(
          and(
            eq(activityCommsContacts.userId, filters.commsContactLeadUserId),
            eq(activityCommsContacts.isLead, true),
            eq(activityCommsContacts.isActive, true)
          )
        );
      const commsLeadIds = new Set(commsLeadRows.map((r) => r.activityId));
      activityResults = activityResults.filter((a) => commsLeadIds.has(a.id));
    }

    // Restrict to activities shared with this team
    if (filters?.sharedWithTeamId !== undefined) {
      const sharedRows = await this.databaseService.db
        .select({ activityId: activitySharedWithTeams.activityId })
        .from(activitySharedWithTeams)
        .where(
          and(
            eq(activitySharedWithTeams.teamId, filters.sharedWithTeamId),
            eq(activitySharedWithTeams.isActive, true)
          )
        );
      const sharedIds = new Set(sharedRows.map((r) => r.activityId));
      activityResults = activityResults.filter((a) => sharedIds.has(a.id));
    }

    // Restrict to activities shared with any of these teams
    if (
      filters?.sharedWithTeamIds !== undefined &&
      filters.sharedWithTeamIds.length > 0
    ) {
      const sharedRows = await this.databaseService.db
        .select({ activityId: activitySharedWithTeams.activityId })
        .from(activitySharedWithTeams)
        .where(
          and(
            inArray(activitySharedWithTeams.teamId, filters.sharedWithTeamIds),
            eq(activitySharedWithTeams.isActive, true)
          )
        );
      const sharedIds = new Set(sharedRows.map((r) => r.activityId));
      activityResults = activityResults.filter((a) => sharedIds.has(a.id));
    }

    // Team-based data scoping: when bypass is false, restrict to activities visible by visibility rules
    // (global visibility for all; team visibility for lead team or shared-with teams only)
    const dataScope = ctx?.dataScope;
    if (dataScope && !dataScope.bypass) {
      const visibleIds = await this.getVisibleActivityIdsForTeams(
        dataScope.teamIds
      );
      activityResults = activityResults.filter((a) => visibleIds.has(a.id));
    }

    // Fetch related data for all activities
    const activityIds = activityResults.map((a) => a.id);
    const hasEditPermission =
      ctx?.user?.permissions?.includes(PERMISSIONS.ACTIVITIES.EDIT) ?? false;
    const canReview =
      ctx?.user?.permissions?.includes(PERMISSIONS.ACTIVITIES.REVIEW) ?? false;
    const [related, reviewLookups, reviewExemptFieldKeys] = await Promise.all([
      this.fetchRelatedForActivityIds(activityIds, activityResults),
      canReview ? this.getReviewDiffLookups() : Promise.resolve(undefined),
      canReview
        ? this.getEffectiveReviewExemptFieldKeys()
        : Promise.resolve(undefined),
    ]);
    const { namesMap: categoriesMap, idsMap: categoryIdsMap } =
      related.categoriesResult;

    return activityResults.map((activity) => {
      const commsContacts = related.commsContactsMap.get(activity.id) ?? [];
      const canEdit =
        ctx?.user &&
        hasEditPermission &&
        this.computeCanEdit(
          activity.leadTeamId,
          commsContacts.map((c) => c.userId),
          ctx.user.id,
          ctx.user.teamIds,
          dataScope?.bypass ?? false
        );
      const response = this.mapperService.mapToResponseDto(activity, {
        categories: categoriesMap.get(activity.id) ?? [],
        categoryIds: categoryIdsMap.get(activity.id) ?? [],
        tags: related.tagsMap.get(activity.id) ?? [],
        activityStatus: related.activityStatusesMap.get(activity.id),
        dateStatus: related.dateStatusesMap.get(activity.id),
        timeStatus: related.timeStatusesMap.get(activity.id),
        venueStatus: related.venueStatusesMap.get(activity.id),
        venueAddress: related.venueAddressesMap.get(activity.id) ?? null,
        commsMaterials: related.commsMaterialsMap.get(activity.id) ?? [],
        translationsRequired:
          related.translationsRequiredMap.get(activity.id) ?? [],
        representativesAttending:
          related.representativesAttendingMap.get(activity.id) ?? [],
        sharedWith: related.sharedWithMap.get(activity.id) ?? [],
        commsContacts,
        eventPlannerDetails:
          related.eventPlannerDetailsMap.get(activity.id) ?? [],
        eventPlanners: related.eventPlannersMap.get(activity.id) ?? [],
        eventPlannerLeadIds: related.eventPlannerIdsMap.get(activity.id) ?? [],
        leadOrgName: related.leadOrgNamesMap.get(activity.id) ?? null,
        newsReleaseOrigin:
          related.newsReleaseOriginsMap.get(activity.id) ?? null,
        newsReleaseDistribution:
          related.newsReleaseDistributionsMap.get(activity.id) ?? null,
        premierRequested: related.premierRequestedMap.get(activity.id) ?? null,
        reportSettings: related.reportSettingsMap.get(activity.id) ?? [],
        pitchRequiredStatus:
          related.pitchRequiredStatusMap.get(activity.id) ?? null,
        translationsRequiredStatus:
          related.translationsRequiredStatusMap.get(activity.id) ?? null,
        leadMinistry: related.leadMinistryNamesMap.get(activity.id) ?? null,
        leadMinistryAbbreviation:
          related.leadMinistryAbbreviationsMap.get(activity.id) ?? null,
        leadTeamDisplayName:
          related.leadTeamDisplayMap.get(activity.id) ?? null,
        canEdit: canEdit ?? undefined,
      });
      if (canReview) {
        response.changedFieldsSinceReview =
          this.computeChangedFieldsSinceReview(
            response,
            activity.reviewedFieldSnapshot,
            activity.reviewedFieldSnapshotVersion,
            reviewLookups,
            reviewExemptFieldKeys
          );
      }
      return response;
    });
  }

  /**
   * Whether the current user can edit this activity (comms contact, lead-team member, or bypass).
   */
  private computeCanEdit(
    leadTeamId: number | null,
    commsContactUserIds: number[],
    userId: number | undefined,
    teamIds: number[] | undefined,
    bypass: boolean
  ): boolean {
    if (userId === undefined) return false;
    if (bypass) return true;
    if (commsContactUserIds.includes(userId)) return true;
    if (
      leadTeamId != null &&
      Array.isArray(teamIds) &&
      teamIds.includes(leadTeamId)
    ) {
      return true;
    }
    return false;
  }

  /**
   * Find one activity by ID. When dataScope is provided and bypass is false, returns 404 if the activity is not visible to the user's teams.
   */
  async findOne(
    id: number,
    ctx?: RequestContextType
  ): Promise<ActivityResponse> {
    const dataScope = ctx?.dataScope;
    const [activity] = await this.databaseService.db
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (!activity) {
      throw new NotFoundException(`Activity #${id} not found`);
    }

    if (dataScope && !dataScope.bypass) {
      const visibleIds = await this.getVisibleActivityIdsForTeams(
        dataScope.teamIds
      );
      if (!visibleIds.has(id)) {
        throw new NotFoundException(`Activity #${id} not found`);
      }
    }

    // Fetch related data
    const canReview =
      ctx?.user?.permissions?.includes(PERMISSIONS.ACTIVITIES.REVIEW) ?? false;
    const [related, reviewLookups, reviewExemptFieldKeys] = await Promise.all([
      this.fetchRelatedForActivityIds([id], [activity]),
      canReview ? this.getReviewDiffLookups() : Promise.resolve(undefined),
      canReview
        ? this.getEffectiveReviewExemptFieldKeys()
        : Promise.resolve(undefined),
    ]);
    const commsContacts = related.commsContactsMap.get(id) ?? [];
    const hasEditPermission =
      ctx?.user?.permissions?.includes(PERMISSIONS.ACTIVITIES.EDIT) ?? false;
    const canEdit =
      ctx?.user &&
      hasEditPermission &&
      this.computeCanEdit(
        activity.leadTeamId,
        commsContacts.map((c) => c.userId),
        ctx.user.id,
        ctx.user.teamIds,
        dataScope?.bypass ?? false
      );

    const response = this.mapFetchedActivityToResponseDto(activity, related, {
      canEdit: canEdit ?? undefined,
    });

    if (canReview) {
      response.changedFieldsSinceReview = this.computeChangedFieldsSinceReview(
        response,
        activity.reviewedFieldSnapshot,
        activity.reviewedFieldSnapshotVersion,
        reviewLookups,
        reviewExemptFieldKeys
      );
    }

    const canComplete =
      ctx?.user?.permissions?.includes(PERMISSIONS.ACTIVITIES.COMPLETE) ??
      false;
    if (canComplete) {
      const statusName = related.activityStatusesMap.get(activity.id);
      const dateStatusName = related.dateStatusesMap?.get(activity.id);
      const timeStatusName = related.timeStatusesMap?.get(activity.id);
      const eligibility = isManualCompleteEligible(Date.now(), {
        activityStatusName: normalizeActivityStatusLabel(statusName ?? ''),
        dateStatusName: normalizeActivityStatusLabel(dateStatusName ?? ''),
        timeStatusName: normalizeActivityStatusLabel(timeStatusName ?? ''),
        endDate: activity.endDate ? String(activity.endDate) : null,
        endTime: activity.endTime ?? null,
        isAllDay: activity.isAllDay,
      });
      response.markCompleteEligible = eligibility.eligible;
    }

    return response;
  }

  /**
   * Update an activity
   */
  async update(
    id: number,
    dto: UpdateActivityRequest,
    userId: number,
    context?: {
      roleName?: string;
      permissions?: string[];
      teamIds?: number[];
    }
  ): Promise<ActivityResponse> {
    // Resolve existence first so missing IDs return 404 instead of lock-required 423.
    const [oldActivity] = await this.databaseService.db
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (!oldActivity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    const existingLock = await this.locksService.getLockForEntity(
      'activity',
      id
    );
    if (!existingLock) {
      throw new HttpException(
        {
          statusCode: HttpStatus.LOCKED,
          message:
            'You must acquire an edit lock before updating this activity.',
          locked: true,
          lockRequired: true,
        },
        HttpStatus.LOCKED
      );
    }
    if (existingLock.userId !== userId) {
      throw new HttpException(
        {
          statusCode: HttpStatus.LOCKED,
          message: 'This activity is being edited by another user.',
          locked: true,
          lockedBy: {
            userId: existingLock.userId,
            username: existingLock.username,
            acquiredAt: existingLock.acquiredAt,
            expiresAt: existingLock.expiresAt,
            idleExpiresAt: existingLock.idleExpiresAt,
          },
        },
        HttpStatus.LOCKED
      );
    }

    // Reject update when activity is delete_requested or deleted
    const currentStatusName = await this.getActivityStatusNameById(
      oldActivity.activityStatusId
    );
    if (
      currentStatusName === 'delete_requested' ||
      currentStatusName === 'deleted'
    ) {
      throw new ConflictException(
        `Activity cannot be updated when status is '${currentStatusName}'. Restore the activity first.`
      );
    }

    // Strip fields the user lacks field-level edit permission for (keeps existing DB values)
    // Note: Field-level write policy enforcement may be implemented in authorization guards

    // Extract junction table IDs and venue address from DTO; omit activityStatusId, markAsReviewed, markAsCompleted (backend sets status)
    const {
      categoryIds,
      tagIds,
      commsMaterialIds,
      translationLanguageIds,
      sharedWithTeamIds,
      commsContacts: commsContactsArray,
      eventPlanners: eventPlannersArray,
      representatives,
      venueAddress,
      reportSettings: reportSettingsArray,
      activityHistoryNotes,
      activityStatusId: _activityStatusIdIgnored,
      markAsReviewed: _markAsReviewedIgnored,
      markAsCompleted: _markAsCompletedIgnored,
      commsContactLeadId: _commsContactLeadIdUiIgnored,
      ...activityUpdateData
    } = dto;

    // Compute new status. Do not use DTO activityStatusId.
    const canReview =
      context?.permissions?.includes(PERMISSIONS.ACTIVITIES.REVIEW) ?? false;
    const canComplete =
      context?.permissions?.includes(PERMISSIONS.ACTIVITIES.COMPLETE) ?? false;

    let newStatusName: ActivityStatusName;

    if (dto.markAsCompleted === true) {
      if (!canComplete) {
        throw new ForbiddenException(
          'You do not have permission to complete activities.'
        );
      }

      // Validate eligibility for manual completion
      const eligibility = isManualCompleteEligible(Date.now(), {
        activityStatusName: currentStatusName ?? '',
        dateStatusName: await this.getDateStatusNameById(
          oldActivity.dateStatusId
        ),
        timeStatusName: await this.getTimeStatusNameById(
          oldActivity.timeStatusId
        ),
        endDate: oldActivity.endDate ? String(oldActivity.endDate) : null,
        endTime: oldActivity.endTime ?? null,
        isAllDay: oldActivity.isAllDay,
      });

      if (!eligibility.eligible) {
        throw new ConflictException(
          `Activity cannot be completed: ${eligibility.reason}`
        );
      }

      newStatusName = 'completed';
    } else if (canReview && dto.markAsReviewed === true) {
      newStatusName = 'reviewed';
    } else if (currentStatusName === 'new') {
      newStatusName = 'new';
    } else if (currentStatusName === 'completed' && canComplete) {
      newStatusName = 'completed';
    } else if (
      currentStatusName === 'reviewed' &&
      (await this.shouldPreserveReviewedStatus(id, oldActivity, dto))
    ) {
      // Updates that touch only review-exempt fields (e.g. sharing/visibility)
      // must not regress a Reviewed activity back to Changed.
      newStatusName = 'reviewed';
    } else {
      newStatusName = 'changed';
    }

    const computedStatusId =
      await this.getActivityStatusIdByName(newStatusName);

    // Normalize venue address to prevent false change detection from whitespace differences
    const normalizedVenueAddress =
      venueAddress !== undefined
        ? this.normalizeVenueAddress(venueAddress)
        : undefined;

    // Build update payload: activityUpdateData contains only core activity fields (junction/venue were destructured out).
    // Cast is intentional: UpdateActivityRequest and Activity must stay in sync; only activity table columns are updated.
    const updateData: Partial<Activity> = {
      ...(activityUpdateData as Partial<Activity>),
      activityStatusId: computedStatusId,
      lastUpdatedDateTime: new Date(),
    };

    const now = new Date();
    // Ensure lastUpdatedBy is set for audit/history
    updateData.lastUpdatedBy = userId;

    // Capture existing related data for history (before transaction)
    const venueRows = await this.databaseService.db
      .select()
      .from(venueAddresses)
      .where(eq(venueAddresses.activityId, id))
      .limit(1);
    const existingVenue = venueRows[0] ?? null;

    const existingComms = await this.databaseService.db
      .select({
        userId: activityCommsContacts.userId,
        isLead: activityCommsContacts.isLead,
      })
      .from(activityCommsContacts)
      .where(
        and(
          eq(activityCommsContacts.activityId, id),
          eq(activityCommsContacts.isActive, true)
        )
      );

    // Validate comms contacts belong to the (possibly updated) lead team
    const effectiveLeadTeamId =
      (activityUpdateData as Partial<Activity>).leadTeamId ??
      oldActivity.leadTeamId;
    if (effectiveLeadTeamId != null) {
      await this.validateCommsContactsForTeam(
        commsContactsArray,
        effectiveLeadTeamId
      );
    }

    const existingRepresentatives = await this.databaseService.db
      .select({
        representativeId: activityRepresentatives.representativeId,
        representativeName: activityRepresentatives.representativeName,
      })
      .from(activityRepresentatives)
      .where(
        and(
          eq(activityRepresentatives.activityId, id),
          eq(activityRepresentatives.isActive, true)
        )
      );

    const existingReportSettings = await this.databaseService.db
      .select({
        reportId: activityReportSettings.reportId,
        omitted: activityReportSettings.omitted,
      })
      .from(activityReportSettings)
      .where(eq(activityReportSettings.activityId, id));

    // Data scope: when changing leadTeamId, user without create.any may only set a team they belong to.
    if (
      dto.leadTeamId !== undefined &&
      context?.permissions &&
      !context.permissions.includes(PERMISSIONS.ACTIVITIES.CREATE_ANY)
    ) {
      const teamIds = context.teamIds;
      if (!Array.isArray(teamIds) || teamIds.length === 0) {
        throw new ForbiddenException(
          'You may only set lead team to a team you belong to.'
        );
      }
      if (!teamIds.includes(dto.leadTeamId)) {
        throw new ForbiddenException(
          'You may only set lead team to a team you belong to.'
        );
      }
    }

    // Validate categories outside the transaction so we do not hold a txn
    // connection while borrowing another from the pool (pool starvation under load).
    if (categoryIds !== undefined) {
      await this.utilsService.validateCategoryIds(categoryIds);
    }
    if (tagIds?.length) {
      await this.validateTagIds(tagIds, context?.teamIds, context?.permissions);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'lookAheadSection')) {
      await this.lookAheadPolicy.assertAllowedLookAheadSection(
        dto.lookAheadSection ?? null
      );
    }

    // Use transaction to ensure atomicity of activity and junction table updates
    const updated = await this.databaseService.db.transaction(async (tx) => {
      const effectiveLeadTeamId =
        dto.leadTeamId !== undefined ? dto.leadTeamId : oldActivity.leadTeamId;
      const effectiveLeadMinistryId =
        dto.leadMinistryId !== undefined
          ? dto.leadMinistryId
          : oldActivity.leadMinistryId;

      // Recalculate displayId when lead team or ministry changes
      const leadTeamOrMinistryChanged =
        dto.leadTeamId !== undefined || dto.leadMinistryId !== undefined;
      if (leadTeamOrMinistryChanged) {
        // Resolve the team abbreviation for the effective lead team (new or existing).
        const effectiveTeamId =
          dto.leadTeamId !== undefined ? dto.leadTeamId : effectiveLeadTeamId;
        let teamAbbreviation: string | null = null;
        let teamMinistryId: number | null = null;
        if (effectiveTeamId != null) {
          const [teamRow] = await tx
            .select({
              abbreviation: teams.abbreviation,
              ministryId: teams.ministryId,
            })
            .from(teams)
            .where(eq(teams.id, effectiveTeamId))
            .limit(1);
          if (!teamRow && dto.leadTeamId !== undefined) {
            throw new BadRequestException(
              `Team with ID ${dto.leadTeamId} not found`
            );
          }
          teamAbbreviation = teamRow?.abbreviation ?? null;
          teamMinistryId = teamRow?.ministryId ?? null;
        }

        // When a new lead team is selected, inherit its ministry as the lead ministry.
        if (dto.leadTeamId !== undefined) {
          updateData.leadMinistryId = teamMinistryId;
        }
        const resolvedMinistryId =
          dto.leadTeamId !== undefined
            ? teamMinistryId
            : effectiveLeadMinistryId;

        let ministryAbbreviation: string | null = null;
        if (resolvedMinistryId != null) {
          const [ministry] = await tx
            .select({ abbreviation: ministries.abbreviation })
            .from(ministries)
            .where(eq(ministries.id, resolvedMinistryId))
            .limit(1);
          ministryAbbreviation = ministry?.abbreviation ?? null;
        }

        updateData.displayId =
          this.utilsService.computeDisplayIdFromLeadContext({
            activityId: id,
            leadMinistryId: resolvedMinistryId,
            ministryAbbreviation,
            teamAbbreviation,
          });
      }

      const [updatedActivity] = await tx
        .update(activities)
        .set(updateData)
        .where(eq(activities.id, id))
        .returning();

      // Debug: log the DB row returned from update
      try {
        this.logger.debug(
          `update() id=${id} updatedActivity=${JSON.stringify(updatedActivity)}`
        );
      } catch {
        // ignore debug log failure
      }

      // Handle venue address update
      if (normalizedVenueAddress !== undefined) {
        await this.junctionService.upsertVenueAddress(
          tx,
          id,
          normalizedVenueAddress
        );
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
          userId,
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
          userId,
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
          userId,
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
          userId,
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
          userId,
          now
        );
      }

      // Update comms contacts
      if (commsContactsArray !== undefined) {
        await this.junctionService.updateCommsContacts(
          tx,
          id,
          commsContactsArray,
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

      // Update event planners
      if (eventPlannersArray !== undefined) {
        await this.junctionService.updateEventPlanners(
          tx,
          id,
          eventPlannersArray,
          now
        );
      }

      // Update report settings
      if (reportSettingsArray !== undefined && reportSettingsArray.length > 0) {
        // Convert array format to Map for service layer
        const reportSettingsMap = new Map<number, boolean>();
        for (const setting of reportSettingsArray) {
          const reportId =
            typeof setting.reportId === 'number' ? setting.reportId : undefined;
          if (typeof reportId === 'number') {
            reportSettingsMap.set(reportId, setting.omitted);
          } else {
            // Log and skip malformed entries
            this.logger.warn(
              'update: skipping malformed reportSettings entry',
              setting
            );
          }
        }
        await this.junctionService.updateActivityReportSettings(
          tx,
          id,
          reportSettingsMap
        );
      }

      return updatedActivity;
    });

    if (existingLock && existingLock.userId === userId) {
      const releaseResult =
        await this.locksService.releaseLockOrFinalizePendingHandoff(
          existingLock.id,
          userId
        );
      // Broadcast explicit lock release so other viewers clear lock UI without reload.
      if (
        releaseResult?.kind === 'released' &&
        releaseResult.lock.entityType === 'activity'
      ) {
        this.activitiesGateway.notifyLockReleased(releaseResult.lock.entityId);
      }
    }

    // Fetch related data for the updated activity
    const [
      categoriesResult,
      tagsList,
      activityStatus,
      dateStatus,
      timeStatus,
      venueStatus,
      venueAddressesMap,
      commsMaterials,
      translationsRequired,
      representativesAttending,
      sharedWith,
      commsContacts,
      leadOrgNamesMap,
      eventPlannerDetailsMap,
      newsReleaseOriginsMap,
      newsReleaseDistributionsMap,
      premierRequestedMap,
      reportSettingsMap,
      pitchRequiredStatus,
      translationsRequiredStatus,
      leadMinistryName,
      leadMinistryAbbreviation,
      leadTeamDisplayMap,
    ] = await Promise.all([
      this.dataFetcherService.fetchCategoriesForActivities([id]),
      this.dataFetcherService.fetchTagsForActivities([id]),
      this.dataFetcherService.fetchActivityStatusesForActivities([id]),
      this.dataFetcherService.fetchDateStatusesForActivities([id]),
      this.dataFetcherService.fetchTimeStatusesForActivities([id]),
      this.dataFetcherService.fetchVenueStatusesForActivities([id]),
      this.dataFetcherService.fetchVenueAddressesForActivities([id]),
      this.dataFetcherService.fetchCommsMaterialsForActivities([id]),
      this.dataFetcherService.fetchTranslationsRequiredForActivities([id]),
      this.dataFetcherService.fetchRepresentativesAttendingForActivities([id]),
      this.dataFetcherService.fetchSharedWithTeamsForActivities([id]),
      this.dataFetcherService.fetchCommsContactsForActivities([id]),
      this.dataFetcherService.fetchLeadOrgNamesForActivities([updated]),
      this.dataFetcherService.fetchEventPlannerDetailsForActivities([id]),
      this.dataFetcherService.fetchNewsReleaseOriginsForActivities([id]),
      this.dataFetcherService.fetchNewsReleaseDistributionsForActivities([id]),
      this.dataFetcherService.fetchPremierRequestedForActivities([id]),
      this.dataFetcherService.fetchReportSettingsForActivities([id]),
      this.dataFetcherService.fetchPitchRequiredStatusForActivities([id]),
      this.dataFetcherService.fetchTranslationsRequiredStatusForActivities([
        id,
      ]),
      this.dataFetcherService.fetchLeadMinistryNamesForActivities([id]),
      this.dataFetcherService.fetchLeadMinistryAbbreviationsForActivities([id]),
      this.dataFetcherService.fetchLeadTeamDisplayForActivities([
        { id: updated.id, leadTeamId: updated.leadTeamId },
      ]),
    ]);

    // Note: previously published category/tag refresh events to Redis here.
    // Redis worker removed; propagation handled synchronously or via DB jobs if needed.

    const eventPlannerDetails = eventPlannerDetailsMap.get(id) ?? [];

    const { namesMap: categoriesList, idsMap: categoryIdsList } =
      categoriesResult;

    const result = this.mapperService.mapToResponseDto(updated, {
      categories: categoriesList.get(id) ?? [],
      categoryIds: categoryIdsList.get(id) ?? [],
      tags: tagsList.get(id) ?? [],
      activityStatus: activityStatus.get(id),
      dateStatus: dateStatus.get(id),
      timeStatus: timeStatus.get(id),
      venueStatus: venueStatus.get(id),
      venueAddress: venueAddressesMap.get(id) ?? null,
      commsMaterials: commsMaterials.get(id) ?? [],
      translationsRequired: translationsRequired.get(id) ?? [],
      representativesAttending: representativesAttending.get(id) ?? [],
      sharedWith: sharedWith.get(id) ?? [],
      commsContacts: commsContacts.get(id) ?? [],
      eventPlannerDetails,
      eventPlanners: eventPlannerDetails.map((d) => d.name),
      eventPlannerLeadIds: eventPlannerDetails
        .filter((d) => d.eventPlannerId != null)
        .map((d) => d.eventPlannerId as number),
      leadOrgName: leadOrgNamesMap.get(id) ?? null,
      newsReleaseOrigin: newsReleaseOriginsMap.get(id) ?? null,
      newsReleaseDistribution: newsReleaseDistributionsMap.get(id) ?? null,
      premierRequested: premierRequestedMap.get(id) ?? null,
      reportSettings: reportSettingsMap.get(id) ?? [],
      pitchRequiredStatus: pitchRequiredStatus.get(id) ?? null,
      translationsRequiredStatus: translationsRequiredStatus.get(id) ?? null,
      leadMinistry: leadMinistryName.get(id) ?? null,
      leadMinistryAbbreviation: leadMinistryAbbreviation.get(id) ?? null,
      leadTeamDisplayName: leadTeamDisplayMap.get(id) ?? null,
    });

    // Generate change list for history tracking (main activity fields)
    // Convert Activity objects to generic records for comparison
    // Activity is a plain object that can be treated as Record<string, unknown>
    const entityResolutions =
      await this.activityHistoryService.buildEntityResolutionMaps(
        this.databaseService.db,
        oldActivity,
        updated
      );
    const mainChanges = this.activityHistoryService.generateChangeList(
      oldActivity,
      updated,
      entityResolutions
    );

    // Collect all changes from this update into a single array
    const allChanges: Array<{
      field: string;
      oldValue: unknown;
      newValue: unknown;
    }> = [...mainChanges];

    // Add junction table changes to the same history entry
    // Only add if the values have actually changed (using deep equality)
    // Normalize existing venue address for comparison
    const normalizedExistingVenue = this.normalizeVenueAddress(existingVenue);
    if (
      normalizedVenueAddress !== undefined &&
      !isDeepEqual(normalizedExistingVenue, normalizedVenueAddress)
    ) {
      allChanges.push({
        field: 'venueAddress',
        oldValue: normalizedExistingVenue ?? null,
        newValue: normalizedVenueAddress ?? null,
      });
    }

    if (
      commsContactsArray !== undefined &&
      !isDeepEqual(existingComms, commsContactsArray)
    ) {
      const [resolvedOld, resolvedNew] = await Promise.all([
        this.activityHistoryService.resolveCommsContacts(
          this.databaseService.db,
          existingComms
        ),
        this.activityHistoryService.resolveCommsContacts(
          this.databaseService.db,
          commsContactsArray
        ),
      ]);
      allChanges.push({
        field: 'commsContacts',
        oldValue: resolvedOld,
        newValue: resolvedNew,
      });
    }

    if (
      representatives !== undefined &&
      !isDeepEqual(
        this.normalizeRepresentatives(existingRepresentatives),
        this.normalizeRepresentatives(representatives)
      )
    ) {
      allChanges.push({
        field: 'representatives',
        oldValue: this.normalizeRepresentatives(existingRepresentatives),
        newValue: this.normalizeRepresentatives(representatives),
      });
    }

    if (
      reportSettingsArray !== undefined &&
      reportSettingsArray.length > 0 &&
      !isDeepEqual(existingReportSettings, reportSettingsArray)
    ) {
      allChanges.push({
        field: 'reportSettings',
        oldValue: existingReportSettings,
        newValue: reportSettingsArray,
      });
    }

    // Debug: log detected changes
    try {
      this.logger.debug(
        `update() id=${id} changes=${JSON.stringify(allChanges)}`
      );
    } catch {
      // ignore debug log failure
    }

    const completedByUser = dto.markAsCompleted === true && canComplete;
    const reviewedByUser = canReview && dto.markAsReviewed === true;
    const historyActionType = completedByUser
      ? 'completed'
      : reviewedByUser
        ? 'reviewed'
        : 'updated';
    const defaultHistoryNote = completedByUser
      ? allChanges.length > 0
        ? 'Activity completed and updated'
        : 'Activity completed'
      : reviewedByUser
        ? allChanges.length > 0
          ? 'Activity reviewed and updated'
          : 'Activity reviewed'
        : 'Activity updated';

    // Record all activity changes in a single history entry
    await this.activityHistoryService.recordChange(
      id,
      userId,
      historyActionType,
      allChanges.length > 0 ? allChanges : undefined,
      activityHistoryNotes || defaultHistoryNote
    );

    // When status becomes Reviewed, capture the current state as the review snapshot.
    if (newStatusName === 'reviewed') {
      const lookups = await this.getReviewDiffLookups();
      await this.persistReviewSnapshot(
        this.databaseService.db,
        id,
        result,
        lookups
      );
    }

    // Push Socket.IO work off the HTTP critical path so PATCH can respond even if
    // broadcast/serialization is slow (and to avoid stacking work behind prior requests).
    const gateway = this.activitiesGateway;
    const notifyActivityId = id;
    setImmediate(() => {
      try {
        gateway.notifyActivityUpdate(notifyActivityId);
      } catch (err: unknown) {
        this.logger.error(
          'notifyActivityUpdate failed (deferred)',
          err instanceof Error ? err.stack : String(err)
        );
      }
    });

    return result;
  }

  /**
   * Clone an existing activity into a new draft.
   *
   * The source activity's field values are mapped into a `CreateActivityRequest`
   * payload, then transformed per the clone rules:
   * - Schedule fields and title come from the request body (user re-enters them).
   * - Never-copied fields (look ahead, pitch, translations, pitchDate, executive
   *   summary) are reset to create-time defaults.
   * - Optional `includeFieldPaths` acts as an allow-list across the advanced
   *   field inventory; fields not in the list are dropped so `create` applies
   *   its default values.
   * - Field-level write scopes the user cannot edit are stripped.
   * - Initial activity status matches **create** rules: `new` or `reviewed` from
   *   `markAsReviewed` when the user has `activities.review` (see `create`).
   * Two history entries are recorded with the same optional note:
   * - `created` on the new activity (with source provenance in `changes`).
   * - `cloned` on the source activity (with new-activity provenance in
   *   `changes`).
   */
  async clone(
    sourceId: number,
    body: CloneActivityRequest,
    userId: number,
    context: {
      roleName?: string;
      permissions?: string[];
      teamIds?: number[];
    }
  ): Promise<ActivityResponse> {
    const source = await this.findOne(sourceId);

    const lookups = await this.getReviewDiffLookups();
    const sourceFormData = mapResponseToFormData(source, lookups);

    const dto: CreateActivityRequest = { ...sourceFormData };

    for (const key of CLONE_NEVER_COPIED_FIELD_KEYS) {
      delete (dto as Record<string, unknown>)[key];
    }
    for (const key of CLONE_MODAL_SCHEDULE_FIELD_KEYS) {
      delete (dto as Record<string, unknown>)[key];
    }
    for (const key of CLONE_SYSTEM_FIELD_KEYS) {
      delete (dto as Record<string, unknown>)[key];
    }

    if (body.includeFieldPaths !== undefined) {
      const includedSet = new Set(
        body.includeFieldPaths.filter((path) =>
          CLONE_ALLOWED_INCLUDE_PATHS.has(path)
        )
      );
      for (const path of CLONE_ADVANCED_FIELD_PATHS) {
        if (!includedSet.has(path)) {
          delete (dto as Record<string, unknown>)[path];
        }
      }
    }

    applyFieldLevelWritePolicy(dto as Record<string, unknown>, {
      permissions: context.permissions ?? [],
      roleName: context.roleName ?? '',
    });

    dto.title = body.title;
    dto.startDate = body.startDate ?? null;
    dto.endDate = body.endDate ?? null;
    dto.startTime = body.startTime ?? null;
    dto.endTime = body.endTime ?? null;
    if (body.isAllDay !== undefined) {
      dto.isAllDay = body.isAllDay;
    }
    if (body.dateStatusId !== undefined) {
      dto.dateStatusId = body.dateStatusId;
    }
    if (body.timeStatusId !== undefined) {
      dto.timeStatusId = body.timeStatusId;
    }

    dto.markAsReviewed = body.markAsReviewed === true;
    dto.activityHistoryNotes = body.activityHistoryNotes;

    const sourceProvenance: HistoryChange[] = [
      {
        field: 'clonedFromActivityId',
        oldValue: null,
        newValue: source.id,
      },
      {
        field: 'clonedFromDisplayId',
        oldValue: null,
        newValue: source.displayId ?? null,
      },
    ];

    const created = await this.create(dto, userId, context, {
      extraCreateChanges: sourceProvenance,
    });

    await this.activityHistoryService.recordChange(
      sourceId,
      userId,
      'cloned',
      [
        {
          field: 'clonedToActivityId',
          oldValue: null,
          newValue: created.id,
        },
        {
          field: 'clonedToDisplayId',
          oldValue: null,
          newValue: created.displayId ?? null,
        },
      ],
      body.activityHistoryNotes
    );

    return created;
  }

  /**
   * Remove an activity (hard delete).
   * When context.permissions does not include activities.delete.any, user must be comms contact or lead-team member for the activity.
   * Writes to deletion_audit, then deletes all child rows and the activity in a single transaction.
   */
  async remove(
    id: number,
    userId: number,
    context?: { permissions?: string[]; teamIds?: number[] },
    options?: { reason?: string }
  ): Promise<{ message: string }> {
    const canDeleteAny =
      context?.permissions?.includes(PERMISSIONS.ACTIVITIES.DELETE_ANY) ??
      false;
    if (!canDeleteAny) {
      const [isCommsContact, leadTeamId] = await Promise.all([
        this.policyService.isCommsContactForActivity(id, userId),
        this.policyService.getLeadTeamIdForActivity(id),
      ]);
      const isLeadTeamMember =
        leadTeamId != null &&
        Array.isArray(context?.teamIds) &&
        context.teamIds.includes(leadTeamId);
      if (!isCommsContact && !isLeadTeamMember) {
        throw new ForbiddenException(
          'You may only delete activities where you are a comms contact or lead-team member, or have activities.delete.any.'
        );
      }
    }

    // Verify activity exists so we return 404 for non-existent IDs
    await this.findOne(id);

    const reason = options?.reason ?? undefined;

    await this.databaseService.db.transaction(async (tx) => {
      // Audit trail for permanent deletion (no FK to activities so record survives)
      await tx.insert(deletionAudit).values({
        activityId: id,
        userId,
        reason: reason ?? null,
      });

      // Delete all child rows that reference this activity (order does not matter for these tables)
      await tx
        .delete(activityHistory)
        .where(eq(activityHistory.activityId, id));
      await tx
        .delete(activityCategories)
        .where(eq(activityCategories.activityId, id));
      await tx
        .delete(activityCommsContacts)
        .where(eq(activityCommsContacts.activityId, id));
      await tx
        .delete(activityCommsMaterials)
        .where(eq(activityCommsMaterials.activityId, id));
      await tx
        .delete(activityReportSettings)
        .where(eq(activityReportSettings.activityId, id));
      await tx
        .delete(activityRepresentatives)
        .where(eq(activityRepresentatives.activityId, id));
      await tx
        .delete(activitySharedWithTeams)
        .where(eq(activitySharedWithTeams.activityId, id));
      await tx
        .delete(activitySectors)
        .where(eq(activitySectors.activityId, id));
      await tx.delete(activityTags).where(eq(activityTags.activityId, id));
      await tx.delete(activityThemes).where(eq(activityThemes.activityId, id));
      await tx
        .delete(activityTranslationsRequired)
        .where(eq(activityTranslationsRequired.activityId, id));
      await tx
        .delete(favoriteActivities)
        .where(eq(favoriteActivities.activityId, id));
      await tx
        .delete(activitySubscriptions)
        .where(eq(activitySubscriptions.activityId, id));
      await tx.delete(venueAddresses).where(eq(venueAddresses.activityId, id));

      await tx.delete(activities).where(eq(activities.id, id));
    });

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
   * Returns visible activity IDs based on the request context's data scope.
   * Returns null when all activities are visible (admin/bypass) to avoid fetching
   * all IDs and passing them as a large IN clause — the caller should omit the
   * activity-ID filter entirely in that case.
   */
  private async getVisibleActivityIds(
    ctx?: RequestContextType
  ): Promise<number[] | null> {
    const dataScope = ctx?.dataScope;
    if (dataScope && !dataScope.bypass) {
      const visibleSet = await this.getVisibleActivityIdsForTeams(
        dataScope.teamIds
      );
      return Array.from(visibleSet);
    }
    // Admin / no scope: all activities are visible — return null to skip IN filter
    return null;
  }

  /**
   * Enriches a page of history entries with activity metadata (title, displayId,
   * leadTeamId, categories). Only fetches data for activity IDs present on the
   * current page, keeping each paginated request lightweight.
   */
  private async enrichHistoryPage(
    historyItems: ActivityHistoryEntry[]
  ): Promise<GlobalActivityHistoryEntry[]> {
    const pageActivityIds = [...new Set(historyItems.map((e) => e.activityId))];
    if (pageActivityIds.length === 0) return [];

    const [pageActivityRows, { namesMap: categoriesMap }] = await Promise.all([
      this.databaseService.db
        .select({
          id: activities.id,
          displayId: activities.displayId,
          title: activities.title,
          leadTeamId: activities.leadTeamId,
        })
        .from(activities)
        .where(inArray(activities.id, pageActivityIds)),
      this.dataFetcherService.fetchCategoriesForActivities(pageActivityIds),
    ]);

    const activityMap = new Map(
      pageActivityRows.map((a) => [
        a.id,
        {
          id: a.id,
          displayId: a.displayId,
          title: a.title,
          leadTeamId: a.leadTeamId,
          categories: categoriesMap.get(a.id) ?? [],
        },
      ])
    );

    return historyItems.flatMap((entry) => {
      const activity = activityMap.get(entry.activityId);
      return activity ? [{ ...entry, activity }] : [];
    });
  }

  async getGlobalHistory(ctx?: RequestContextType): Promise<{
    items: GlobalActivityHistoryEntry[];
    page: number;
    pageSize: number;
    hasNext: boolean;
    totalItems: number;
  }> {
    const visibleActivityIds = await this.getVisibleActivityIds(ctx);
    // null = admin/bypass (all visible); empty array = no visible activities
    if (visibleActivityIds !== null && visibleActivityIds.length === 0) {
      return {
        items: [],
        page: 1,
        pageSize: 50,
        hasNext: false,
        totalItems: 0,
      };
    }

    // Default scope: today (server local date)
    const now = new Date();
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const historyPage =
      await this.activityHistoryService.getActivityHistoryForActivityIdsPaged(
        visibleActivityIds,
        {
          startDate: todayDateStr,
          endDate: todayDateStr,
          page: 1,
          pageSize: 50,
        }
      );

    if (historyPage.items.length === 0) {
      return {
        items: [],
        page: 1,
        pageSize: 50,
        hasNext: false,
        totalItems: 0,
      };
    }

    const items = await this.enrichHistoryPage(historyPage.items);

    return {
      items,
      page: 1,
      pageSize: 50,
      hasNext: historyPage.hasNext,
      totalItems: historyPage.totalItems ?? 0,
    };
  }

  async getGlobalHistoryPaged(
    opts: {
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
      query?: string;
      order?: 'asc' | 'desc';
    },
    ctx?: RequestContextType
  ): Promise<{
    items: GlobalActivityHistoryEntry[];
    page: number;
    pageSize: number;
    hasNext: boolean;
    totalItems: number;
  }> {
    const visibleActivityIds = await this.getVisibleActivityIds(ctx);
    // null = admin/bypass (all visible); empty array = no visible activities
    if (visibleActivityIds !== null && visibleActivityIds.length === 0) {
      return {
        items: [],
        page: opts.page ?? 1,
        pageSize: opts.pageSize ?? 50,
        hasNext: false,
        totalItems: 0,
      };
    }

    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.max(1, opts.pageSize ?? 50);

    // Apply a default 30-day window when neither bound is provided to prevent
    // unbounded history scans and expensive COUNT(*) over all-time data.
    const now = new Date();
    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const defaultEndDate = formatDate(now);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const defaultStartDate = formatDate(thirtyDaysAgo);

    const startDate =
      opts.startDate ??
      (opts.endDate === undefined ? defaultStartDate : undefined);
    const endDate =
      opts.endDate ??
      (opts.startDate === undefined ? defaultEndDate : undefined);

    const historyPage =
      await this.activityHistoryService.getActivityHistoryForActivityIdsPaged(
        visibleActivityIds,
        {
          startDate,
          endDate,
          page,
          pageSize,
          query: opts.query,
          order: opts.order,
        }
      );

    if (historyPage.items.length === 0) {
      return {
        items: [],
        page,
        pageSize,
        hasNext: false,
        totalItems: historyPage.totalItems ?? 0,
      };
    }

    const items = await this.enrichHistoryPage(historyPage.items);

    return {
      items,
      page,
      pageSize,
      hasNext: historyPage.hasNext,
      totalItems: historyPage.totalItems,
    };
  }

  async addHistoryNote(id: number, note: string, userId: number) {
    const trimmedNote = note.trim();
    if (trimmedNote.length === 0) {
      throw new BadRequestException('Note is required');
    }

    const [existing] = await this.databaseService.db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    const createdEntry = await this.activityHistoryService.recordChange(
      id,
      userId,
      'note_added',
      undefined,
      trimmedNote
    );

    const hydratedEntry = await this.activityHistoryService.getHistoryEntryById(
      createdEntry.id
    );

    if (!hydratedEntry) {
      throw new NotFoundException(
        `History entry ${createdEntry.id} not found after creation`
      );
    }

    return hydratedEntry;
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
   * Soft delete (set activityStatusId to 'deleted').
   * When context.permissions does not include activities.delete.any, user must be comms contact or lead-team member for the activity.
   */
  async softDelete(
    id: number,
    reason: string,
    userId: number,
    context?: { permissions?: string[]; teamIds?: number[] }
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

    const canDeleteAny =
      context?.permissions?.includes(PERMISSIONS.ACTIVITIES.DELETE_ANY) ??
      false;
    if (!canDeleteAny) {
      const [isCommsContact, leadTeamId] = await Promise.all([
        this.policyService.isCommsContactForActivity(id, userId),
        this.policyService.getLeadTeamIdForActivity(id),
      ]);
      const isLeadTeamMember =
        leadTeamId != null &&
        Array.isArray(context?.teamIds) &&
        context.teamIds.includes(leadTeamId);
      if (!isCommsContact && !isLeadTeamMember) {
        throw new ForbiddenException(
          'You may only delete activities where you are a comms contact or lead-team member, or have activities.delete.any.'
        );
      }
    }

    // Get deleted status ID
    const [deletedStatus] = await this.databaseService.db
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(eq(activityStatuses.name, 'deleted' satisfies ActivityStatusName))
      .limit(1);

    if (!deletedStatus) {
      throw new BadRequestException(
        'Deleted activity status not found in database'
      );
    }

    const updated = await this.databaseService.db.transaction(async (tx) => {
      // Clear snapshot before the status update so `.returning()` matches DB state.
      await this.clearReviewSnapshot(tx, id);

      const [updatedActivity] = await tx
        .update(activities)
        .set({
          activityStatusId: deletedStatus.id,
          lastUpdatedDateTime: new Date(),
          lastUpdatedBy: userId,
        })
        .where(eq(activities.id, id))
        .returning();

      await this.activityHistoryService.recordChange(
        id,
        userId,
        'soft_deleted',
        [
          {
            field: 'activityStatusId',
            oldValue: existing.activityStatusId,
            newValue: deletedStatus.id,
          },
        ],
        reason.trim(),
        tx
      );

      return updatedActivity;
    });

    if (!updated) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    // Fetch related data for the soft-deleted activity
    const related = await this.fetchRelatedForActivityIds([id], [updated]);
    const { namesMap: categoriesList, idsMap: categoryIdsList } =
      related.categoriesResult;

    return this.mapperService.mapToResponseDto(updated, {
      categories: categoriesList.get(id) ?? [],
      categoryIds: categoryIdsList.get(id) ?? [],
      tags: related.tagsMap.get(id) ?? [],
      activityStatus: related.activityStatusesMap.get(id),
      dateStatus: related.dateStatusesMap.get(id),
      timeStatus: related.timeStatusesMap.get(id),
      venueStatus: related.venueStatusesMap.get(id),
      venueAddress: related.venueAddressesMap.get(id) ?? null,
      commsMaterials: related.commsMaterialsMap.get(id) ?? [],
      translationsRequired: related.translationsRequiredMap.get(id) ?? [],
      representativesAttending:
        related.representativesAttendingMap.get(id) ?? [],
      sharedWith: related.sharedWithMap.get(id) ?? [],
      commsContacts: related.commsContactsMap.get(id) ?? [],
      eventPlannerDetails: related.eventPlannerDetailsMap.get(id) ?? [],
      eventPlanners: related.eventPlannersMap.get(id) ?? [],
      eventPlannerLeadIds: related.eventPlannerIdsMap.get(id) ?? [],
      leadOrgName: related.leadOrgNamesMap.get(id) ?? null,
      newsReleaseOrigin: related.newsReleaseOriginsMap.get(id) ?? null,
      newsReleaseDistribution:
        related.newsReleaseDistributionsMap.get(id) ?? null,
      premierRequested: related.premierRequestedMap.get(id) ?? null,
      reportSettings: related.reportSettingsMap.get(id) ?? [],
      pitchRequiredStatus: related.pitchRequiredStatusMap.get(id) ?? null,
      translationsRequiredStatus:
        related.translationsRequiredStatusMap.get(id) ?? null,
      leadMinistry: related.leadMinistryNamesMap.get(id) ?? null,
      leadMinistryAbbreviation:
        related.leadMinistryAbbreviationsMap.get(id) ?? null,
      leadTeamDisplayName: related.leadTeamDisplayMap.get(id) ?? null,
    });
  }

  /**
   * Request delete (comms contacts only). Sets activity status to delete_requested.
   * Allowed only when current status is not already delete_requested or deleted.
   * Authorization (comms contact) is enforced by guard.
   */
  async requestDelete(
    id: number,
    reason: string,
    userId: number
  ): Promise<ActivityResponse> {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException(
        'A reason is required when requesting delete'
      );
    }

    const [existing] = await this.databaseService.db
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    const currentStatusName = await this.getActivityStatusNameById(
      existing.activityStatusId
    );
    if (
      currentStatusName === 'delete_requested' ||
      currentStatusName === 'deleted'
    ) {
      throw new ConflictException(
        `Activity cannot be set to delete requested when status is already '${currentStatusName}'.`
      );
    }

    const [deleteRequestedStatus] = await this.databaseService.db
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(
        eq(
          activityStatuses.name,
          'delete_requested' satisfies ActivityStatusName
        )
      )
      .limit(1);

    if (!deleteRequestedStatus) {
      throw new BadRequestException(
        'Delete requested activity status not found in database'
      );
    }

    const updated = await this.databaseService.db.transaction(async (tx) => {
      const [updatedActivity] = await tx
        .update(activities)
        .set({
          activityStatusId: deleteRequestedStatus.id,
          lastUpdatedDateTime: new Date(),
          lastUpdatedBy: userId,
        })
        .where(eq(activities.id, id))
        .returning();

      await this.activityHistoryService.recordChange(
        id,
        userId,
        'delete_requested',
        [
          {
            field: 'activityStatusId',
            oldValue: existing.activityStatusId,
            newValue: deleteRequestedStatus.id,
          },
        ],
        reason.trim(),
        tx
      );

      return updatedActivity;
    });

    if (!updated) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    const related = await this.fetchRelatedForActivityIds([id], [updated]);
    const { namesMap: categoriesList, idsMap: categoryIdsList } =
      related.categoriesResult;

    return this.mapperService.mapToResponseDto(updated, {
      categories: categoriesList.get(id) ?? [],
      categoryIds: categoryIdsList.get(id) ?? [],
      tags: related.tagsMap.get(id) ?? [],
      activityStatus: related.activityStatusesMap.get(id),
      dateStatus: related.dateStatusesMap.get(id),
      timeStatus: related.timeStatusesMap.get(id),
      venueStatus: related.venueStatusesMap.get(id),
      venueAddress: related.venueAddressesMap.get(id) ?? null,
      commsMaterials: related.commsMaterialsMap.get(id) ?? [],
      translationsRequired: related.translationsRequiredMap.get(id) ?? [],
      representativesAttending:
        related.representativesAttendingMap.get(id) ?? [],
      sharedWith: related.sharedWithMap.get(id) ?? [],
      commsContacts: related.commsContactsMap.get(id) ?? [],
      eventPlannerDetails: related.eventPlannerDetailsMap.get(id) ?? [],
      eventPlanners: related.eventPlannersMap.get(id) ?? [],
      eventPlannerLeadIds: related.eventPlannerIdsMap.get(id) ?? [],
      leadOrgName: related.leadOrgNamesMap.get(id) ?? null,
      newsReleaseOrigin: related.newsReleaseOriginsMap.get(id) ?? null,
      newsReleaseDistribution:
        related.newsReleaseDistributionsMap.get(id) ?? null,
      premierRequested: related.premierRequestedMap.get(id) ?? null,
      reportSettings: related.reportSettingsMap.get(id) ?? [],
      pitchRequiredStatus: related.pitchRequiredStatusMap.get(id) ?? null,
      translationsRequiredStatus:
        related.translationsRequiredStatusMap.get(id) ?? null,
      leadMinistry: related.leadMinistryNamesMap.get(id) ?? null,
      leadMinistryAbbreviation:
        related.leadMinistryAbbreviationsMap.get(id) ?? null,
      leadTeamDisplayName: related.leadTeamDisplayMap.get(id) ?? null,
    });
  }

  /**
   * Restore activity from delete_requested or deleted to the previous status.
   * Allowed only when current status is delete_requested or deleted.
   * Authorization (comms contact or admin/sysAdmin) is enforced by guard.
   */
  async restore(
    id: number,
    userId: number,
    note: string | undefined,
    _context?: { roleName: string }
  ): Promise<ActivityResponse> {
    const [existing] = await this.databaseService.db
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    const currentStatusName = await this.getActivityStatusNameById(
      existing.activityStatusId
    );
    this.logger.debug(
      `Restore activity ${id}: current status="${currentStatusName ?? 'null'}"`
    );
    if (
      currentStatusName !== 'delete_requested' &&
      currentStatusName !== 'deleted'
    ) {
      throw new BadRequestException(
        `Activity can only be restored when status is delete_requested or deleted (current: ${currentStatusName}).`
      );
    }

    const previousStatusId =
      (await this.activityHistoryService.getPreviousStatusIdBeforeDelete(id)) ??
      (await this.getActivityStatusIdByName('changed'));

    const updated = await this.databaseService.db.transaction(async (tx) => {
      const [updatedActivity] = await tx
        .update(activities)
        .set({
          activityStatusId: previousStatusId,
          lastUpdatedDateTime: new Date(),
          lastUpdatedBy: userId,
        })
        .where(eq(activities.id, id))
        .returning();

      await this.activityHistoryService.recordChange(
        id,
        userId,
        'restored',
        [
          {
            field: 'activityStatusId',
            oldValue: existing.activityStatusId,
            newValue: previousStatusId,
          },
        ],
        note?.trim() || 'Activity restored',
        tx
      );

      return updatedActivity;
    });

    if (!updated) {
      throw new NotFoundException(`Activity with id ${id} not found`);
    }

    const newStatusName = await this.getActivityStatusNameById(
      updated.activityStatusId
    );
    this.logger.log(
      `Activity ${id} restore committed: status "${currentStatusName}" -> "${newStatusName ?? 'unknown'}"`
    );

    const related = await this.fetchRelatedForActivityIds([id], [updated]);
    const { namesMap: categoriesList, idsMap: categoryIdsList } =
      related.categoriesResult;

    return this.mapperService.mapToResponseDto(updated, {
      categories: categoriesList.get(id) ?? [],
      categoryIds: categoryIdsList.get(id) ?? [],
      tags: related.tagsMap.get(id) ?? [],
      activityStatus: related.activityStatusesMap.get(id),
      dateStatus: related.dateStatusesMap.get(id),
      timeStatus: related.timeStatusesMap.get(id),
      venueStatus: related.venueStatusesMap.get(id),
      venueAddress: related.venueAddressesMap.get(id) ?? null,
      commsMaterials: related.commsMaterialsMap.get(id) ?? [],
      translationsRequired: related.translationsRequiredMap.get(id) ?? [],
      representativesAttending:
        related.representativesAttendingMap.get(id) ?? [],
      sharedWith: related.sharedWithMap.get(id) ?? [],
      commsContacts: related.commsContactsMap.get(id) ?? [],
      eventPlannerDetails: related.eventPlannerDetailsMap.get(id) ?? [],
      eventPlanners: related.eventPlannersMap.get(id) ?? [],
      eventPlannerLeadIds: related.eventPlannerIdsMap.get(id) ?? [],
      leadOrgName: related.leadOrgNamesMap.get(id) ?? null,
      newsReleaseOrigin: related.newsReleaseOriginsMap.get(id) ?? null,
      newsReleaseDistribution:
        related.newsReleaseDistributionsMap.get(id) ?? null,
      premierRequested: related.premierRequestedMap.get(id) ?? null,
      reportSettings: related.reportSettingsMap.get(id) ?? [],
      pitchRequiredStatus: related.pitchRequiredStatusMap.get(id) ?? null,
      translationsRequiredStatus:
        related.translationsRequiredStatusMap.get(id) ?? null,
      leadMinistry: related.leadMinistryNamesMap.get(id) ?? null,
      leadMinistryAbbreviation:
        related.leadMinistryAbbreviationsMap.get(id) ?? null,
      leadTeamDisplayName: related.leadTeamDisplayMap.get(id) ?? null,
    });
  }

  /**
   * Fetch categories available to the user based on their team memberships
   * @param userTeams - Optional array of team IDs the user belongs to
   * @returns Categories that are either global or team-scoped for the user's teams
   */
  public async fetchCategories(userTeams?: number[]): Promise<Category[]> {
    const ids = await getVisibleCategoryIds(this.databaseService.db, userTeams);
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.databaseService.db
      .select()
      .from(categories)
      .where(and(eq(categories.isActive, true), inArray(categories.id, ids)))
      .orderBy(categories.name);
    return rows;
  }

  /**
   * Update activity categories
   */
  async updateCategories(
    id: number,
    categoryIds: number[],
    userId: number
  ): Promise<ActivityResponse> {
    // Verify activity exists
    await this.findOne(id);

    if (categoryIds.length === 0) {
      throw new BadRequestException('At least one category is required.');
    }
    await this.utilsService.validateCategoryIds(categoryIds);

    const now = new Date();

    // Get existing category IDs for history
    const existingCategories = await this.databaseService.db
      .select({ categoryId: activityCategories.categoryId })
      .from(activityCategories)
      .where(eq(activityCategories.activityId, id));
    const existingCategoryIds = existingCategories.map((c) => c.categoryId);

    await this.databaseService.db.transaction(async (tx) => {
      await this.junctionService.updateJunctionRecords(
        tx,
        activityCategories,
        id,
        categoryIds,
        (id: number) => ({ categoryId: id }),
        'categoryId',
        userId,
        now
      );
    });

    // Record change in history only if categories actually changed
    if (!isDeepEqual(existingCategoryIds, categoryIds)) {
      await this.activityHistoryService.recordChange(
        id,
        userId,
        'updated',
        [
          {
            field: 'categories',
            oldValue: existingCategoryIds,
            newValue: categoryIds,
          },
        ],
        'Activity categories updated'
      );
    }

    // Return updated activity
    return this.findOne(id);
  }

  /**
   * Update activity themes
   */
  async updateThemes(
    id: number,
    themeIds: number[],
    userId: number
  ): Promise<ActivityResponse> {
    // Verify activity exists
    await this.findOne(id);

    const now = new Date();

    // Capture existing themes for history
    const existingThemes = await this.databaseService.db
      .select({ themeId: activityThemes.themeId })
      .from(activityThemes)
      .where(eq(activityThemes.activityId, id));
    const existingThemeIds = existingThemes.map((t) => t.themeId);

    await this.databaseService.db.transaction(async (tx) => {
      await this.junctionService.updateJunctionRecords(
        tx,
        activityThemes,
        id,
        themeIds,
        (id: number) => ({ themeId: id }),
        'themeId',
        userId,
        now
      );
    });

    // Record change in history only if themes actually changed
    if (!isDeepEqual(existingThemeIds, themeIds)) {
      await this.activityHistoryService.recordChange(
        id,
        userId,
        'updated',
        [{ field: 'themes', oldValue: existingThemeIds, newValue: themeIds }],
        'Activity themes updated'
      );
    }

    // Return updated activity
    return this.findOne(id);
  }

  /**
   * Update activity tags
   * Tags now use string IDs (converted from integer IDs)
   */
  async updateTags(
    id: number,
    tagIds: number[],
    userId: number
  ): Promise<ActivityResponse> {
    // Verify activity exists
    await this.findOne(id);

    const now = new Date();

    // Capture existing tags for history
    const existingTags = await this.databaseService.db
      .select({ tagId: activityTags.tagId })
      .from(activityTags)
      .where(eq(activityTags.activityId, id));
    const existingTagIds = existingTags.map((t) => t.tagId);

    await this.databaseService.db.transaction(async (tx) => {
      await this.junctionService.updateJunctionRecords(
        tx,
        activityTags,
        id,
        tagIds,
        (id: number) => ({ tagId: id }),
        'tagId',
        userId,
        now
      );
    });

    // Record change in history only if tags actually changed
    if (!isDeepEqual(existingTagIds, tagIds)) {
      await this.activityHistoryService.recordChange(
        id,
        userId,
        'updated',
        [{ field: 'tags', oldValue: existingTagIds, newValue: tagIds }],
        'Activity tags updated'
      );
    }

    // Return updated activity
    return this.findOne(id);
  }

  /**
   * Update activity shared with teams
   */
  async updateSharedWith(
    id: number,
    teamIds: number[],
    userId: number
  ): Promise<ActivityResponse> {
    // Verify activity exists
    await this.findOne(id);

    const now = new Date();

    // Capture existing shared-with teams for history
    const existingShared = await this.databaseService.db
      .select({ teamId: activitySharedWithTeams.teamId })
      .from(activitySharedWithTeams)
      .where(eq(activitySharedWithTeams.activityId, id));
    const existingTeamIds = existingShared.map((s) => s.teamId);

    await this.databaseService.db.transaction(async (tx) => {
      await this.junctionService.updateJunctionRecords(
        tx,
        activitySharedWithTeams,
        id,
        teamIds,
        (id: number) => ({ teamId: id }),
        'teamId',
        userId,
        now
      );
    });

    // Record change in history only if shared-with teams actually changed
    if (!isDeepEqual(existingTeamIds, teamIds)) {
      await this.activityHistoryService.recordChange(
        id,
        userId,
        'updated',
        [{ field: 'sharedWith', oldValue: existingTeamIds, newValue: teamIds }],
        'Activity shared with teams updated'
      );
    }

    // Return updated activity
    return this.findOne(id);
  }
}
