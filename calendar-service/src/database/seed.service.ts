import { Injectable, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { DATABASE_CLIENT, type Database } from './database.provider';
import { AppLogger } from '../common/logger/logger.service';

/**
 * Seed Service
 * Handles seeding the database with initial lookup table data.
 * The seed SQL files are located in packages/database/migrations/
 */
@Injectable()
export class SeedService {
  private readonly seedFiles = ['001_seed_lookup_tables.sql'];

  constructor(
    @Inject(DATABASE_CLIENT) private readonly db: Database,
    private readonly logger: AppLogger
  ) {}

  /**
   * Seeds the database with lookup table data.
   * This method is idempotent - it can be run multiple times safely.
   * The SQL files use ON CONFLICT DO NOTHING to prevent duplicate inserts.
   *
   * @returns Promise<boolean> - true if seeding was successful, false otherwise
   */
  async seed(): Promise<boolean> {
    this.logger.log('Starting database seeding...', 'SeedService');

    try {
      // Resolve the path to the migrations directory
      // From calendar-service/src/database -> packages/database/migrations
      const migrationsPath = this.resolveMigrationsPath();

      if (!fs.existsSync(migrationsPath)) {
        this.logger.error(
          `Migrations directory not found: ${migrationsPath}`,
          undefined,
          'SeedService'
        );
        return false;
      }

      // Execute each seed file in order
      for (const seedFile of this.seedFiles) {
        const filePath = path.join(migrationsPath, seedFile);

        if (!fs.existsSync(filePath)) {
          this.logger.warn(
            `Seed file not found: ${filePath}, skipping...`,
            'SeedService'
          );
          continue;
        }

        this.logger.log(`Executing seed file: ${seedFile}`, 'SeedService');

        try {
          const sqlContent = fs.readFileSync(filePath, 'utf-8');

          // Execute the SQL content
          await this.db.execute(sql.raw(sqlContent));

          this.logger.log(
            `Successfully executed seed file: ${seedFile}`,
            'SeedService'
          );
        } catch (error) {
          this.logger.error(
            `Error executing seed file ${seedFile}: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
            'SeedService'
          );
          // Continue with other seed files even if one fails
        }
      }

      this.logger.log('Database seeding completed successfully', 'SeedService');
      return true;
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
   * Resolves the path to the migrations directory.
   * Handles both development (source) and production (compiled) environments.
   */
  private resolveMigrationsPath(): string {
    // In development: calendar-service/src/database -> root/packages/database/migrations
    // In production: calendar-service/dist/database -> root/packages/database/migrations
    const isCompiled = __dirname.includes(path.sep + 'dist' + path.sep);

    if (isCompiled) {
      // From dist/database -> up to calendar-service -> up to root -> packages/database/migrations
      return path.resolve(__dirname, '../../packages/database/migrations');
    } else {
      // From src/database -> up to calendar-service -> up to root -> packages/database/migrations
      return path.resolve(__dirname, '../../packages/database/migrations');
    }
  }
}
