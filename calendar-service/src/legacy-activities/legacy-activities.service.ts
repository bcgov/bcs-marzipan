import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm';

import { schema } from '@corpcal/database';

import { DatabaseService } from '../database/database.service';

const { legacyActivities, activityStatuses } = schema;

export type LegacyActivityListQuery = {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number | string;
  offset?: number | string;
};

export type LegacyActivityListRow = {
  id: number;
  displayId: string;
  title: string | null;
  summary: string | null;
  startDate: string | null;
  endDate: string | null;
  activityStatusId: number;
  activityStatus: string;
  lookAheadStatus: string | null;
  leadOrgName: string | null;
  ministryName: string | null;
  locationName: string | null;
  createdDateTime: Date | string | null;
  importedAt: Date | string | null;
};

export type LegacyActivityDetails = LegacyActivityListRow & {
  overview: {
    category: string[];
    confidential: boolean | null;
    issue: boolean | null;
    tags: string[];
    significance: string | null;
    notes?: string | null;
  };
  lookAhead?: {
    executiveSummary: string | null;
  };
  comms: {
    materials: string[];
    newsReleaseOrigin: string | null;
    newsReleaseDistribution: string | null;
    translations: string[];
  };
  event: {
    premierStatus: string | null;
    governmentRepresentatives: string[];
    eventPlanners: string[];
    venueCity: string | null;
  };
};

function readLegacyText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readLegacyBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function readLegacyTextList(value: unknown): string[] {
  if (typeof value === 'string') {
    const text = readLegacyText(value);
    return text ? [text] : [];
  }
  if (!Array.isArray(value)) return [];
  return value
    .map(readLegacyText)
    .filter((text): text is string => text !== null);
}

@Injectable()
export class LegacyActivitiesService {
  constructor(private readonly db: DatabaseService) {}

  async list(
    query: LegacyActivityListQuery = {}
  ): Promise<LegacyActivityListRow[]> {
    const normalizedLimit = this.normalizeNumber(query.limit, 25, 1, 100);
    const normalizedOffset = this.normalizeNumber(query.offset, 0, 0, 10_000);

    const baseQuery = this.db.db
      .select({
        id: legacyActivities.id,
        displayId: legacyActivities.displayId,
        title: legacyActivities.title,
        summary: legacyActivities.summary,
        startDate: legacyActivities.startDate,
        endDate: legacyActivities.endDate,
        activityStatusId: legacyActivities.activityStatusId,
        activityStatus: activityStatuses.displayName,
        lookAheadStatus: legacyActivities.lookAheadStatus,
        leadOrgName: legacyActivities.leadOrgName,
        ministryName: legacyActivities.ministryName,
        locationName: legacyActivities.locationName,
        createdDateTime: legacyActivities.createdDateTime,
        importedAt: legacyActivities.importedAt,
      })
      .from(legacyActivities)
      .innerJoin(
        activityStatuses,
        eq(legacyActivities.activityStatusId, activityStatuses.id)
      )
      .orderBy(desc(legacyActivities.importedAt), desc(legacyActivities.id));
    const predicates = [];

    const searchValue =
      typeof query.search === 'string' ? query.search.trim() : '';
    const hasSearch = searchValue.length > 0;

    if (hasSearch) {
      const searchTerm = `%${searchValue.toLowerCase()}%`;
      predicates.push(
        or(
          sql`lower(${legacyActivities.searchableText}) LIKE ${searchTerm}`,
          sql`lower(${legacyActivities.displayId}) LIKE ${searchTerm}`
        )
      );
    }

    if (query.status) {
      predicates.push(eq(activityStatuses.name, query.status));
    }

    if (query.startDate) {
      predicates.push(
        or(
          isNull(legacyActivities.endDate),
          gte(legacyActivities.endDate, query.startDate)
        )
      );
    }

    if (query.endDate) {
      predicates.push(lte(legacyActivities.startDate, query.endDate));
    }

    if (predicates.length > 0) {
      baseQuery.where(and(...predicates));
    }

    const rows = await baseQuery
      .limit(normalizedLimit)
      .offset(normalizedOffset);

    return rows;
  }

  async getById(
    id: number,
    canViewNotes = false,
    canViewLookAhead = false
  ): Promise<LegacyActivityDetails | null> {
    const rows = await this.db.db
      .select({
        id: legacyActivities.id,
        displayId: legacyActivities.displayId,
        title: legacyActivities.title,
        summary: legacyActivities.summary,
        startDate: legacyActivities.startDate,
        endDate: legacyActivities.endDate,
        activityStatusId: legacyActivities.activityStatusId,
        activityStatus: activityStatuses.displayName,
        lookAheadStatus: legacyActivities.lookAheadStatus,
        leadOrgName: legacyActivities.leadOrgName,
        ministryName: legacyActivities.ministryName,
        locationName: legacyActivities.locationName,
        createdDateTime: legacyActivities.createdDateTime,
        importedAt: legacyActivities.importedAt,
        rawRecord: legacyActivities.rawRecord,
      })
      .from(legacyActivities)
      .innerJoin(
        activityStatuses,
        eq(legacyActivities.activityStatusId, activityStatuses.id)
      )
      .where(eq(legacyActivities.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    const { rawRecord, ...activity } = row;
    const raw =
      rawRecord && typeof rawRecord === 'object' && !Array.isArray(rawRecord)
        ? (rawRecord as Record<string, unknown>)
        : {};

    return {
      ...activity,
      lookAheadStatus: canViewLookAhead ? activity.lookAheadStatus : null,
      overview: {
        category: readLegacyTextList(raw.category ?? raw.categories),
        confidential: readLegacyBoolean(
          raw.confidential ?? raw.isConfidential ?? raw.is_confidential
        ),
        issue: readLegacyBoolean(raw.issue ?? raw.isIssue ?? raw.is_issue),
        tags: readLegacyTextList(raw.tags),
        significance: readLegacyText(raw.significance),
        ...(canViewNotes ? { notes: readLegacyText(raw.notes) } : {}),
      },
      comms: {
        materials: readLegacyTextList(raw.commsMaterials),
        newsReleaseOrigin: readLegacyText(raw.newsReleaseOrigin),
        newsReleaseDistribution: readLegacyText(raw.newsReleaseDistribution),
        translations: readLegacyTextList(raw.translations),
      },
      event: {
        premierStatus: readLegacyText(raw.premierStatus),
        governmentRepresentatives: readLegacyTextList(
          raw.governmentRepresentatives
        ),
        eventPlanners: readLegacyTextList(raw.eventPlanners),
        venueCity: readLegacyText(raw.venueCity) ?? activity.locationName,
      },
      ...(canViewLookAhead
        ? {
            lookAhead: {
              executiveSummary: readLegacyText(
                raw.executiveSummary ?? raw.executive_summary ?? raw.hqComments
              ),
            },
          }
        : {}),
    };
  }

  private normalizeNumber(
    value: number | string | undefined,
    fallback: number,
    min: number,
    max: number
  ): number {
    const parsed = Number(value ?? fallback);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(Math.max(parsed, min), max);
  }
}
