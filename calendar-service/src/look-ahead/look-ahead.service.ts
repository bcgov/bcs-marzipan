import { Injectable, NotFoundException } from '@nestjs/common';

import { LOOK_AHEAD_SECTION, type LookAheadSection } from '@corpcal/shared';
import type { ActivityResponse, ReportResponse } from '@corpcal/shared/api';
import type { FilterActivitiesQueryParams } from '@corpcal/shared/schemas';

import { ActivitiesService } from '../activities/services/activities.service';
import { ReportsService } from '../reports/reports.service';

const SECTION_DISPLAY_NAMES: Record<LookAheadSection, string> = {
  events: 'Events, Speeches & Releases',
  issues: 'Issues and Reports',
  news: 'Outside Government',
  awareness: 'Awareness Dates',
};

export interface LookAheadSectionData {
  id: LookAheadSection;
  name: string;
  order: number;
  activities: ActivityResponse[];
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
   * Excludes activities omitted from the report and confidential activities.
   */
  async getLookAheadData(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<LookAheadResponse> {
    const report = await this.reportsService.findReportByName('look-ahead');
    if (!report) {
      throw new NotFoundException('Look Ahead report not found');
    }

    const omittedActivityIds = await this.getOmittedActivityIds(report.id);
    const sections: LookAheadSectionData[] = [];
    const sectionOrder = LOOK_AHEAD_SECTION;

    for (let i = 0; i < sectionOrder.length; i++) {
      const sectionId = sectionOrder[i];
      const filters: FilterActivitiesQueryParams = {
        lookAheadSection: sectionId,
        page: 1,
        limit: 500,
        sharedWithTeamIds: undefined,
        includeCompleted: undefined,
        includeDeleted: undefined,
      };
      if (options?.startDate) {
        filters.startDateFrom = options.startDate;
      }
      if (options?.endDate) {
        filters.startDateTo = options.endDate;
      }

      const activities = await this.activitiesService.findAll(filters);
      const filtered = activities.filter(
        (a) => !omittedActivityIds.has(a.id) && !a.isConfidential
      );

      sections.push({
        id: sectionId,
        name: SECTION_DISPLAY_NAMES[sectionId],
        order: i + 1,
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
