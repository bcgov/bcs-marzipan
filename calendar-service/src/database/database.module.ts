import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { databaseProvider, DATABASE_CLIENT } from './database.provider';
import { DatabaseService } from './database.service';
import { SeedService } from './seed.service';

/**
 * Database Module
 * Provides Drizzle database instance globally using NestJS DI
 * The database connection is configured via DATABASE_URL environment variable
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [databaseProvider, DatabaseService, SeedService],
  exports: [DATABASE_CLIENT, DatabaseService, SeedService],
})
export class DatabaseModule {}
