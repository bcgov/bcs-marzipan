import { Injectable, NotFoundException } from '@nestjs/common';

import { HYDRATION_PROFILES } from '@corpcal/shared';
import type { ActivityListItem, ReportResponse } from '@corpcal/shared/api';
import {
  LOOK_AHEAD_REPORT_NAME,
  resolveLookAheadSectionRows,
} from '@corpcal/shared/reports/look-ahead';
import type { FilterActivitiesQueryParams } from '@corpcal/shared/schemas';

import { ActivitiesService } from '../activities/services/activities.service';
import { ReportsService } from '../reports/reports.service';

export interface LookAheadSectionData {
  /** Stable section id from `reports.config.sections[].id`. */
  id: string;
  /** Display name (defaults to `reportDisplayName` from config, falling back to `name`). */
  name: string;
  order: number;
  activities: ActivityListItem[];
}

export interface LookAheadResponse {
  report: ReportResponse | null;
  sections: LookAheadSectionData[];
}

@Injectable()
export class LookAheadService {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly activitiesService: ActivitiesService
  ) {}

  /**
   * Get Look Ahead report data: report config and activities grouped by section.
   * Excludes activities omitted from the report.
   *
   * Sections (id, label, lookAhead key, order) come from
   * `reports.config.sections` via the shared resolver — keeping section
   * identity in lockstep with the activity form, table filter, and PDF cover.
   */
  async getLookAheadData(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<LookAheadResponse> {
    const report = await this.reportsService.findReportByName(
      LOOK_AHEAD_REPORT_NAME
    );
    if (!report) {
      throw new NotFoundException('Look Ahead report not found');
    }
    if (!report.config) {
      throw new NotFoundException(
        `Look Ahead report has no config; cannot resolve sections.`
      );
    }

    const omittedActivityIds = await this.getOmittedActivityIds(report.id);
    const sectionRows = resolveLookAheadSectionRows(report.config, {
      requireLookAheadKey: true,
    });
    const sections: LookAheadSectionData[] = [];

    for (const row of sectionRows) {
      // `requireLookAheadKey: true` guarantees a non-null key, but narrow for TS.
      if (row.lookAheadKey === null) continue;
      const filters: FilterActivitiesQueryParams = {
        lookAheadSectionValues: [row.lookAheadKey],
        page: 1,
        limit: 500,
      };
      if (options?.startDate) {
        filters.startDateFrom = options.startDate;
      }
      if (options?.endDate) {
        filters.startDateTo = options.endDate;
      }

      const activities = await this.activitiesService.findAll(
        filters,
        undefined,
        {
          profile: HYDRATION_PROFILES.list,
          outputShape: 'list',
        }
      );
      const filtered = activities.filter((a) => !omittedActivityIds.has(a.id));

      sections.push({
        id: row.sectionId,
        name: row.reportLegendLabel,
        order: row.order,
        activities: filtered,
      });
    }

    return { report, sections };
  }

  private async getOmittedActivityIds(reportId: number): Promise<Set<number>> {
    const reportActivities = await this.reportsService.getActivitiesForReport(
      reportId,
      { includeOmitted: true }
    );
    const omitted = reportActivities
      .filter((r) => r.omitted)
      .map((r) => r.activityId);
    return new Set(omitted);
  }
}
