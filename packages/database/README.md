# Database Package

This package contains Drizzle ORM schema definitions and database client setup.

## Initial Setup

1. **Configure the database connection** in the root `.env` file:

   ```bash
   # Format: postgresql://user:password@host:port/database
   DATABASE_URL="postgresql://postgres:password@localhost:5432/corpcal"
   ```

2. **Apply the schema** to your database:

   ```bash
   npm run db:push --workspace=packages/database
   ```

3. **Seed the database** with lookup data:

   ```bash
   npm run seed --workspace=calendar-service
   ```

4. **Open Drizzle Studio** (optional, for visual database exploration):

   ```bash
   npm run db:studio --workspace=packages/database
   ```

**Manual SQL execution:**

If you prefer to run SQL statements manually instead of using the CLI commands:

- Migration SQL: `packages/database/migrations/*.sql`
- Seed SQL: `packages/database/seeds/*.sql`

## Schema Change Workflow (Development)

During development we maintain a single consolidated migration file rather than accumulating incremental migrations. When making schema changes, follow this process **before creating a PR**:

### 1. Archive the current migration

Move the current migration file(s) to the archive folder:

```bash
# Create a dated archive folder (optional, for tracking)
mkdir -p packages/database/archive/migrations/$(date +%Y%m%d)_migrations

# Move current migration files
mv packages/database/migrations/*.sql packages/database/archive/migrations/$(date +%Y%m%d)_migrations/
```

### 2. Delete the migrations folder

Remove the entire migrations folder to start fresh:

```bash
rm -rf packages/database/migrations
```

### 3. Generate a new consolidated migration

Run the generate command with a descriptive name:

```bash
npm run db:generate --workspace=packages/database -- YYYYMMDD_kebab-description
```

**Example:**

```bash
npm run db:generate --workspace=packages/database -- 20260129_add-user-preferences
```

This creates a fresh, consolidated CREATE statement including your changes.

### 4. Drop existing tables

Drop your local database tables to apply the new schema cleanly. You can:

- Use a database client (pgAdmin, DBeaver, etc.) to drop tables
- Run `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` in psql
- Recreate the database entirely

### 5. Apply the new schema

```bash
npm run db:push --workspace=packages/database
```

Or run the generated SQL file manually from `packages/database/migrations/`.

### 6. Re-seed the database

```bash
npm run seed --workspace=calendar-service
```

Or run the seed SQL files manually from `packages/database/seeds/`.

> **Note:** The seed data may need updating if your schema changes affect lookup tables or required data.

## Schema Change Workflow (Production Proposal)

**Proposal WIP**

Production deployments require a different approach than development. Instead of consolidating migrations, we apply incremental migrations to preserve existing data.

### Prerequisites

- Schema changes have been tested in development and staging
- Database backup is available
- Deployment window scheduled (if downtime is required)

### Production Migration Process

#### 1. Create an incremental migration

For production changes, generate a migration **without** deleting existing migrations:

```bash
npm run db:generate --workspace=packages/database -- YYYYMMDD_description
```

This creates a new migration file that contains only the **diff** between your current schema and the database.

#### 2. Review the generated SQL

**Always inspect the generated migration** before applying to production:

```bash
cat packages/database/migrations/0001_*.sql
```

Verify:

- No unexpected `DROP TABLE` or `DROP COLUMN` statements
- Data transformations are correct
- Indexes are created appropriately

#### 3. Test on staging

Apply the migration to a staging environment first:

```bash
npm run db:migrate --workspace=packages/database
```

Verify application functionality with the new schema.

#### 4. Backup production database

Before applying changes to production:

```bash
pg_dump -Fc $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).dump
```

#### 5. Apply migration to production

```bash
npm run db:migrate --workspace=packages/database
```

### Rollback Strategy

If a migration fails or causes issues:

1. **Restore from backup** (if data was corrupted):

   ```bash
   pg_restore -d $DATABASE_URL backup_YYYYMMDD_HHMMSS.dump
   ```

2. **Manual rollback** (if migration was partially applied):
   - Write a reverse migration SQL script
   - Apply manually after careful review

> **Note:** Drizzle Kit does not automatically generate rollback migrations. Plan your rollback strategy before applying changes.

## Command Reference

| Command                                                       | Description                                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| `npm run db:generate --workspace=packages/database -- <name>` | Generate a new migration file (name format: `YYYYMMDD_description`) |
| `npm run db:push --workspace=packages/database`               | Apply schema directly to database (development)                     |
| `npm run db:migrate --workspace=packages/database`            | Run incremental migrations (production)                             |
| `npm run db:studio --workspace=packages/database`             | Open Drizzle Studio for visual DB exploration                       |
| `npm run seed --workspace=calendar-service`                   | Seed lookup tables and sample data                                  |

### db:push vs db:migrate

- **db:push**: Directly applies the current schema to the database. Use this in development when you want to sync your schema without tracking migration history. This is the recommended approach for local development.

- **db:migrate**: Applies incremental migration files in order. Use this in production or staging environments where you need to preserve data and track migration history.

## File Structure

```
packages/database/
  archive/
    migrations/           # Archived migration files (for reference)
    seeds/                # Archived seed files
  migrations/
    0000_*.sql            # Current consolidated migration
    meta/                 # Drizzle migration metadata
  seeds/
    0001_*.sql            # Lookup data seed
    0002_*.sql            # Sample activity data seed
  src/
    schema/               # Drizzle ORM schema definitions
    client.ts             # Database client setup
    types.ts              # Inferred TypeScript types
```

## Schema

The schema is defined in `src/schema/`:

- `activity.ts` - Main activity/calendar entries table
- `calendar.ts` - Legacy calendar table (to be merged with activity)
- Other lookup and relation tables

## Types

Types are automatically inferred from Drizzle schemas in `src/types.ts`:

- `Activity` - Select type (for queries)
- `NewActivity` - Insert type (for creates)

## Usage

```typescript
import { db } from '@corpcal/database';
import { activities } from '@corpcal/database/schema';
import { eq } from 'drizzle-orm';

// Query
const allActivities = await db.select().from(activities);

// Insert
const [newActivity] = await db
  .insert(activities)
  .values({
    title: 'New Activity',
    // ...
  })
  .returning();

// Update
await db
  .update(activities)
  .set({ title: 'Updated' })
  .where(eq(activities.id, 1));
```
