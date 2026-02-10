import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { reports, activityReportSettings } from '@corpcal/database/schema';
import { DatabaseService } from '../database/database.service';
import type { ReportResponse } from '@corpcal/shared/api/types';
import { reportConfigSchema } from '@corpcal/shared/schemas';
import type { Visibility } from '@corpcal/shared';

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
  constructor(private readonly databaseService: DatabaseService) {}

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
          console.warn(
            `Invalid report config for report ${report.id}:`,
            configResult.error
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
        console.warn(
          `Invalid report config for report ${result.id}:`,
          configResult.error
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
        console.warn(
          `Invalid report config for report ${result.id}:`,
          configResult.error
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
}
