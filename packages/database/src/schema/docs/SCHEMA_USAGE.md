# Schema Usage Guide

This document provides detailed usage information, examples, and behavioral patterns for the new database schema. For field mappings and structural information, see [SCHEMA_MAPPING.md](./SCHEMA_MAPPING.md).

## Table of Contents

1. [Activity Visibility and Sharing](#activity-visibility-and-sharing)
2. [Categories Access Control](#categories-access-control)
3. [Pods Access Control](#pods-access-control)
4. [Reports Configuration](#reports-configuration)
5. [Activity Report Settings](#activity-report-settings)
6. [Venue Quick Picks and Last-Used Addresses](#venue-quick-picks-and-last-used-addresses)

---

## Activity Visibility and Sharing

Activities use a two-layer visibility and sharing model:

### Visibility: Controls Base Access

1. **`visibility = 'global'`**: Activity is visible to all teams (default)
2. **`visibility = 'team'`**: Activity is visible only to:
   - The creator's team (via `leadMinistryId` → team mapping)
   - Special teams (Admin, Approver, Issues) - these teams always see all activities regardless of visibility

### Sharing: Overrides Visibility and Marks as Important

- Activities can be shared with specific Editor-type teams via the `activitySharedWithTeams` junction table
- When `visibility = 'team'` and an activity is shared with a team: sharing grants access (overrides visibility restriction) AND marks the activity as important/highlighted for that team
- When `visibility = 'global'` and an activity is shared with a team: all teams can see it, but the shared team sees it as important/highlighted

### Legacy Mapping

- `IsCrossGovernment = true` → `visibility = 'global'` (no sharing entries needed)
- `IsCrossGovernment = false` + `ActivitySharedWith` entries → `visibility = 'team'`, migrate to `activitySharedWithTeams` (map ministries to their corresponding teams)
- `IsCrossGovernment = false` + no `ActivitySharedWith` → `visibility = 'team'`, no sharing entries

### Related Tables

- `activitySharedWithTeams`: Many-to-many relationship between Activities and Teams - defines which teams an activity is shared with (Editor-type teams). Sharing grants access when `visibility='team'` and marks activities as important/highlighted.

---

## Categories Access Control

Categories use an explicit visibility model aligned with the pods visibility pattern:

- **`visibility = 'global'`**: Category is viewable by all teams (default)
- **`visibility = 'team'`**: Category is viewable only by teams listed in the `teamCategories` junction table

This replaces the previous implicit model where categories with no entries in `teamCategories` were considered global. The explicit field enables:

- More efficient queries (indexed field vs. checking junction table emptiness)
- Consistent patterns with pods visibility
- Clearer intent in the schema

### Alignment with Pods

The categories visibility model aligns with the pods visibility pattern:

- Both use an explicit `visibility` field with 'global' and 'team' values
- Both use junction tables (`teamCategories` for categories, `podSharedWithTeams` for pods) to define team access
- Both follow the same query pattern: check visibility field first, then consult junction table if needed

### Related Tables

- **Junction Tables**:
  - `teamCategories`: Many-to-many relationship between Categories and Teams for team-scoped access control (used when `visibility = 'team'`)

---

## Pods Access Control

Pods use an explicit visibility model with three levels:

- **`visibility = 'global'`**: Pod is viewable by all users
- **`visibility = 'team'`**: Pod is viewable only by teams listed in the `podSharedWithTeams` junction table
- **`visibility = 'private'`**: Pod is viewable only by the creator (`createdBy`)

The visibility field enables:

- Efficient queries (indexed field vs. checking junction table or creator)
- Clear access control intent in the schema
- Consistent patterns with categories visibility

### Alignment with Categories

The pods visibility model aligns with the categories visibility pattern:

- Both use an explicit `visibility` field
- Both use junction tables (`podSharedWithTeams` for pods, `teamCategories` for categories) to define team access
- Both follow the same query pattern: check visibility field first, then consult junction table if needed
- Categories support 'global' and 'team' visibility; pods additionally support 'private' visibility for creator-only access

### Related Tables

- **Junction Tables**:
  - `podMinistries`: Many-to-many relationship between Pods and Ministries - defines which ministries are included in a pod
  - `podSharedWithTeams`: Many-to-many relationship between Pods and Teams - defines team access when `visibility = 'team'`

### PodMinistries Junction Table

| Field Name   | Type                       | Description                                        |
| ------------ | -------------------------- | -------------------------------------------------- |
| `podId`      | `integer`                  | FK to Pods - primary key component                 |
| `ministryId` | `uuid`                     | FK to Ministries - primary key component           |
| `isPrimary`  | `boolean`                  | Flag indicating if this is the primary ministry    |
| `sortOrder`  | `integer`                  | Order for displaying ministries within the pod     |
| `isActive`   | `boolean`                  | Whether the relationship is active (default: true) |
| `timestamp`  | `timestamp with time zone` | Timestamp for the relationship (default: now)      |

### PodSharedWithTeams Junction Table

| Field Name  | Type                       | Description                                        |
| ----------- | -------------------------- | -------------------------------------------------- |
| `podId`     | `integer`                  | FK to Pods - primary key component                 |
| `teamId`    | `integer`                  | FK to Teams - primary key component                |
| `isActive`  | `boolean`                  | Whether the relationship is active (default: true) |
| `timestamp` | `timestamp with time zone` | Timestamp for the relationship (default: now)      |

---

## Reports Configuration

The `config` field in the `reports` table stores a JSONB object that defines how activities are included and rendered in different report types.

### Configuration Structure

```typescript
{
  fields: string[]; // Activity field names to display
  globalFilter?: FilterConfig; // Optional global filter applied to all activities in the report
  sections: Array<{
    id: string;
    name: string;
    order: number;
    filter?: FilterConfig; // Optional section filter that augments/updates the global filter
  }>;
}
```

### Filter Merging Behavior

- The `globalFilter` applies to all activities in the report
- Each section's `filter` augments or updates the `globalFilter` for that specific section
- Properties in the section filter take precedence over the global filter
- Use the `mergeReportFilters()` utility function from `@corpcal/shared/schemas` to merge filters

### Example: Look Ahead Config

```json
{
  "fields": [
    "title",
    "summary",
    "executiveSummary",
    "lookAheadStatus",
    "lookAheadSection"
  ],
  "sections": [
    {
      "id": "events",
      "name": "Events",
      "order": 1,
      "filter": { "lookAheadSection": "events" }
    },
    {
      "id": "issues",
      "name": "Issues",
      "order": 2,
      "filter": { "lookAheadSection": "issues" }
    }
  ]
}
```

### Example: Config with Global Filter

```json
{
  "fields": ["title", "summary", "startDate", "endDate"],
  "globalFilter": {
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-01-07"
    }
  },
  "sections": [
    {
      "id": "monday",
      "name": "Monday",
      "order": 1,
      "filter": {
        "dateRange": {
          "start": "2024-01-01",
          "end": "2024-01-01"
        }
      }
    },
    {
      "id": "tuesday",
      "name": "Tuesday",
      "order": 2,
      "filter": {
        "dateRange": {
          "start": "2024-01-02",
          "end": "2024-01-02"
        }
      }
    }
  ]
}
```

In this example, the global filter restricts activities to the week of January 1-7, and each section further filters to a specific day within that week.

### Report Visibility

- **`visibility = 'global'`**: Report is visible to all teams (e.g., Look Ahead)
- **`visibility = 'team'`**: Report is visible only to the creator's team (e.g., 30/60/90)

---

## Activity Report Settings

### Inclusion Logic

Activity inclusion in reports is determined by `isConfidential` (on activities) and `omitted` (on activityReportSettings):

1. If `omitted=true` → Activity is omitted from report (regardless of isConfidential)
2. If `omitted=false` and `isConfidential=false` → Activity included with standard details
3. If `omitted=false` and `isConfidential=true` → Activity included with placeholder (redacted) details

### Behavior

1. **Default Creation**: When an activity is created, default rows are automatically created for all active reports with `omitted=false`.

2. **Omission Override**: Users can update the omitted value to exclude activities from specific reports.

3. **Completeness**: Every activity must have a setting for every active report. Missing combinations are created with defaults when needed.

### Legacy Mapping

This table replaces the legacy boolean flags on the Activity table:

- **`IsConfidential` (notForLookAhead)**:
  - Legacy: Boolean flag indicating activity should not appear in look-ahead report or should appear redacted
  - New: `isConfidential=true` on activities (for placeholder) + `omitted=true` in activityReportSettings (for omission)
  - Migration: `isConfidential=true` → `isConfidential=true` on activities

- **`notForThirtySixtyNinety`**:
  - Legacy: Boolean flag indicating activity should not appear in 30/60/90 day report
  - New: `omitted=true` for 'thirty-sixty-ninety' report
  - Migration: `notForThirtySixtyNinety=true` → `omitted=true` for thirty-sixty-ninety report

### Indexes

- Primary key on `(activityId, reportId)`
- Index on `activityId` for efficient activity lookups
- Index on `reportId` for efficient report lookups
- Composite index on `(activityId, reportId)` for join performance
- Index on `omitted` for filtering by omission status

---

## Tags Access Control

Tags use an explicit visibility model similar to categories:

- **`visibility = 'global'`**: Tag is viewable by all teams (current default - all tags are global)
- **`visibility = 'team'`**: Tag is viewable only by specific teams (future feature - not yet implemented)

**NOTE:** All tags are currently global. Team visibility is a future feature flag. When team visibility is implemented, tags with `visibility = 'team'` will be restricted to specific teams via a junction table (similar to `teamCategories` for categories).

### Current Implementation

- All tags have `visibility = 'global'` by default
- All tags are viewable by all teams
- No team-based access control is currently enforced

### Future Implementation

When team visibility is enabled:

- Tags with `visibility = 'team'` will be restricted via a junction table (e.g., `teamTags`)
- Query pattern will follow the same approach as categories: check visibility field first, then consult junction table if needed

---

## Venue Quick Picks and Last-Used Addresses

The activity form (Create/Edit) shows quick-pick venue tags under the Venue address input so users can one-click fill the venue.

### Data sources

- **Fixed quick-picks (max 4)**: Stored in `venue_quick_picks` with the same address columns as `venue_addresses` (including optional `address_line2`). Admins configure these in Administration (Venue Quick Picks). Only active rows (`is_active = true`) are returned by the API; the app enforces a maximum of 4 active rows on create/update.
- **Last-used (up to 2)**: Derived from `venue_addresses` joined to `activities` where `activities.last_updated_by = current user`, ordered by `activities.last_updated_date_time` desc, deduplicated by address and limited to 2. No separate table.

### Behaviour

- The form shows up to 4 fixed tags plus up to 2 last-used tags (total quick-pick slots capped at 4: if 3 fixed are configured, only 1 last-used is shown).
- Clicking a tag sets the form’s `venueAddress` (venueName, addressLine1, addressLine2, city, provinceOrState, country) and updates the address input via the controlled `value` prop on the address autocomplete.
