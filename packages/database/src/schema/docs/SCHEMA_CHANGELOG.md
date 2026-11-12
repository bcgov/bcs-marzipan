# Database schema changelog

Append-only log of notable schema and constraint changes. Regenerate SQL migrations with Drizzle Kit from `packages/database` when Drizzle schema changes.

## 2026-11-02 — Ministries and organizations catalog (pending migration 0015)

- **`organization_types`**: Lookup for org category (Ministry, Agency, etc.).
- **`organizations`**: Unified catalog (`uuid`, `organization_type_id`, `jurisdiction`, **`abbreviation`**); 1:1 **`ministries`** extension (shared `id`).
- **`activity_organizations`**: Replaces `activities.lead_org_id`, `lead_org_name`, and `lead_ministry_id`; rows are catalog id and/or freeform name with exactly one `is_lead`.
- **`teams.primary_organization_id`**: Replaces `teams.ministry_id`.
- **Legacy migration (external apps)**: Backfill one `activity_organizations` lead row per activity from `lead_org_id` or `lead_org_name`; map team `ministry_id` to `primary_organization_id` via org ids; copy ministry display fields onto `organizations` before dropping duplicate columns on `ministries`.
- **`activities.display_id`**: Prefix is **lead team `abbreviation` only** (not organization abbreviation).

## 2026-10-02 — Event planners from users; teams "Share with" flag

- **`users.is_event_planner`** (boolean, default false): users offered as Event planner options on activities.
- **`activity_event_planners.event_planner_id`** now references `users.id` (was `event_planners.id`). Existing rows were converted to freeform `event_planner_name` in the migration. The `event_planners` lookup table is no longer used.
- **`teams.appears_in_share_with`** (boolean, default true): whether a team is offered in activity "Share with" options; GCPE teams 1-7 are set to false.

## 2026-03-31 — Activity saved filters: global scope across contexts

- **`activity_saved_filters`** no longer stores `context_key`; saved filters are now reused across activity-list contexts/tabs.
- **Uniqueness constraints** now enforce name uniqueness by scope without context:
  - user scope: `(owner_user_id, lower(name))`
  - team scope: `(scope_team_id, lower(name))`
  - global scope: `(lower(name))`
- **`user_activity_saved_filter_defaults`** no longer stores `context_key`; each user now has at most one default saved filter for activity lists (`uasfd_user_unique`).

## 2026-03-26 — Activity saved filters: scope + future RBAC sharing

- **`activity_saved_filters.scope_type`** supports `user` (private), `team` (team-shared), and `global` (application-wide).
- **Future RBAC plan**:
  - `savedFilters.share.global` will be granted to **Admin** roles.
  - `savedFilters.share.team` will be granted to **team owners** (specific role mapping TBD).
- Current seeds grant **basic CRUD** (`savedFilters.view/create/edit/delete`) to all roles; sharing permissions are intentionally not granted yet.

## 2026-03-22 — Activities: optional significance

- **`activities.significance`**: Column is nullable (optional text). Aligns with `createActivityRequestSchema` / `activityDbFieldsSchema` in `@corpcal/shared`.
- **Apply**: Run `drizzle-kit generate` (or equivalent) after pulling Drizzle changes in `packages/database/src/schema/activity.ts` so your migration folder matches this repo.

## 2026-03-22 — Activity categories (API / service)

- **Cardinality**: Exactly one category is required on **create** (Zod + `ActivitiesService.create`). Updates that send `categoryIds` must send an array of length 1. Wire format remains `number[]`; no DB cardinality migration.
- **Database**: No additional DB constraint in repo migrations (FK `activity_categories.activity_id` remains `ON DELETE NO ACTION`); enforcement is API/service layer.

## 2026-11-10 — Activity categories: single-select

- **API / UI**: `categoryIds` must contain exactly one id when present on create/update. List/report filters may still pass multiple category ids (OR match).

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
