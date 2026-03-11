import { BadRequestException, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { categories } from '@corpcal/database/schema';

import { DatabaseService } from '../../database/database.service';

/**
 * Service for activity utility functions
 * Handles display ID generation, validation, and other helper functions
 */
@Injectable()
export class ActivityUtilsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Generate displayId from a prefix (ministry abbreviation or team name) and activity ID
   * Format: <PREFIX>-<last 6 digits of id>
   * Example: AG-000123 (Attorney General, activity ID 123)
   * Example: HLTH-456789 (Health, activity ID 123456789)
   * Example: TEAM-000123 (first 4 chars of team name when no ministry)
   *
   * @param prefix - Ministry abbreviation or 4-char team name prefix
   * @param activityId - Activity ID (serial)
   * @returns Formatted displayId string
   */
  generateDisplayId(prefix: string, activityId: number): string {
    const lastSixDigits = activityId.toString().slice(-6).padStart(6, '0');
    return `${prefix.toUpperCase().trim()}-${lastSixDigits}`;
  }

  /**
   * Get a 4-character prefix from a team name for displayId when ministry is null.
   * Uses first 4 letters, uppercased, padded with 'X' if shorter than 4.
   */
  getDisplayIdPrefixFromTeamName(teamName: string): string {
    const trimmed = (teamName ?? '').trim().replace(/\s+/g, '');
    const firstFour = trimmed.slice(0, 4).toUpperCase();
    return firstFour.padEnd(4, 'X');
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
