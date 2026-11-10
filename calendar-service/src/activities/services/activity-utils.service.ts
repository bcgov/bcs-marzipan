import { BadRequestException, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { categories } from '@corpcal/database/schema';
import {
  ACTIVITY_CATEGORY_IDS_MESSAGE,
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
   * Generate displayId from a prefix (team abbreviation) and activity ID
   * Format: <PREFIX>-<numeric segment> (min 6 digits; full id when longer)
   */
  generateDisplayId(prefix: string, activityId: number): string {
    return buildActivityDisplayId(prefix, activityId);
  }

  /**
   * Normalizes `teams.abbreviation` for use in displayId. Strips surrounding
   * whitespace, removes internal spaces, and uppercases. If empty after
   * normalizing, returns `TEAM_PREFIX_FALLBACK` via
   * `normalizeTeamAbbreviationForActivityDisplayId`.
   */
  getDisplayIdPrefixFromTeamAbbreviation(
    abbreviation: string | null | undefined
  ): string {
    return normalizeTeamAbbreviationForActivityDisplayId(abbreviation);
  }

  /**
   * Compute an activity's displayId from its lead team (activity owner).
   * Prefix = normalized team abbreviation, or TEAM_PREFIX_FALLBACK when empty.
   */
  computeDisplayIdFromLeadContext(input: {
    activityId: number;
    teamAbbreviation: string | null | undefined;
  }): string {
    const prefix = this.getDisplayIdPrefixFromTeamAbbreviation(
      input.teamAbbreviation
    );
    return this.generateDisplayId(prefix, input.activityId);
  }

  /**
   * Validate that all category IDs exist in the database
   */
  async validateCategoryIds(categoryIds: number[]): Promise<void> {
    if (categoryIds.length === 0) {
      return;
    }
    if (categoryIds.length > 1) {
      throw new BadRequestException(ACTIVITY_CATEGORY_IDS_MESSAGE);
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
