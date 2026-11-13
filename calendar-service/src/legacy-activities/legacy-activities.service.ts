import { Injectable } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';

import { schema } from '@corpcal/database';

import { DatabaseService } from '../database/database.service';

const { legacyActivities } = schema;

export type LegacyActivityListQuery = {
  search?: string;
  status?: string;
  archived?: boolean | string;
  sourceSystem?: string;
  limit?: number | string;
  offset?: number | string;
};

export type LegacyActivityListRow = {
  id: number;
  sourceSystem: string;
  sourceTable: string;
  sourceRecordId: string;
  title: string | null;
  summary: string | null;
  startDate: string | null;
  endDate: string | null;
  statusName: string | null;
  lookAheadStatus: string | null;
  leadOrgName: string | null;
  ministryName: string | null;
  locationName: string | null;
  importedAt: Date | string | null;
  isArchived: boolean;
};

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
        sourceSystem: legacyActivities.sourceSystem,
        sourceTable: legacyActivities.sourceTable,
        sourceRecordId: legacyActivities.sourceRecordId,
        title: legacyActivities.title,
        summary: legacyActivities.summary,
        startDate: legacyActivities.startDate,
        endDate: legacyActivities.endDate,
        statusName: legacyActivities.statusName,
        lookAheadStatus: legacyActivities.lookAheadStatus,
        leadOrgName: legacyActivities.leadOrgName,
        ministryName: legacyActivities.ministryName,
        locationName: legacyActivities.locationName,
        importedAt: legacyActivities.importedAt,
        isArchived: legacyActivities.isArchived,
      })
      .from(legacyActivities)
      .orderBy(desc(legacyActivities.importedAt), desc(legacyActivities.id));

    const searchValue =
      typeof query.search === 'string' ? query.search.trim() : '';
    const hasSearch = searchValue.length > 0;

    if (hasSearch) {
      const searchTerm = `%${searchValue.toLowerCase()}%`;
      baseQuery.where(
        sql`lower(${legacyActivities.searchableText}) LIKE ${searchTerm}`
      );
    }

    if (typeof query.archived === 'boolean') {
      baseQuery.where(eq(legacyActivities.isArchived, query.archived));
    } else if (typeof query.archived === 'string') {
      const archivedValue = query.archived.toLowerCase() === 'true';
      baseQuery.where(eq(legacyActivities.isArchived, archivedValue));
    }

    if (query.status) {
      baseQuery.where(eq(legacyActivities.statusName, query.status));
    }

    if (query.sourceSystem) {
      baseQuery.where(eq(legacyActivities.sourceSystem, query.sourceSystem));
    }

    const rows = await baseQuery
      .limit(normalizedLimit)
      .offset(normalizedOffset);

    return rows;
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
