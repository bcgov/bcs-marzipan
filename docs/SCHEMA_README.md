# Schema Flow and Type Safety

This document describes the schema flow and type safety architecture in the application, explaining how database schemas flow through to API responses and frontend types.

## Overview

The application uses a layered approach to ensure type safety from the database to the frontend:

```
Database → Drizzle → Zod (auto-generated) → API Response (derived) → DTO (implements) → Frontend
```

## Key Components

### 1. Database Schema (`packages/database/src/schema/`)

- **Purpose**: Defines the database structure using Drizzle ORM
- **Location**: `packages/database/src/schema/activity.ts`
- **Types**: Inferred using `InferSelectModel` and `InferInsertModel` from Drizzle
- **Usage**: Internal use only - not exposed directly via API

### 2. Zod Schemas (`packages/shared/src/schemas/`)

#### Activity Schema (`activity.schema.ts`)

Automatically generated from Drizzle schema using `drizzle-zod`:

- `activitySchema`: Generated from `createSelectSchema(activities)` - matches database select queries
- `createActivitySchema`: Generated from `createInsertSchema(activities)` - for database inserts
- `updateActivitySchema`: Generated from `createUpdateSchema(activities)` - for database updates
- `createActivityRequestSchema`: Extends `createActivitySchema` with HTTP request transformations
- `updateActivityRequestSchema`: Extends `updateActivitySchema` for HTTP update requests
- `filterActivitiesSchema`: Custom schema for query parameter validation

#### Activity Response Schema (`activity-response.schema.ts`)

**Derived from Drizzle schema** using `createSelectSchema` and transformations:

- Base schema generated from `createSelectSchema(activities)`
- Fields omitted: internal fields (rowVersion, rowGuid, deprecated fields)
- Fields transformed:
  - Date/time fields: `Date` → ISO string (`YYYY-MM-DD`), `time` → `HH:mm` string
  - Foreign key IDs: `number` → `string` where needed (e.g., `activityStatusId`, `createdBy`)
  - Timestamps: `Date` → ISO datetime string
- Fields renamed: `leadOrgId` → `leadOrg`, `isConfidential` → `confidential`, etc.
- Computed fields added: `category`, `tags`, `jointOrg`, etc. (from relatedData)

This ensures the API response schema automatically stays in sync with database schema changes.

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

- **Schema Generation**: Zod schemas automatically generated from Drizzle
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

These Drizzle schemas are the **single source of truth** for database structure. All other type definitions are derived from or must be manually aligned with these schemas.

### How to Update the Schema

When adding or modifying fields in a database schema, follow these step-by-step instructions to ensure type safety across all layers.

#### For Activity Schema Updates

##### Step 1: Update the Drizzle Schema

Modify the activity schema definition in `packages/database/src/schema/activity.ts`:

```typescript
export const activities = pgTable('activities', {
  // ... existing fields
  newField: varchar('new_field', { length: 255 }),
  // ... rest of fields
});
```

##### Step 2: Generate Database Migration

Generate a migration file from your schema changes:

```bash
npm run db:generate --workspace=packages/database
```

This creates a new migration file in `packages/database/migrations/` (e.g., `0003_migration_name.sql`).

**Important**:

- Always let Drizzle generate migrations from your schema rather than writing ALTER TABLE statements manually
- Review the generated migration file to ensure it matches your intent
- Migration files are versioned and should be committed to version control

##### Step 3: Update API Response Schema

If the field should be exposed in API responses, update `packages/shared/src/schemas/activity-response.schema.ts`:

1. **Add to `.pick()` section**: Include the field in the fields to keep from the base schema
2. **Add to `.extend()` section**: Add explicit type definition for the field (required due to drizzle-zod type inference limitations)

Example:

```typescript
// In .pick() section
export const activityResponseSchema = baseActivitySchema
  .pick({
    // ... existing fields
    newField: true, // Add here
  })

  // In .extend() section
  .extend({
    // ... existing fields
    newField: z.string().nullable(), // Add explicit type here
  });
```

**Note**: If the field needs transformation (e.g., date to string, number to string), define the transformed type in the `.extend()` section.

##### Step 4: Update Response DTO

Update the DTO class in `packages/shared/src/dto/activity-response.dto.ts` to include the new field as a property:

```typescript
export class ActivityResponseDto implements ActivityResponse {
  // ... existing properties
  newField!: string | null; // Add property matching the schema type
}
```

The DTO class must implement the `ActivityResponse` type, so adding the property ensures compile-time type safety. The compile-time check on line 118 will catch any mismatches.

##### Step 5: Update Service Mapping (if needed)

If the field requires transformation or special handling, update the mapping function in `calendar-service/src/activities/activities.service.ts`:

- Locate the `mapToResponseDto()` method
- Add the field mapping logic if transformation is needed
- The `ensureMatchesSchema()` helper will catch type mismatches at compile time

##### Step 6: Update Type Validation File (if needed)

If you added or removed fields from the Activity schema, update `packages/shared/scripts/validate-types.ts`:

- **For new fields**: Add the field to the `_activityResponseFieldCheck` object to ensure it's validated
- **For removed fields**: Remove the field from the validation check
- **For transformed fields**: Ensure the validation reflects the transformation (e.g., number → string)

The validation file ensures compile-time type safety by checking that:

- Zod schemas match their corresponding Drizzle types
- `ActivityResponse` fields are derived from `Activity`
- Request schemas are valid

**Note**: If you only modified existing fields (e.g., changed nullability), you typically don't need to update this file - the type system will catch mismatches automatically.

##### Step 7: Run Type Validation

Verify that all types are aligned:

```bash
npm run validate-types --workspace=packages/shared
```

This script validates that:

- Zod schemas match their corresponding Drizzle types
- `ActivityResponse` fields are derived from `Activity`
- Request schemas are valid
- Lookup response schemas match their database types

**Important**: If the validation fails, review the errors and update the relevant schema files or the validation file (`packages/shared/scripts/validate-types.ts`) as needed.

##### Step 8: Update Migration Log

Document your schema changes in `packages/database/migrations/MIGRATION_LOG.md`:

1. Add a new entry with the current date
2. Reference the migration file(s) created
3. List all changes made
4. Note any breaking changes
5. Include migration notes if needed

Example:

```markdown
### 2025-01-XX - Add New Field to Activities

**Migration File(s):** `0003_add_new_field.sql`

**Changes:**

- Added `newField` varchar column to activities table

**Breaking Changes:**

- None

**Notes:**

- Field is nullable, existing records will have NULL values
```

##### Step 9: Apply Migration and Test

Apply the migration to your database:

```bash
npm run db:migrate --workspace=packages/database
```

Then test your changes:

- Run integration tests
- Test API endpoints
- Verify frontend forms if applicable

#### For Lookup Table Schema Updates

##### Step 1: Update the Drizzle Schema

Modify the lookup table schema in `packages/database/src/schema/lookups.ts`:

```typescript
export const categories = pgTable('categories', {
  // ... existing fields
  newField: varchar('new_field', { length: 255 }),
  // ... rest of fields
});
```

##### Step 2: Generate Database Migration

Generate a migration file:

```bash
npm run db:generate --workspace=packages/database
```

Review the generated migration file to ensure it's correct.

##### Step 3: Update Lookup Response Schema

Update `packages/shared/src/schemas/lookup.schema.ts` for the specific lookup type:

1. **Find the corresponding schema section** (e.g., Category schema starts around line 56)
2. **Add to `.pick()` section**: Include the field in the fields to keep
3. **Add to `.extend()` section**: Add explicit type definition
4. **Update the `*LookupItemSchema`** if the field should appear in lookup items

Example for Category:

```typescript
// Around line 59-67 - Add to .pick() section
export const categoryResponseSchema = baseCategorySchema
  .pick({
    id: true,
    name: true,
    // ... existing fields
    newField: true, // Add here
  })
  .extend({
    // Around line 68-76 - Add to .extend() section
    id: z.number().int(),
    name: z.string(),
    // ... existing fields
    newField: z.string().nullable(), // Add explicit type here
  });

// Around line 78-81 - Update lookup item schema if needed
export const categoryLookupItemSchema = lookupItemSchema.extend({
  name: z.string(),
  displayName: z.string().nullable(),
  newField: z.string().nullable(), // Add if needed in lookup items
});
```

**Note**: The pattern is repeated for each lookup type:

- Categories (lines 56-81)
- Tags (lines 87-108)
- Organizations (lines 114-141)
- Ministries (lines 147-170)
- System Users (lines 176-200)
- Pitch Statuses (lines 206-229)
- Scheduling Statuses (lines 235-258)
- Activity Statuses (lines 264-287)
- Cities (lines 293-317)
- Comms Materials (lines 323-346)
- Translation Languages (lines 352-375)
- Government Representatives (lines 381-417)

##### Step 4: Update SQL Seed File (if needed)

If you're adding new lookup values or modifying seed data, update the appropriate seed file:

- **Lookup Tables**: `packages/database/migrations/001_seed_lookup_tables.sql`
- **Activities**: `packages/database/migrations/002_seed_activities.sql`

Example for adding a new category:

```sql
-- In 001_seed_lookup_tables.sql, find the CATEGORIES section (around line 58)
INSERT INTO categories (id, name, display_name, sort_order, pitch_not_required, is_active, description, new_field)
VALUES
  (9, 'new_category', 'New Category', 9, false, true, 'Description of new category', 'default_value')
ON CONFLICT (id) DO NOTHING;
```

**Important**:

- Seed files use `ON CONFLICT DO NOTHING` or `WHERE NOT EXISTS` to make them idempotent
- Seed files are executed by the `SeedService` when running `npm run seed --workspace=calendar-service`
- Always test seed files after modification

##### Step 5: Update Type Validation File (if needed)

If you added or removed fields from the lookup schema, update `packages/shared/scripts/validate-types.ts`:

- **For new fields**: Add the field to the corresponding lookup validation check (e.g., `_categoryResponseCheck`, `_tagResponseCheck`, `_activityStatusResponseCheck`, `_cityResponseCheck`, `_govRepResponseCheck`, etc.)
- **For removed fields**: Remove the field from the validation check

**Note**: If you only modified existing fields (e.g., changed nullability), you typically don't need to update this file - the type system will catch mismatches automatically.

##### Step 6: Update Migration Log

Document your schema changes in `packages/database/migrations/MIGRATION_LOG.md`:

1. Add a new entry with the current date
2. Reference the migration file(s) created
3. List all changes made
4. Note any breaking changes
5. Include migration notes if needed

##### Step 7: Run Type Validation

Verify types are aligned:

```bash
npm run validate-types --workspace=packages/shared
```

This script validates that:

- Zod schemas match their corresponding Drizzle types
- Lookup response schemas match their database types
- Request schemas are valid

**Important**: If the validation fails, review the errors and update the relevant schema files or the validation file (`packages/shared/scripts/validate-types.ts`) as needed.

##### Step 8: Apply Migration and Seed

Apply the migration:

```bash
npm run db:migrate --workspace=packages/database
```

If you updated seed files, run the seed command:

```bash
npm run seed --workspace=calendar-service
```

#### Additional Notes

- **Request/Validation Schemas**: Automatically updated via `drizzle-zod` - no manual changes needed for `activity.schema.ts` request schemas
- **UI Forms**: Add form fields in the appropriate component sections if the field is user-editable
- **Form Defaults**: Add default values in form initialization if needed
- **Database Types**: Types in `packages/database/src/types.ts` are automatically inferred from Drizzle schemas - no manual updates needed

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
  - Communication contacts, graphics users
  - Ministries, organizations, system users

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

All schema changes must be documented in `packages/database/migrations/MIGRATION_LOG.md`. This log serves as a historical record of database schema evolution and helps track breaking changes.

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
- Added `preferences` JSONB column to `system_users` table
- Added foreign key constraint: `user_preferences.user_id` → `system_users.id`

**Breaking Changes:**

- None (new table, existing tables unchanged)

**Notes:**

- User preferences are optional, existing users will have NULL preferences
- Consider backfilling default preferences for existing users
```

#### Benefits

- **Historical Record**: Track when and why schema changes were made
- **Breaking Change Tracking**: Easily identify changes that require application updates
- **Migration Planning**: Understand dependencies between migrations
- **Documentation**: Provides context for future developers

## Troubleshooting

### Type Assertion Errors

If you see type assertion errors with `z.ZodType & typeof schema`, this is expected. The drizzle-zod library's type definitions require this pattern. The types are still safe - the assertion just helps TypeScript recognize the compatibility.

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
