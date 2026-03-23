# Database schema changelog

Append-only log of notable schema and constraint changes. Regenerate SQL migrations with Drizzle Kit from `packages/database` when Drizzle schema changes.

## 2026-03-22 — Activities: optional significance

- **`activities.significance`**: Column is nullable (optional text). Aligns with `createActivityRequestSchema` / `activityDbFieldsSchema` in `@corpcal/shared`.
- **Apply**: Run `drizzle-kit generate` (or equivalent) after pulling Drizzle changes in `packages/database/src/schema/activity.ts` so your migration folder matches this repo.

## 2026-03-22 — Activity categories (API / service)

- **Cardinality**: At least one category is required on **create** (Zod + `ActivitiesService.create`). Updates that send `categoryIds` must send a non-empty array.
- **Database**: No additional DB constraint in repo migrations (FK `activity_categories.activity_id` remains `ON DELETE NO ACTION`); enforcement is API/service layer.
