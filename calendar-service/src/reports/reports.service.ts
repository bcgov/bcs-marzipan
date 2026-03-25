import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { activityReportSettings, reports } from '@corpcal/database/schema';
import type { Visibility } from '@corpcal/shared';
import type {
  ActivityResponse,
  ReportResponse,
} from '@corpcal/shared/api/types';
import {
  mergeReportFilters,
  reportConfigSchema,
  type FilterActivitiesQueryParams,
} from '@corpcal/shared/schemas';

import { ActivitiesService } from '../activities/services/activities.service';
import { DatabaseService } from '../database/database.service';

export interface ReportSettingsDto {
  reportId: number;
  reportName: string;
  reportDisplayName: string;
  omitted: boolean;
}

export interface ActivityReportInfo {
  activityId: number;
  omitted: boolean;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly activitiesService: ActivitiesService
  ) {}

  /**
   * Get all active reports
   * @returns List of all active reports
   */
  async findAllReports(): Promise<ReportResponse[]> {
    const results = await this.databaseService.db
      .select()
      .from(reports)
      .where(eq(reports.isActive, true))
      .orderBy(reports.sortOrder, reports.displayName);

    return results.map((report) => {
      // Validate and parse config JSONB field
      let config = null;
      if (report.config) {
        const configResult = reportConfigSchema.safeParse(report.config);
        if (configResult.success) {
          config = configResult.data;
        } else {
          // Log validation error but don't fail the request
          this.logger.warn(
            `Invalid report config for report ${report.id}: ${configResult.error.message}`
          );
        }
      }

      return {
        id: report.id,
        name: report.name,
        displayName: report.displayName,
        sortOrder: report.sortOrder,
        isActive: report.isActive,
        visibility:
          (report.visibility as Visibility) ?? ('team' satisfies Visibility),
        config,
        description: report.description,
      };
    });
  }

  /**
   * Get a report by ID
   * @param reportId - The report ID
   * @returns Report details or null if not found
   */
  async findReportById(reportId: number): Promise<ReportResponse | null> {
    const [result] = await this.databaseService.db
      .select()
      .from(reports)
      .where(and(eq(reports.id, reportId), eq(reports.isActive, true)))
      .limit(1);

    if (!result) {
      return null;
    }

    // Validate and parse config JSONB field
    let config = null;
    if (result.config) {
      const configResult = reportConfigSchema.safeParse(result.config);
      if (configResult.success) {
        config = configResult.data;
      } else {
        // Log validation error but don't fail the request
        this.logger.warn(
          `Invalid report config for report ${result.id}: ${configResult.error.message}`
        );
      }
    }

    return {
      id: result.id,
      name: result.name,
      displayName: result.displayName,
      sortOrder: result.sortOrder,
      isActive: result.isActive,
      visibility:
        (result.visibility as Visibility) ?? ('team' satisfies Visibility),
      config,
      description: result.description,
    };
  }

  /**
   * Get a report by name
   * @param reportName - The report name (e.g., 'look-ahead')
   * @returns Report details or null if not found
   */
  async findReportByName(reportName: string): Promise<ReportResponse | null> {
    const [result] = await this.databaseService.db
      .select()
      .from(reports)
      .where(and(eq(reports.name, reportName), eq(reports.isActive, true)))
      .limit(1);

    if (!result) {
      return null;
    }

    // Validate and parse config JSONB field
    let config = null;
    if (result.config) {
      const configResult = reportConfigSchema.safeParse(result.config);
      if (configResult.success) {
        config = configResult.data;
      } else {
        // Log validation error but don't fail the request
        this.logger.warn(
          `Invalid report config for report ${result.id}: ${configResult.error.message}`
        );
      }
    }

    return {
      id: result.id,
      name: result.name,
      displayName: result.displayName,
      sortOrder: result.sortOrder,
      isActive: result.isActive,
      visibility:
        (result.visibility as Visibility) ?? ('team' satisfies Visibility),
      config,
      description: result.description,
    };
  }

  /**
   * Get whether an activity is omitted from a report
   * @param activityId - The activity ID
   * @param reportId - The report ID
   * @returns True if omitted, false if included
   */
  async isActivityOmittedFromReport(
    activityId: number,
    reportId: number
  ): Promise<boolean> {
    const [result] = await this.databaseService.db
      .select()
      .from(activityReportSettings)
      .where(
        and(
          eq(activityReportSettings.activityId, activityId),
          eq(activityReportSettings.reportId, reportId)
        )
      )
      .limit(1);

    if (!result) {
      // If no row exists, default to not omitted
      return false;
    }

    return result.omitted;
  }

  /**
   * Get all report settings for an activity
   * @param activityId - The activity ID
   * @returns Array of report settings with omitted flags
   */
  async getActivityReportSettings(
    activityId: number
  ): Promise<ReportSettingsDto[]> {
    const results = await this.databaseService.db
      .select({
        reportId: reports.id,
        reportName: reports.name,
        reportDisplayName: reports.displayName,
        omitted: activityReportSettings.omitted,
      })
      .from(activityReportSettings)
      .innerJoin(reports, eq(activityReportSettings.reportId, reports.id))
      .where(
        and(
          eq(activityReportSettings.activityId, activityId),
          eq(reports.isActive, true)
        )
      )
      .orderBy(reports.sortOrder, reports.displayName);

    return results.map((row) => ({
      reportId: row.reportId,
      reportName: row.reportName,
      reportDisplayName: row.reportDisplayName,
      omitted: row.omitted,
    }));
  }

  /**
   * Check if an activity should be included in a report (not omitted)
   * @param activityId - The activity ID
   * @param reportId - The report ID
   * @returns True if the activity is included (not omitted), false if omitted
   */
  async isActivityIncludedInReport(
    activityId: number,
    reportId: number
  ): Promise<boolean> {
    const omitted = await this.isActivityOmittedFromReport(
      activityId,
      reportId
    );
    return !omitted;
  }

  /**
   * Check if an activity should be included in a report by name
   * @param activityId - The activity ID
   * @param reportName - The report name (e.g., 'look-ahead')
   * @returns True if the activity is included (not omitted), false if omitted
   */
  async isActivityIncludedInReportByName(
    activityId: number,
    reportName: string
  ): Promise<boolean> {
    const report = await this.findReportByName(reportName);
    if (!report) {
      return false;
    }

    return this.isActivityIncludedInReport(activityId, report.id);
  }

  /**
   * Get activities for a report with their omitted flags
   * Used for report generation
   * @param reportId - The report ID
   * @param options - Options for filtering
   * @returns Array of activities with their omitted flags
   */
  async getActivitiesForReport(
    reportId: number,
    options?: { includeOmitted?: boolean }
  ): Promise<ActivityReportInfo[]> {
    const conditions = [eq(activityReportSettings.reportId, reportId)];

    if (!options?.includeOmitted) {
      conditions.push(eq(activityReportSettings.omitted, false));
    }

    const results = await this.databaseService.db
      .select({
        activityId: activityReportSettings.activityId,
        omitted: activityReportSettings.omitted,
      })
      .from(activityReportSettings)
      .where(and(...conditions));

    return results.map((row) => ({
      activityId: row.activityId,
      omitted: row.omitted,
    }));
  }

  /**
   * Get all active report IDs
   * Used for creating default report settings when activities are created
   * @returns Array of active report IDs
   */
  async getActiveReportIds(): Promise<number[]> {
    const results = await this.databaseService.db
      .select({ id: reports.id })
      .from(reports)
      .where(eq(reports.isActive, true));

    return results.map((r) => r.id);
  }

  private async getOmittedActivityIds(reportId: number): Promise<Set<number>> {
    const reportActivities = await this.getActivitiesForReport(reportId, {
      includeOmitted: true,
    });
    const omitted = reportActivities
      .filter((r) => r.omitted)
      .map((r) => r.activityId);
    return new Set(omitted);
  }

  /**
   * Get report data for a specific report type
   * @param reportName - The report name (e.g., 'look-ahead', 'thirty-sixty-ninety')
   * @param options - Additional filter options
   * @returns Report data with sections and activities
   */
  async getReportData(
    reportName: string,
    options?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ReportDataResponse> {
    const report = await this.findReportByName(reportName);
    if (!report) {
      throw new NotFoundException(`Report '${reportName}' not found`);
    }

    if (!report.config) {
      throw new NotFoundException(
        `Report '${reportName}' has no configuration`
      );
    }

    const omittedActivityIds = await this.getOmittedActivityIds(report.id);
    const sections: ReportSectionData[] = [];

    for (const sectionConfig of report.config.sections) {
      // Merge global filter with section filter
      const mergedFilter = mergeReportFilters(
        report.config.globalFilter,
        sectionConfig.filter
      );

      // Special handling for 30/60/90 report
      if (report.name === 'thirty-sixty-ninety') {
        const today = new Date();
        const thirtyDays = new Date(today);
        thirtyDays.setDate(today.getDate() + 30);
        const sixtyDays = new Date(today);
        sixtyDays.setDate(today.getDate() + 60);
        const ninetyDays = new Date(today);
        ninetyDays.setDate(today.getDate() + 90);

        const sectionFilter = mergedFilter || {};

        if (sectionConfig.id === 'thirty') {
          sectionFilter.dateRange = {
            start: today.toISOString().split('T')[0],
            end: thirtyDays.toISOString().split('T')[0],
          };
        } else if (sectionConfig.id === 'sixty') {
          sectionFilter.dateRange = {
            start: thirtyDays.toISOString().split('T')[0],
            end: sixtyDays.toISOString().split('T')[0],
          };
        } else if (sectionConfig.id === 'ninety') {
          sectionFilter.dateRange = {
            start: sixtyDays.toISOString().split('T')[0],
            end: ninetyDays.toISOString().split('T')[0],
          };
        }
      }

      // Apply additional filters from options
      const filters: FilterActivitiesQueryParams = {
        page: 1,
        limit: 500,
        sharedWithTeamIds: undefined,
        includeCompleted: undefined,
        includeDeleted: undefined,
      };

      // Apply date filters
      if (mergedFilter?.dateRange) {
        filters.startDateFrom = mergedFilter.dateRange.start;
        filters.startDateTo = mergedFilter.dateRange.end;
      } else if (options?.startDate) {
        filters.startDateFrom = options.startDate;
      }
      if (options?.endDate && !mergedFilter?.dateRange) {
        filters.startDateTo = options.endDate;
      }

      // Apply status filters
      // TODO: Implement status filtering based on activity status names
      // if (mergedFilter?.status?.length || options?.status?.length) {
      //   // For now, we'll handle status filtering in the frontend or add it later
      //   // This would require mapping status names to IDs
      // }

      // Apply look-ahead section filter
      if (mergedFilter?.lookAheadSection) {
        filters.lookAheadSection = mergedFilter.lookAheadSection as any;
      }

      const activities = await this.activitiesService.findAll(filters);
      const filtered = activities.filter(
        (a) => !omittedActivityIds.has(a.id) && !a.isConfidential
      );

      sections.push({
        id: sectionConfig.id,
        name: sectionConfig.name,
        order: sectionConfig.order,
        activities: filtered,
      });
    }

    return { report, sections };
  }

  /**
   * Generate CSV content for a report
   * @param data - Report data
   * @returns CSV string
   */
  generateReportCsv(data: ReportDataResponse): string {
    const rows: string[] = [];

    // Add header
    rows.push('Section,Date,Time,Status,Activity Details,Ref #,MIN');

    for (const section of data.sections) {
      for (const activity of section.activities) {
        const date = activity.startDate
          ? new Date(activity.startDate).toLocaleDateString('en-CA')
          : '';
        const time = activity.startTime || '';
        const status = activity.lookAheadStatus || '';
        const details = [activity.title, activity.executiveSummary]
          .filter(Boolean)
          .join(' – ');
        const ref = activity.displayId || '';
        const min = activity.displayId
          ? activity.displayId.split('-')[0] || ''
          : '';

        // Escape commas and quotes in CSV
        const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

        rows.push(
          [
            escapeCsv(section.name),
            escapeCsv(date),
            escapeCsv(time),
            escapeCsv(status),
            escapeCsv(details),
            escapeCsv(ref),
            escapeCsv(min),
          ].join(',')
        );
      }
    }

    return rows.join('\n');
  }
}

export interface ReportSectionData {
  id: string;
  name: string;
  order: number;
  activities: ActivityResponse[];
}

export interface ReportDataResponse {
  report: ReportResponse;
  sections: ReportSectionData[];
}
