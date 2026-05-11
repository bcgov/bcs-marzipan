import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { reports } from '@corpcal/database/schema';
import type { Visibility } from '@corpcal/shared';
import type { ReportResponse } from '@corpcal/shared/api';
import {
  allowedLookAheadSectionKeysFromReports,
  isAllowedLookAheadSectionKey,
  LOOK_AHEAD_SOURCE_REPORT_NAMES,
} from '@corpcal/shared/reports/look-ahead';
import { reportConfigSchema } from '@corpcal/shared/schemas';

import { DatabaseService } from '../database/database.service';

/**
 * Read-only policy service for the look-ahead "system report" feature.
 *
 * Single place that:
 *  - reads the canonical look-ahead report configs (`look-ahead`, `exec`)
 *  - hands callers a fresh allowlist of valid `activity.lookAheadSection` values
 *
 * Lives in its own tiny module so both `ActivitiesService` (write-time validation)
 * and `ReportsService` (PDF cover, etc.) can depend on it without forming a
 * dependency cycle through `ReportsService` <-> `ActivitiesService`.
 */
@Injectable()
export class LookAheadPolicyService {
  private readonly logger = new Logger(LookAheadPolicyService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Load the active source-of-truth look-ahead reports (with parsed config).
   * Returns reports in the order declared by `LOOK_AHEAD_SOURCE_REPORT_NAMES`
   * so the primary look-ahead report defines canonical key ordering.
   */
  async getSourceLookAheadReports(): Promise<ReportResponse[]> {
    const rows = await this.databaseService.db
      .select()
      .from(reports)
      .where(
        and(
          eq(reports.isActive, true),
          inArray(reports.name, [...LOOK_AHEAD_SOURCE_REPORT_NAMES])
        )
      );

    const byName = new Map<string, (typeof rows)[number]>();
    for (const row of rows) byName.set(row.name, row);

    const ordered: ReportResponse[] = [];
    for (const name of LOOK_AHEAD_SOURCE_REPORT_NAMES) {
      const row = byName.get(name);
      if (!row) continue;
      let config = null;
      if (row.config) {
        const parsed = reportConfigSchema.safeParse(row.config);
        if (parsed.success) {
          config = parsed.data;
        } else {
          this.logger.warn(
            `Invalid report config for report ${row.id} (${row.name}): ${parsed.error.message}`
          );
        }
      }
      ordered.push({
        id: row.id,
        name: row.name,
        displayName: row.displayName,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
        visibility:
          (row.visibility as Visibility) ?? ('team' satisfies Visibility),
        config,
        description: row.description,
      });
    }
    return ordered;
  }

  /**
   * Allowed `activity.lookAheadSection` values, derived from source-of-truth
   * report configs. Empty array when no source reports are configured.
   */
  async getAllowedLookAheadSectionKeys(): Promise<string[]> {
    const sourceReports = await this.getSourceLookAheadReports();
    return allowedLookAheadSectionKeysFromReports(sourceReports);
  }

  /**
   * Validate a candidate `activity.lookAheadSection` value against the current
   * allowlist. `null` / `undefined` are always valid (the field is optional).
   */
  async assertAllowedLookAheadSection(
    value: string | null | undefined
  ): Promise<void> {
    if (value === null || value === undefined) return;
    const allowed = await this.getAllowedLookAheadSectionKeys();
    if (!isAllowedLookAheadSectionKey(allowed, value)) {
      throw new BadRequestException(
        `lookAheadSection '${value}' is not configured for any look-ahead source report (${LOOK_AHEAD_SOURCE_REPORT_NAMES.join(', ')}).`
      );
    }
  }
}
