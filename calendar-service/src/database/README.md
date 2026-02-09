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

To seed the database with lookup table data, from the calendar-service run:

```bash
npm run seed
```

This will automatically discover and execute all seed SQL files located in `packages/database/seeds/` in order.
**Note** this should be tested thoroughly before using with production data.

### Seed File Naming Convention

Seed files must follow this naming pattern: `####_YYYYMMDD_description_seed_*.sql`

- `####` - 4-digit sequence number (0001, 0002, etc.) - determines execution order
- `YYYYMMDD` - Date created (e.g., 20250119)
- `description` - Brief description (e.g., `corpcal`)
- `seed` - Required keyword to identify as seed file
- `*` - Additional description (e.g., `data`, `lookups`, etc.)

**Example:** `0001_20250119_corpcal_seed_data.sql`

Files are automatically discovered and executed in alphabetical order (the numeric prefix ensures correct ordering).

### Seed Service

The `SeedService` is available for programmatic seeding:

```typescript
import { SeedService } from '../database';

@Injectable()
export class MyService {
  constructor(private readonly seedService: SeedService) {}

  async initializeData() {
    // Basic seeding
    const success = await this.seedService.seed();
    if (success) {
      console.log('Database seeded successfully');
    }

    // With options
    const result = await this.seedService.seed({ force: true }); // Re-run already applied seeds
    const detailed = await this.seedService.seedWithResults(); // Get detailed results
  }
}
```

### Seed Options

The `seed()` method accepts optional options:

- `force?: boolean` - If true, re-runs seeds that have already been applied (default: false)
- `dryRun?: boolean` - If true, validates seed files without executing them (default: false)

### Seed Tracking

The seed system automatically tracks which seeds have been applied using a `_seed_history` table:

- Seeds are tracked by filename
- Already applied seeds are automatically skipped (unless `force: true` is used)
- The tracking table is created automatically on first run

### Idempotency

The seed operation is idempotent - it can be run multiple times safely:

1. **Seed tracking**: Already applied seeds are automatically skipped
2. **SQL-level**: The SQL files use `ON CONFLICT DO NOTHING` to prevent duplicate inserts
3. **Safe re-execution**: Running seeds multiple times will not cause errors or duplicate data

## Module Structure

- `database.provider.ts`: NestJS provider that creates the Drizzle client with connection pooling
- `database.service.ts`: Injectable service wrapper around the database client
- `seed.service.ts`: NestJS wrapper around the `SeedRunner` from `@corpcal/database` for seeding the database
- `database.module.ts`: Global NestJS module that exports the database provider and service
- `index.ts`: Barrel export for convenient imports

## Important Notes

- The `DatabaseModule` is marked as `@Global()`, so it's automatically available to all modules
- Always use `DatabaseService` injection rather than importing `db` directly from `@corpcal/database`
- This ensures proper connection pooling, configuration, and testability
- Seed files should be run after database migrations have been applied
- Seed files are located in `packages/database/seeds/` (not in migrations directory)
- The core seed runner logic lives in `@corpcal/database` package for better separation of concerns
