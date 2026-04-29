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

### 4. Insert the PostgreSQL extensions first migration

`drizzle-kit generate` emits a single `0000_*.sql` file. Extensions such as **`pg_trgm`** are required for trigram GIN indexes but are **not** represented in Drizzle schema, so they must be applied **before** the rest of the SQL. A dedicated first migration avoids “prepend and hope the next dev notices” when someone archives migrations later.

After **every** full squash generate, run:

```bash
npm run db:add-extensions --workspace=packages/database
```

This script:

- Copies `scripts/templates/postgresql_extensions.sql` to `migrations/0000_<date>_postgresql_extensions.sql`
- Renames the generated file from `0000_…` to `0001_…`
- Splits `migrations/meta/`: empty `0000_snapshot.json`, full schema in `0001_snapshot.json`, and updates `_journal.json` + `prevId` chain
- Runs `drizzle-kit check` (fails the script if metadata is inconsistent)

Edit **`scripts/templates/postgresql_extensions.sql`** when you need more instance-level setup (`CREATE EXTENSION`, etc.). The script is **idempotent**: if the journal already has two entries and the first tag contains `postgresql_extensions`, it exits without changes.

If you change that template **between** full squashes, update the committed **`migrations/0000_*_postgresql_extensions.sql`** on your branch to match—otherwise the template change only applies after the next time you run this script.

**Do not run** this after a normal incremental `db:generate` (multiple migrations already in `meta/`). It only supports the **one-entry** journal produced by a fresh squash.

### 5. Drop existing tables

Drop your local database tables to apply the new schema cleanly. You can:

- Use a database client (pgAdmin, DBeaver, etc.) to drop tables
- Run `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` in psql
- Recreate the database entirely

### 6. Apply the new schema

```bash
npm run db:push --workspace=packages/database
```

Or run the generated SQL file manually from `packages/database/migrations/`.

### 7. Re-seed the database

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

Do **not** run `db:add-extensions` here; that script is only for a **fresh squash** (a single new migration after deleting `migrations/`). Incremental folders already have the extensions migration in history.

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
| `npm run erd:build --workspace=packages/database`             | Generate a static ER diagram from Drizzle schema (Liam ERD)         |
| `npm run erd:serve --workspace=packages/database`             | Serve the generated ER diagram locally (view in browser)            |

### ER diagram (Liam ERD)

[Liam ERD](https://liambx.com/docs/parser/supported-formats/drizzle) generates a static ER diagram from the Drizzle schema in `src/schema/*.ts`. It does not watch for changes; rerun `erd:build` after schema updates. Output is written to `dist/` (gitignored). To view the diagram, run `erd:serve` and open the URL shown in your browser.

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
    0000_*.sql … 0009_*.sql  # Main seed chain (lexicographic order; add 0010+ when needed)
    9999_*.sql            # Sync serial sequences (must run last)
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

## Field-level activity permissions

Seed `seeds/0006_20260331_field_level_permissions_seed.sql` defines granular `activities.<scope>.view` / `activities.<scope>.edit` rows. **View** permissions exist for `notes`, `lookAhead`, and `pitchStatus` (API may omit those fields when the user lacks view access). **Pitch date** and **translations** use **edit-only** field permissions where applicable (no separate view permission for pitch date; anyone who can view the activity sees those values).

Seeds are tracked in `_seed_history` by **filename**. If you renumber or merge seed files on a database that was seeded with older names, run seeds with `force: true` (where the CLI or API exposes it), truncate `_seed_history`, or wipe the database so every file runs again in order.

## Types

Types are automatically inferred from Drizzle schemas in `src/types.ts`:

- `Activity` - Select type (for queries)
- `NewActivity` - Insert type (for creates)

## Usage

```typescript
import { eq } from 'drizzle-orm';

import { db } from '@corpcal/database';
import { activities } from '@corpcal/database/schema';

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
