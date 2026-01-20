import { Injectable, BadRequestException } from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
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
   * Generate displayId from ministry abbreviation and activity ID
   * Format: <ACRONYM>-<last 6 digits of id>
   * Example: AG-000123 (Attorney General, activity ID 123)
   * Example: HLTH-456789 (Health, activity ID 123456789)
   *
   * @param ministryAbbreviation - Ministry abbreviation from ministries table
   * @param activityId - Activity ID (serial)
   * @returns Formatted displayId string
   */
  generateDisplayId(ministryAbbreviation: string, activityId: number): string {
    // Get last 6 digits of activity ID
    const lastSixDigits = activityId.toString().slice(-6).padStart(6, '0');
    return `${ministryAbbreviation.toUpperCase().trim()}-${lastSixDigits}`;
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
