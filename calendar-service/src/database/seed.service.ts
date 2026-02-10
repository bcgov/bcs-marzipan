import { Inject, Injectable } from '@nestjs/common';

import {
  SeedRunner,
  type SeedableDatabase,
  type SeedOptions,
  type SeedResult,
} from '@corpcal/database';

import { AppLogger } from '../common/logger/logger.service';
import { DATABASE_CLIENT, type Database } from './database.provider';

/**
 * Seed Service
 * Handles seeding the database with initial lookup table data.
 * The seed SQL files are located in packages/database/seeds/
 *
 * This service is a thin NestJS wrapper around the SeedRunner from @corpcal/database.
 */
@Injectable()
export class SeedService {
  private readonly seedRunner: SeedRunner;

  constructor(
    @Inject(DATABASE_CLIENT) private readonly db: Database,
    private readonly logger: AppLogger
  ) {
    // Type assertion needed because Drizzle's Database type has a more specific
    // execute signature than our SeedableDatabase interface
    // The actual runtime behavior is compatible
    this.seedRunner = new SeedRunner(this.db as unknown as SeedableDatabase);
  }

  /**
   * Seeds the database with lookup table data.
   * This method is idempotent - it can be run multiple times safely.
   * The SQL files use ON CONFLICT DO NOTHING to prevent duplicate inserts.
   *
   * Seed files are automatically discovered from packages/database/seeds/
   * and executed in order based on their numeric prefix.
   *
   * @param options - Optional seeding options (force, dryRun)
   * @returns Promise<boolean> - true if seeding was successful, false otherwise
   */
  async seed(options: SeedOptions = {}): Promise<boolean> {
    this.logger.log('Starting database seeding...', 'SeedService');

    try {
      const seedsPath = this.seedRunner.getSeedsPath();
      this.logger.log(`Seeds directory: ${seedsPath}`, 'SeedService');

      const results = await this.seedRunner.run(options);

      if (results.length === 0) {
        this.logger.warn(
          'No seed files found. Ensure seed files follow the naming convention: ####_YYYYMMDD_description_seed_*.sql',
          'SeedService'
        );
        return true; // Not an error, just no seeds to run
      }

      let successCount = 0;
      let failureCount = 0;
      let skippedCount = 0;

      for (const result of results) {
        if (!result.success) {
          failureCount++;
          this.logger.error(
            `Failed to execute seed file: ${result.file}${result.error ? ` - ${result.error}` : ''}`,
            undefined,
            'SeedService'
          );
        } else if (result.statementsExecuted === 0) {
          skippedCount++;
          this.logger.log(
            `Skipped seed file (already applied): ${result.file}`,
            'SeedService'
          );
        } else {
          successCount++;
          this.logger.log(
            `Successfully executed seed file: ${result.file} (${result.statementsExecuted} statements)`,
            'SeedService'
          );
        }
      }

      const allSuccessful = failureCount === 0;

      if (allSuccessful) {
        this.logger.log(
          `Database seeding completed successfully. Processed: ${successCount} executed, ${skippedCount} skipped`,
          'SeedService'
        );
      } else {
        this.logger.error(
          `Database seeding completed with errors. Success: ${successCount}, Failed: ${failureCount}, Skipped: ${skippedCount}`,
          undefined,
          'SeedService'
        );
      }

      return allSuccessful;
    } catch (error) {
      this.logger.error(
        `Database seeding failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        'SeedService'
      );
      return false;
    }
  }

  /**
   * Gets detailed results from the last seed run.
   * Useful for debugging or getting more information about what was executed.
   */
  async seedWithResults(
    options: SeedOptions = {}
  ): Promise<{ success: boolean; results: SeedResult[] }> {
    try {
      const results = await this.seedRunner.run(options);
      const allSuccessful = results.every((r) => r.success);
      return { success: allSuccessful, results };
    } catch (error) {
      this.logger.error(
        `Database seeding failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        'SeedService'
      );
      return {
        success: false,
        results: [
          {
            file: 'unknown',
            success: false,
            statementsExecuted: 0,
            error: error instanceof Error ? error.message : String(error),
          },
        ],
      };
    }
  }
}
