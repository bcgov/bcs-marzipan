import { BadRequestException, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { categories } from '@corpcal/database/schema';
import {
  buildActivityDisplayId,
  normalizeTeamAbbreviationForActivityDisplayId,
} from '@corpcal/shared';

import { DatabaseService } from '../../database/database.service';

/**
 * Service for activity utility functions
 * Handles display ID generation, validation, and other helper functions
 */
@Injectable()
export class ActivityUtilsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Generate displayId from a prefix (ministry or team abbreviation) and activity ID
   * Format: <PREFIX>-<last 6 digits of id>
   * Example: AG-000123 (Attorney General, activity ID 123)
   * Example: HLTH-456789 (Health, activity ID 123456789)
   * Example: MR-000123 (`teams.abbreviation` when the lead has no ministry)
   *
   * @param prefix - Ministry abbreviation or `teams.abbreviation` (normalized)
   * @param activityId - Activity ID (serial)
   * @returns Formatted displayId string
   */
  generateDisplayId(prefix: string, activityId: number): string {
    return buildActivityDisplayId(prefix, activityId);
  }

  /**
   * Normalizes `teams.abbreviation` for use in displayId when the lead has no ministry
   * (or when a ministry row has no abbreviation and we fall back to the team). Strips
   * surrounding whitespace, removes internal spaces, and uppercases. If empty after
   * normalizing, returns `TEAM_PREFIX_FALLBACK` via
   * `normalizeTeamAbbreviationForActivityDisplayId`.
   */
  getDisplayIdPrefixFromTeamAbbreviation(
    abbreviation: string | null | undefined
  ): string {
    return normalizeTeamAbbreviationForActivityDisplayId(abbreviation);
  }

  /**
   * Compute an activity's displayId from its current lead context.
   *
   * Rule (must match runtime lead-team/ministry-change semantics in
   * `ActivitiesService.update`):
   * - When `leadMinistryId` is set AND the ministry row has a truthy
   *   abbreviation, prefix = ministry abbreviation.
   * - Otherwise, prefix = normalized team abbreviation, or `TEAM_PREFIX_FALLBACK`
   *   when the team abbreviation is empty after normalization.
   */
  computeDisplayIdFromLeadContext(input: {
    activityId: number;
    leadMinistryId: number | null | undefined;
    ministryAbbreviation: string | null | undefined;
    teamAbbreviation: string | null | undefined;
  }): string {
    const { activityId, leadMinistryId, ministryAbbreviation } = input;
    if (leadMinistryId != null && ministryAbbreviation) {
      return this.generateDisplayId(ministryAbbreviation, activityId);
    }
    const prefix = this.getDisplayIdPrefixFromTeamAbbreviation(
      input.teamAbbreviation
    );
    return this.generateDisplayId(prefix, activityId);
  }

  /**
   * Validate that all category IDs exist in the database
   */
  async validateCategoryIds(categoryIds: number[]): Promise<void> {
    if (categoryIds.length === 0) {
      return;
    }

    const existingCategories = await this.databaseService.db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(inArray(categories.id, categoryIds), eq(categories.isActive, true))
      );

    const existingIds = new Set(existingCategories.map((c) => c.id));
    const missingIds = categoryIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Invalid category IDs: ${missingIds.join(', ')}. These categories do not exist or are not active.`
      );
    }
  }
}
