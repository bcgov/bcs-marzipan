# Database schema changelog

Append-only log of notable schema and constraint changes. Regenerate SQL migrations with Drizzle Kit from `packages/database` when Drizzle schema changes.

## 2026-03-22 — Activities: optional significance

- **`activities.significance`**: Column is nullable (optional text). Aligns with `createActivityRequestSchema` / `activityDbFieldsSchema` in `@corpcal/shared`.
- **Apply**: Run `drizzle-kit generate` (or equivalent) after pulling Drizzle changes in `packages/database/src/schema/activity.ts` so your migration folder matches this repo.

## 2026-03-22 — Activity categories (API / service)

- **Cardinality**: At least one category is required on **create** (Zod + `ActivitiesService.create`). Updates that send `categoryIds` must send a non-empty array.
- **Database**: No additional DB constraint in repo migrations (FK `activity_categories.activity_id` remains `ON DELETE NO ACTION`); enforcement is API/service layer.

## 2026-03-22 — Activities: venue status

- **`activities.venue_status_id`**: Nullable FK to `venue_statuses` (TBC / TBD and related lookup rows per seeds).
- **Apply**: Reflected in Drizzle `packages/database/src/schema/activity.ts`; ensure migrations match after `drizzle-kit generate`.

## 2026-03-22 — Event planners: junction table (replaces single lead columns)

- **Removed from `activities`**: `event_planner_lead_id`, `event_planner_lead_name`, and CHECK `event_planner_lead_at_most_one`.
- **Added**: `activity_event_planners` with `event_planner_id` (nullable FK to `event_planners`), `event_planner_name` (nullable varchar), `is_lead`, `is_active`, `timestamp`. Supports multiple planners per activity; business rule “exactly one lead when the list is non-empty” is enforced in API Zod (`activity.schema.ts`), not by a DB CHECK.

## 2026-03-22 — `venue_addresses`: street split into two lines

- **`street`** replaced by **`address_line1`** and optional **`address_line2`** (nullable varchar), aligned with presets and shared `venueAddressSchema`.

## 2026-03-22 — Venue presets (replaces `venue_quick_picks`)

- **Table**: `venue_presets` with address columns matching `venue_addresses`, plus `is_pinned` and `pinned_sort_order` for badge quick-selects; `sort_order` / `is_active` unchanged in role.
- **API**: Routes and Zod types use “venue-presets” naming (`lookup.schema.ts`). Historical name: `venue_quick_picks`.

## 2026-03-22 — `cities` lookup columns

- **`province`** renamed to **`province_or_state`**; added **`country`** (nullable varchar). Drizzle + Zod (`cityResponseSchema`, `createCityRequestSchema`, etc.) updated accordingly.

## 2026-03-22 — Drop unused `venues` lookup

- **`venues`** table removed from the Drizzle schema (`lookups.ts`). Activity venue data remains on `venue_addresses`; admin combobox options use `venue_presets`.

## 2026-03-22 — Baseline migration file (branch vs `main`)

- **`main`**: `packages/database/migrations/0000_20260305_delete_audit.sql`.
- **This branch**: `packages/database/migrations/0000_20260322_venue_and_activity.sql` (full baseline including items above). Teams replacing `main`’s migration history should treat this as a new baseline snapshot from Drizzle Kit, not an incremental ALTER on top of the old file name.
