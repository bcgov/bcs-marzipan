# Schema Flow and Type Safety

This document describes the schema flow and type safety architecture in the application, explaining how database schemas flow through to API responses and frontend types.

## Overview

The application uses a layered approach to ensure type safety from the database to the frontend:

```
Database → Drizzle → Zod (hand-maintained request/response) → API → Frontend
```

## Key Components

### 1. Database Schema (`packages/database/src/schema/`)

- **Purpose**: Defines the database structure using Drizzle ORM
- **Location**: `packages/database/src/schema/activity.ts`
- **Types**: Inferred using `InferSelectModel` and `InferInsertModel` from Drizzle
- **Usage**: Internal use only - not exposed directly via API

### 2. Zod Schemas (`packages/shared/src/schemas/`)

#### Activity request / response (`activity.schema.ts`, `activity-response.schema.ts`)

These are **hand-maintained** (see file headers in `packages/shared`). They define HTTP create/update payloads and `ActivityResponse`. When you change Drizzle columns for `activities`, update the Zod layers and run `packages/shared/scripts/validate-types.ts`.

- **`createActivityRequestSchema` / `updateActivityRequestSchema`**: API body validation (junction fields, refinements for comms lead and event planners, etc.).
- **`activityResponseSchema`**: DB-shaped fields plus computed fields (`category`, tags, status names, etc.) built in the calendar service.

Field transformations (dates/times as ISO strings, etc.) are implemented in the service mapper, not by a generated `drizzle-zod` pipeline.

#### Review-exempt form fields (workflow, not a separate table)

`application_settings` stores an optional key `activity_review_exempt_field_keys` (JSON array of top-level form field names). That list is **not** part of the Drizzle `activities` table; it configures which fields System Admins may mark as review-exempt. Shared allowlist and product rules: `packages/shared/src/review-exempt-settings.ts`. **When you add or change top-level activity form fields,** update that file (and the field playbook) as described in [ACTIVITY_REVIEW_EXEMPT_SETTINGS.md](../../../../../calendar-service/docs/ACTIVITY_REVIEW_EXEMPT_SETTINGS.md) in `calendar-service/docs`.

#### Recent database-facing changes

See [SCHEMA_CHANGELOG.md](./SCHEMA_CHANGELOG.md) (e.g. nullable `significance`, category rules on create).

### 3. DTOs (`packages/shared/src/dto/`)

- **Purpose**: Provide explicit contracts and better IDE support
- **Location**: `packages/shared/src/dto/activity-response.dto.ts`
- **Implementation**: `ActivityResponseDto` class implements `ActivityResponse` type
- **Factory Method**: `ActivityResponseDto.from()` creates DTO instances from plain objects
- **Compile-time Check**: Ensures the class matches the type definition

### 4. API Types (`packages/shared/src/api/types.ts`)

- **Purpose**: Re-export types from Zod schemas for frontend use
- **Types**: `ActivityResponse`, `PaginatedActivityResponse`
- **Usage**: Frontend should import from `@corpcal/shared/api/types`

## Type Flow

### Request Flow

1. **HTTP Request** → Validated by `ZodValidationPipe` using request schemas
2. **Service Layer** → Uses validated request types (`CreateActivityRequest`, `UpdateActivityRequest`)
3. **Database** → Uses Drizzle types (`NewActivity`, `Activity`)

### Response Flow

1. **Database** → Returns `Activity` (Drizzle type)
2. **Service Layer** → Maps to `ActivityResponse` using `mapToResponseDto()`
3. **Compile-time Validation** → `ensureMatchesSchema()` ensures mapping matches schema
4. **Runtime Validation** → Zod schema validates the DTO
5. **DTO Creation** → `ActivityResponseDto.from()` creates DTO instance
6. **API Response** → Returns `ActivityResponseDto` (implements `ActivityResponse`)

## Type Safety Mechanisms

### 1. Compile-time Safety

- **Schema alignment**: Activity Zod schemas are maintained next to Drizzle; `validate-types.ts` and `schema-helpers.ts` help catch drift
- **Type Inference**: TypeScript types inferred from Zod schemas
- **Mapping Validation**: `ensureMatchesSchema()` ensures mapping produces valid types
- **DTO Type Check**: Compile-time check that DTO class matches type

### 2. Build-time Validation

- **Validation Script**: `packages/shared/scripts/validate-types.ts`
  - Validates all schemas match their corresponding Drizzle types
  - Checks that `ActivityResponse` fields are derived from `Activity`
  - Validates lookup response schemas match their database types
  - Validates request schemas
  - **Must be updated** when adding or removing fields from schemas (see schema update steps)

### 3. Runtime Validation

- **Request Validation**: `ZodValidationPipe` validates incoming requests
- **Response Validation**: Service layer validates responses against schemas
- **Fail-fast**: Validation errors throw immediately in all environments

### 4. Integration Tests

- **Location**: `calendar-service/src/activities/activities.integration.spec.ts`
- **Tests**: Verify API responses match schemas, edge cases handled correctly

## Key Files

### Schema Files

- `packages/database/src/schema/activity.ts` - Database schema definition
- `packages/shared/src/schemas/activity.schema.ts` - Request/select schemas
- `packages/shared/src/schemas/activity-response.schema.ts` - API response schema

### Type Files

- `packages/database/src/types.ts` - Database types (internal use only)
- `packages/shared/src/api/types.ts` - API types (frontend use)
- `packages/shared/src/dto/activity-response.dto.ts` - DTO classes

### Utility Files

- `packages/shared/src/utils/schema-helpers.ts` - Schema helper functions
- `packages/shared/scripts/validate-types.ts` - Type validation script (validates schemas match database types)

### Test Fixture Files

- `packages/shared/src/test-utils/activity-response.fixture.ts` - **ActivityResponse mock factory** (`createMockActivityResponse`). Single source of truth for `ActivityResponse` test fixtures. Use this when tests need a schema-valid `ActivityResponse`; all fields can be overridden via the `overrides` parameter. Exported as `@corpcal/shared/test-utils`. `calendar-service` re-exports it from `src/common/test-utils.ts` for convenience.

### Service Files

- `calendar-service/src/activities/activities.service.ts` - Service with mapping logic
- `calendar-service/src/activities/activities.controller.ts` - Controller with validation

## Best Practices

1. **Always use Zod schemas** for validation - never validate manually
2. **Derive API schemas from Drizzle** - don't define them manually
3. **Use DTOs for responses** - provides better IDE support and explicit contracts
4. **Run validation script** - ensures types stay in sync
5. **Write integration tests** - verify end-to-end type safety

## Common Patterns

### Schema Sources of Truth

Before updating schemas, understand where the root definitions live:

- **Activity Schema**: `packages/database/src/schema/activity.ts` - The Drizzle schema definition for the `activities` table
- **Lookup Table Schemas**: `packages/database/src/schema/lookups.ts` - The Drizzle schema definitions for all lookup tables (activityStatuses, cities, categories, tags, pitchStatuses, etc.)
- **Activity status (id, name) mapping**: Canonical mapping is in `packages/database/config-data/0001_lookup_status.sql` (activity_statuses). Ids 1-7 must match: 1=new, 2=reviewed, 3=changed, 4=deleted, 5=delete_requested, 6=completed, 7=on_hold. The seed asserts this; code and the activities seed depend on it.
- **Other Table Schemas**: `packages/database/src/schema/` - Additional schema files for ministries, teams, users, relations, etc.

These Drizzle schemas are the **single source of truth** for database structure. All other type definitions are derived from or must be manually aligned with these schemas.

### Schema Change Checklist

When making schema changes, use this checklist to ensure all affected files are updated:

#### Files That May Need Updates

1. **Database Schema** (`packages/database/src/schema/`)
   - Update the Drizzle schema definition
   - Update schema comments/documentation

2. **Zod Schemas** (`packages/shared/src/schemas/`)
   - `activity.schema.ts` - For activity-related schemas
   - `activity-response.schema.ts` - For activity API response schemas
   - `lookup.schema.ts` - For lookup table response schemas
   - **Response schema pattern**: Add field to `.pick()` section, then add explicit type in `.extend()` section (required due to drizzle-zod type inference limitations)
   - **For lookups**: Also update `*LookupItemSchema` if field should appear in lookup items

3. **Response DTOs** (`packages/shared/src/dto/`)
   - Add property to DTO class matching the schema type
   - DTO must implement the response type (compile-time check ensures alignment)

4. **Type Validation** (`packages/shared/scripts/validate-types.ts`)
   - Add/update type validation checks for new or modified fields
   - For new fields: Add to validation check object (e.g., `_activityResponseFieldCheck`, `_categoryResponseCheck`)
   - For removed fields: Remove from validation check
   - **Note**: Field modifications (e.g., nullability changes) typically don't require updates - type system catches mismatches

5. **Service Layer** (`calendar-service/src/`)
   - Update service methods that query the affected table
   - Update mapping functions if field transformations are needed (`mapToResponseDto()` method)
   - Update filtering/query logic if access control changes

6. **Controller Layer** (`calendar-service/src/`)
   - Update controller endpoints that use the affected schema
   - Update request/response DTOs if needed

7. **Tests**
   - Service tests (`*.service.spec.ts`)
   - Controller tests (`*.controller.spec.ts`)
   - Integration tests (`*.integration.spec.ts`)
   - **ActivityResponse mock**: When adding or removing `ActivityResponse` fields, update `packages/shared/src/test-utils/activity-response.fixture.ts` (`createMockActivityResponse`). This is the single source of truth; `calendar-service` re-exports from `@corpcal/shared/test-utils` via `src/common/test-utils.ts`. Update other test data/mocks as needed for new fields.

8. **Documentation**
   - `docs/SCHEMA_README.md` - This file (update if process changes)
   - `packages/database/src/schema/docs/SCHEMA_MAPPING.md` - Legacy to new schema mapping
   - Migration log (if applicable)

9. **Migrations** (`packages/database/migrations/`)
   - Generate migration: `npm run db:generate --workspace=packages/database` (or with name: `-- <migration_name>`)
   - **Migration name format** (for lookups): `YYYYMMDD_description_of_change`
   - Always let Drizzle generate migrations - review generated SQL
   - Add data migration steps if needed for existing data
   - Document in `MIGRATION_LOG.md` with date, migration file(s), changes, breaking changes, and notes

10. **Seed Files** (for lookup tables)
    - Update `001_seed_lookup_tables.sql` for lookup values
    - Update `002_seed_activities.sql` for activity seed data
    - Use idempotent INSERT statements (`ON CONFLICT DO NOTHING` or `WHERE NOT EXISTS`)
    - Run: `npm run seed --workspace=calendar-service`

#### Commands

- **Generate migration**: `npm run db:generate --workspace=packages/database`
- **Apply migration**: `npm run db:migrate --workspace=packages/database`
- **Run type validation**: `npm run validate-types --workspace=packages/shared`
- **Run seed**: `npm run seed --workspace=calendar-service`

#### Visibility Field Pattern

For tables with visibility/access control (e.g., `pods`, `categories`):

- Add `visibility` field to the table schema
- Update service layer to filter by visibility + junction table
- Update controller to pass user context (teams) to service methods
- Document the visibility model in schema comments
- **For categories**: Categories with `visibility = 'global'` are visible to all; `visibility = 'team'` requires checking the `teamCategories` junction table

### Transforming a Field

When a field needs transformation (e.g., date to string, number to string):

1. Update API response schema transformation in the `.extend()` section
2. Update mapping function in `mapToResponseDto()` to apply the transformation
3. Compile-time check via `ensureMatchesSchema()` ensures mapping matches schema

### Adding a Computed Field

For fields that don't exist in the database but are computed from other data:

1. Add field to API response schema in the `.extend()` section (don't add to `.pick()`)
2. Update mapping function to compute the value
3. Compile-time check ensures mapping matches schema

### SQL Seeding Files

The application uses SQL seed files to populate lookup tables and initial data. These files are located in `packages/database/migrations/`:

- **`001_seed_lookup_tables.sql`**: Seeds all lookup tables with their initial values
  - Activity statuses, pitch statuses, scheduling statuses
  - Categories, tags, themes
  - Cities, government representatives
  - Comms materials, translated languages
  - Comms contacts
  - Ministries, organizations, users

- **`002_seed_activities.sql`**: Seeds initial activity data (if needed)

#### Creating and Updating Seed Files

1. **Seed files are idempotent**: They use `ON CONFLICT DO NOTHING` or `WHERE NOT EXISTS` clauses to prevent duplicate inserts
2. **Seed files are executed by SeedService**: The `SeedService` in `calendar-service/src/database/seed.service.ts` reads and executes these files
3. **Running seeds**: Execute seeds using:
   ```bash
   npm run seed --workspace=calendar-service
   ```

#### When to Update Seed Files

- **Adding new lookup values**: When you add new categories, statuses, or other lookup values
- **Modifying existing values**: When you need to update display names, descriptions, or other seed data
- **Initial data setup**: When you need to populate tables with reference data

#### Seed File Best Practices

- Always use idempotent INSERT statements (with `ON CONFLICT` or `WHERE NOT EXISTS`)
- Include comments explaining what each section seeds
- Group related inserts together with clear section headers
- Use consistent formatting for readability
- Test seed files after modification to ensure they work correctly

### Migration Logging

Document notable database and constraint changes in [SCHEMA_CHANGELOG.md](./SCHEMA_CHANGELOG.md) (append-only). The subsection below is an **additional** narrative log; keep it aligned with the actual files under `packages/database/migrations/` on your branch.

**Current generated baseline (this branch):** `packages/database/migrations/0000_20260322_venue_and_activity.sql` (replaces `0000_20260305_delete_audit.sql` on `main`). Older dated entries below describe logical evolution; incremental filenames may not exist if history was squashed into that baseline.

#### When to Update the Migration Log

- **Always** when creating a new migration file
- **Always** when modifying existing schema definitions
- **Always** when adding or removing fields, constraints, or indexes
- **Always** when changing field types or nullability

#### What to Include

Each log entry should include:

1. **Date**: The date the changes were made (YYYY-MM-DD format)
2. **Migration File(s)**: Reference to the migration SQL file(s)
3. **Changes**: Detailed list of all schema changes
4. **Breaking Changes**: Any changes that require application updates
5. **Notes**: Additional context, migration instructions, or important considerations

#### Example Entry

```markdown
### 2025-01-15 - Add User Preferences Table

**Migration File(s):** `0004_add_user_preferences.sql`

**Changes:**

- Created new `user_preferences` table
- Added `preferences` JSONB column to `users` table
- Added foreign key constraint: `user_preferences.user_id` → `users.id`

**Breaking Changes:**

- None (new table, existing tables unchanged)

**Notes:**

- User preferences are optional, existing users will have NULL preferences
- Consider backfilling default preferences for existing users
```

#### 2026-02-12 - Add venue_presets table

**Migration File(s):** Historical incremental: `0005_20260212_venue_quick_picks.sql` (if present in older branches). **Current repo:** see `0000_20260322_venue_and_activity.sql`.

**Changes:**

- Created `venue_presets` table (originally `venue_quick_picks`, renamed 2026-03-21) with columns: id, venue_name, address_line1, city, province_or_state, country, sort_order, is_active, created_date_time, created_by, last_updated_date_time, last_updated_by
- Added foreign key constraints: created_by and last_updated_by reference users.id

**Breaking Changes:**

- None (new table, existing tables unchanged)

**Notes:**

- Admin-defined named venues for the activity form. No legacy data; populated via admin UI or seeds.

#### 2026-03-20 - Add address_line2 to venue_presets

**Migration File(s):** Historical incremental: `0003_venue_quick_picks_address_line2.sql`. **Current repo:** rolled into `0000_20260322_venue_and_activity.sql`.

**Changes:**

- Added nullable `address_line2` (`varchar(255)`) to `venue_presets`, matching `venue_addresses` and `VenuePresetItem` / `venueAddressSchema`.

**Breaking Changes:**

- None (new nullable column; existing rows default to NULL).

**Notes:**

- Admin UI and API create/update accept optional `addressLine2`; list/detail responses include it for parity with last-used and activity venue payloads.

#### 2026-03-20 - Drop unused `venues` lookup table

**Migration File(s):** Historical incremental: `0004_drop_venues.sql`. **Current repo:** rolled into `0000_20260322_venue_and_activity.sql`.

**Changes:**

- Removed `venues` (unused seeded lookup; activity venue data lives in `venue_addresses`, form presets in `venue_presets`).

**Breaking Changes:**

- None for the app (table was not referenced by services or APIs).

#### 2026-03-21 - Rename venue_quick_picks to venue_presets, add pin columns

**Migration File(s):** **Current repo:** `0000_20260322_venue_and_activity.sql`.

**Changes:**

- Renamed table from `venue_quick_picks` to `venue_presets`.
- Added `is_pinned` (`boolean`, not null, default false) - controls whether preset appears as a quick-select badge.
- Added `pinned_sort_order` (`integer`, not null, default 0) - badge display order among pinned presets.
- Removed max-4-active enforcement; all active presets now appear in the combobox dropdown.
- Added address deduplication (addressLine1 + addressLine2) on create/update.

**Breaking Changes:**

- API routes changed from `/lookups/venue-quick-picks` to `/lookups/venue-presets`.
- Response shape includes new fields `isPinned` and `pinnedSortOrder`.

**Notes:**

- Table semantics broadened: presets serve both as combobox options (all active) and pinned preset badges.

#### Benefits

- **Historical Record**: Track when and why schema changes were made
- **Breaking Change Tracking**: Easily identify changes that require application updates
- **Migration Planning**: Understand dependencies between migrations
- **Documentation**: Provides context for future developers

## Troubleshooting

### Type Assertion Errors

If you see type assertion errors with `z.ZodType & typeof schema`, that often comes from **drizzle-zod** where it is still used. Activity request/response shapes are hand-maintained Zod; prefer `validate-types` and mapper checks for those.

### Schema Drift

If schemas drift out of sync:

1. From root run `npm run validate-types --workspace=packages/shared` to identify mismatches
2. Check the validation script output
3. Update schemas or mapping functions as needed

### Mapping Errors

If `mapToResponseDto` produces invalid responses:

1. Check compile-time errors - `ensureMatchesSchema` will catch type mismatches
2. Check runtime validation errors - Zod will catch value mismatches
3. Review the mapping logic against the schema definition
