# Database Module

This module provides database access using Drizzle ORM with proper NestJS dependency injection.

## Usage in Services

To use the database in a service, inject `DatabaseService`:

```typescript
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database';
import { activities } from '@corpcal/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class MyService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll() {
    return await this.databaseService.db
      .select()
      .from(activities)
      .where(eq(activities.isActive, true));
  }
}
```

## Type Exports

The `Database` type is exported for type annotations:

```typescript
import type { Database } from '../database';

// Use in function signatures, etc.
function processData(db: Database) {
  // ...
}
```

## Configuration

The database connection is configured via environment variables:

- `DATABASE_URL` (required): PostgreSQL connection string
- `DB_MAX_CONNECTIONS` (optional, default: 10): Maximum number of connections in the pool
- `DB_IDLE_TIMEOUT` (optional, default: 20): Idle timeout in seconds
- `DB_CONNECT_TIMEOUT` (optional, default: 10): Connection timeout in seconds

## Database Seeding

The database can be seeded with initial lookup table data using the `SeedService`.

### Running Seeds

To seed the database with lookup table data, run:

```bash
npm run seed
```

This will execute the seed SQL file located in `packages/database/migrations/`:

- `001_seed_lookup_tables.sql` - Seeds all lookup tables including activity_statuses, pitch_statuses, scheduling_statuses, categories, comms_materials, translated_languages, cities, government_representatives, tags, ministries, organizations, communication_contacts, event_planners, videographers, themes, and system_users

### Seed Service

The `SeedService` is available for programmatic seeding:

```typescript
import { SeedService } from '../database';

@Injectable()
export class MyService {
  constructor(private readonly seedService: SeedService) {}

  async initializeData() {
    const success = await this.seedService.seed();
    if (success) {
      console.log('Database seeded successfully');
    }
  }
}
```

### Idempotency

The seed operation is idempotent - it can be run multiple times safely. The SQL files use `ON CONFLICT DO NOTHING` to prevent duplicate inserts.

## Module Structure

- `database.provider.ts`: NestJS provider that creates the Drizzle client with connection pooling
- `database.service.ts`: Injectable service wrapper around the database client
- `seed.service.ts`: Service for seeding the database with initial lookup table data
- `database.module.ts`: Global NestJS module that exports the database provider and service
- `index.ts`: Barrel export for convenient imports

## Important Notes

- The `DatabaseModule` is marked as `@Global()`, so it's automatically available to all modules
- Always use `DatabaseService` injection rather than importing `db` directly from `@corpcal/database`
- This ensures proper connection pooling, configuration, and testability
- Seed files should be run after database migrations have been applied
