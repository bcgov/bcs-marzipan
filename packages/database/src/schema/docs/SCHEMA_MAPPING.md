# Schema Mapping: Legacy to New

This document provides a comprehensive mapping between the legacy database schema and the new schema. It shows how fields, relationships, and data structures have been transformed during the migration.

> **Note:** For detailed usage information, examples, and behavioral patterns, see [SCHEMA_USAGE.md](./SCHEMA_USAGE.md).

## ID Type Conventions

### Database Layer

- **Serial IDs**: Most lookup tables use `serial` (integer) primary keys
- **UUID IDs**: ministries, organizations, themes, sectors use UUID primary keys

### API Response Layer

ID types match database types for true end-to-end type safety:

- **Serial IDs**: Returned as `number` (matches database `serial` type)
- **UUID IDs**: Returned as `string` (matches database `uuid` type)

This provides type safety from database → API → frontend → API → database with no conversion required.

### Legacy Migration Notes

When migrating legacy data:

- Integer IDs map directly (no conversion needed)
- GUID/UUID fields map to UUID columns
- Legacy `RowGuid` field has been removed (unused in business logic)

## Table of Contents

1. [Activity](#activity)
2. [Teams](#teams)
3. [Categories](#categories)
4. [Pods](#pods)
5. [Reports](#reports)
6. [ActivityReportSettings](#activityreportsettings)

---

## Activity

**Legacy Table Name:** `[Gcpe.Hub].[calendar].[Activity]`  
**New Table Name:** `activities`

**Description:** Core entity for calendar events. Represents activities, meetings, and events in the government calendar system. Contains comprehensive information about event details, scheduling, status, and metadata.

### Field Mappings

| Legacy Field Name                   | Legacy Type         | New Field Name                                | New Type                   | New Constraints                                         | Mapping Notes                                                                                                                                      |
| ----------------------------------- | ------------------- | --------------------------------------------- | -------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | `int` (serial)      | `id`                                          | `serial`                   | `notNull`, primary key                                  | Direct mapping - Primary key                                                                                                                       |
| `StartDateTime`                     | `datetime`          | `startDate` + `startTime`                     | `date` + `time`            | nullable                                                | Split into separate date and time fields                                                                                                           |
| `EndDateTime`                       | `datetime`          | `endDate` + `endTime`                         | `date` + `time`            | nullable                                                | Split into separate date and time fields                                                                                                           |
| `PotentialDates`                    | `nvarchar(70)`      | _Removed_                                     | -                          | -                                                       | Field removed in new schema (deprecated in legacy)                                                                                                 |
| `Title`                             | `nvarchar(500)`     | `title`                                       | `varchar(255)`             | `notNull`                                               | Direct mapping, length reduced from 500 to 255, now required (not nullable)                                                                        |
| `Details`                           | `nvarchar(700)`     | `summary`                                     | `text`                     | `notNull`                                               | Renamed from Details to Summary, type changed to text (unlimited length), now required (not nullable)                                              |
| `Schedule`                          | `nvarchar(500)`     | `schedulingNotes`                             | `text`                     | nullable                                                | Renamed and type changed to text (500 char limit in comments)                                                                                      |
| `Significance`                      | `nvarchar(500)`     | `significance`                                | `text`                     | `notNull`                                               | Type changed from varchar(500) to text, now required (not nullable)                                                                                |
| `Strategy`                          | `nvarchar(500)`     | `strategy`                                    | `text`                     | nullable                                                | Type changed from varchar(500) to text                                                                                                             |
| `Comments`                          | `nvarchar(4000)`    | `notes`                                       | `text`                     | nullable                                                | Renamed from Comments to notes, type changed to text (nullable)                                                                                    |
| `HqComments`                        | `nvarchar(2000)`    | `executiveSummary`                            | `text`                     | nullable                                                | Renamed from HqComments to executiveSummary, type changed to text                                                                                  |
| `LeadOrganization`                  | `nvarchar(100)`     | `leadOrgId` + `leadOrgName`                   | `uuid` + `varchar(255)`    | nullable (XOR constraint: exactly one must be provided) | Split into FK to Organizations table (leadOrgId) or free text (leadOrgName) - mutually exclusive (XOR)                                             |
| `Translations`                      | `nvarchar(500)`     | _Moved to activityTranslationsRequired_       | -                          | -                                                       | Moved to junction table activityTranslationsRequired                                                                                               |
| `StatusId`                          | `int`               | `activityStatusId`                            | `integer`                  | `notNull`, FK                                           | Renamed, now required (not nullable), FK to ActivityStatus (replaces generic Status)                                                               |
| `HqStatusId`                        | `int`               | `lookAheadStatus`                             | `varchar(50)`              | nullable                                                | Changed from FK to Status to enum-like varchar: 'none', 'new', 'changed'                                                                           |
| `HqSection`                         | `int`               | `lookAheadSection`                            | `varchar(50)`              | nullable                                                | Changed from integer to enum-like varchar: 'events', 'issues', 'news', 'awareness'                                                                 |
| `IsConfidential`                    | `bit`               | `isConfidential`                              | `boolean`                  | `notNull`, `default(false)`                             | Returned to activities table - activity-level property that determines placeholder inclusion                                                       |
| `NRDateTime`                        | `datetime`          | `newsReleaseDateTime`                         | `timestamp with time zone` | nullable                                                | Renamed from NRDateTime to newsReleaseDateTime                                                                                                     |
| `NRDistributionId`                  | `int`               | `newsReleaseDistributionId`                   | `integer`                  | nullable, FK                                            | Direct mapping, FK to NRDistribution (nullable)                                                                                                    |
| `PremierRequestedId`                | `int`               | `premierRequestedId`                          | `integer`                  | nullable, FK                                            | Direct mapping, FK to PremierRequested (nullable)                                                                                                  |
| `ContactMinistryId`                 | `unique identifier` | `leadMinistryId`                              | `uuid`                     | `notNull`, FK                                           | Renamed from ContactMinistryId to leadMinistryId, now required (not nullable) - required for displayId generation                                  |
| `GovernmentRepresentativeId`        | `int`               | _Moved to activityRepresentatives_            | -                          | -                                                       | Moved to junction table activityRepresentatives                                                                                                    |
| `CommunicationContactId`            | `int`               | `commsContactLeadId`                          | `integer`                  | `notNull`, FK                                           | Direct mapping, FK changed from CommunicationContact lookup table to SystemUser, now required (not nullable)                                       |
| `EventPlannerId`                    | `int`               | `eventPlannerLeadId` + `eventPlannerLeadName` | `integer` + `varchar(255)` | nullable (XOR constraint: exactly one must be provided) | Split into FK to EventPlanner lookup table (eventPlannerLeadId) or free text (eventPlannerLeadName) - mutually exclusive (XOR)                     |
| `VideographerId`                    | `int`               | _Removed_                                     | -                          | -                                                       | Field removed - no longer needed                                                                                                                   |
| `Venue`                             | `nvarchar(150)`     | _Moved to venueAddresses table_               | -                          | -                                                       | Moved to separate venueAddresses table                                                                                                             |
| `CityId`                            | `int`               | _Moved to venueAddresses table_               | -                          | -                                                       | Moved to separate venueAddresses table                                                                                                             |
| `OtherCity`                         | `nvarchar(150)`     | _Moved to venueAddresses table_               | -                          | -                                                       | Moved to separate venueAddresses table                                                                                                             |
| `IsActive`                          | `bit`               | `isActive`                                    | `boolean`                  | `notNull`, `default(true)`                              | Direct mapping, default changed from false to true                                                                                                 |
| `IsConfirmed`                       | `bit`               | `dateStatusId`                                | `integer`                  | `notNull`, FK                                           | Replaced with FK to DateStatus lookup table                                                                                                        |
| `IsIssue`                           | `bit`               | `isIssue`                                     | `boolean`                  | `notNull`, `default(false)`                             | Direct mapping                                                                                                                                     |
| `IsAllDay`                          | `bit`               | `isAllDay`                                    | `boolean`                  | `notNull`, `default(false)`                             | Direct mapping                                                                                                                                     |
| `IsAtLegislature`                   | `bit`               | _Removed_                                     | -                          | -                                                       | Redundant with venue                                                                                                                               |
| `IsCrossGovernment`                 | `bit`               | `visibility`                                  | `varchar(50)`              | `notNull`, `default('global')`                          | Changed from boolean to enum-like varchar: 'global' (maps to IsCrossGovernment=true) or 'team' (maps to IsCrossGovernment=false), default 'global' |
| `IsMilestone`                       | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed in new schema (deprecated in legacy)                                                                                                 |
| `IsTitleNeedsReview`                | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsDetailsNeedsReview`              | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsRepresentativeNeedsReview`       | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsCityNeedsReview`                 | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsStartDateNeedsReview`            | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsEndDateNeedsReview`              | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsCategoriesNeedsReview`           | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsCommMaterialsNeedsReview`        | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsActiveNeedsReview`               | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsSignificanceNeedsReview`         | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsStrategyNeedsReview`             | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsschedulingNotesNeedsReview`      | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsInternalNotesNeedsReview`        | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsLeadOrganizationNeedsReview`     | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsInitiativesNeedsReview`          | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsTagsNeedsReview`                 | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsOriginNeedsReview`               | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsDistributionNeedsReview`         | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsTranslationsRequiredNeedsReview` | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsPremierRequestedNeedsReview`     | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsVenueNeedsReview`                | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsEventPlannerNeedsReview`         | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `IsDigitalNeedsReview`              | `bit`               | _Removed_                                     | -                          | -                                                       | Field removed - change status will be tracked elsewhere                                                                                            |
| `CreatedDateTime`                   | `datetime`          | `createdDateTime`                             | `timestamp with time zone` | `notNull`, `defaultNow()`                               | Direct mapping, now required (not nullable) with defaultNow()                                                                                      |
| `CreatedBy`                         | `int`               | `createdBy`                                   | `integer`                  | `notNull`, FK                                           | Direct mapping, now required (not nullable)                                                                                                        |
| `LastUpdatedDateTime`               | `datetime`          | `lastUpdatedDateTime`                         | `timestamp with time zone` | `notNull`, `defaultNow()`                               | Direct mapping, now required (not nullable) with defaultNow()                                                                                      |
| `LastUpdatedBy`                     | `int`               | `lastUpdatedBy`                               | `integer`                  | `notNull`, FK                                           | Direct mapping, now required (not nullable)                                                                                                        |
| `TimeStamp`                         | `timestamp`         | `rowVersion`                                  | `bigint`                   | `notNull`, `default(0)`                                 | Renamed from TimeStamp to rowVersion, type changed to bigint for optimistic concurrency control                                                    |
| `RowGuid`                           | `unique identifier` | _Removed_                                     | -                          | -                                                       | Field removed - unused in business logic                                                                                                           |

### New Fields (Not in Legacy Schema)

| New Field Name        | Type          | New Constraints             | Description                                                                                      |
| --------------------- | ------------- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| `displayId`           | `varchar(50)` | `unique`                    | Computed field: {ministryAbbreviation}-{paddedLast6Digits} format (e.g., AG-000123, HLTH-456789) |
| `dateStatusId`        | `integer`     | `notNull`, FK               | FK to DateStatus - replaces legacy IsConfirmed boolean                                           |
| `timeStatusId`        | `integer`     | `notNull`, FK               | FK to TimeStatus - new field for time confirmation status                                        |
| `newsReleaseOriginId` | `integer`     | nullable, FK                | FK to NewsReleaseOrigin lookup table                                                             |
| `newsReleaseId`       | `uuid`        | nullable                    | Reference to news release                                                                        |
| `pitchDate`           | `date`        | nullable                    | Date when activity was or will be pitched (nullable)                                             |
| `isConfidential`      | `boolean`     | `notNull`, `default(false)` | Activity-level property - if true, activity shows as placeholder in reports (default: false)     |

### Moved to Separate Tables

| Legacy Field Name            | New Location                                  | Notes                                                                |
| ---------------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| `Venue`                      | `venueAddresses` table                        | Venue information moved to dedicated table                           |
| `CityId`                     | `venueAddresses` table                        | City reference moved to venueAddresses table                         |
| `OtherCity`                  | `venueAddresses` table                        | Other city name moved to venueAddresses table                        |
| `Translations`               | `activityTranslationsRequired` junction table | Moved to many-to-many relationship                                   |
| `GovernmentRepresentativeId` | `activityRepresentatives` junction table      | Moved to many-to-many relationship (allows multiple representatives) |

### Junction Table Mappings

| Legacy Junction Table            | New Junction Table                | Notes                                                                                                                                                           |
| -------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ActivityCategories`             | `activityCategories`              | Direct mapping                                                                                                                                                  |
| `ActivityThemes`                 | `activityThemes`                  | Direct mapping                                                                                                                                                  |
| `ActivityKeywords`               | `activityTags`                    | Renamed from activityKeywords (misaligned naming in legacy). Tags now use integer IDs (renamed from keywords table).                                            |
| `ActivityTags`                   | `activitySubscriptions`           | Renamed from activityTags (misaligned naming in legacy). This table is for activity subscriptions to tags.                                                      |
| `ActivitySharedWith`             | `activitySharedWithTeams`         | Renamed from ministries to teams - sharing grants access when visibility='team' and marks activities as important/highlighted                                   |
| `ActivityCommunicationMaterials` | `activityCommsMaterials`          | Renamed                                                                                                                                                         |
| `ActivityNROrigins`              | _Removed_                         | Replaced with direct FK `newsReleaseOriginId` on activities table (single optional reference)                                                                   |
| `ActivitySectors`                | `activitySectors`                 | Direct mapping                                                                                                                                                  |
| `FavoriteActivity`               | `favoriteActivities`              | Renamed (pluralized)                                                                                                                                            |
| -                                | `activityTranslationsRequired`    | New - replaces legacy Translations field                                                                                                                        |
| -                                | `activityRepresentatives`         | New - replaces legacy GovernmentRepresentativeId (allows multiple)                                                                                              |
| -                                | `activityAdditionalCommsContacts` | New - for additional comms contacts                                                                                                                             |
| -                                | `activityReportSettings`          | New - replaces legacy IsConfidential and notForThirtySixtyNinety boolean flags. Uses `omitted` boolean to control whether activities are excluded from reports. |
| -                                | `teamCategories`                  | New - controls team access to categories (access control)                                                                                                       |

### Key Transformations

1. **Date/Time Split**: `StartDateTime` and `EndDateTime` have been split into separate `startDate`/`startTime` and `endDate`/`endTime` fields, allowing for more flexible scheduling.

2. **Status Fields**:
   - `StatusId` → `activityStatusId` (now required, FK to ActivityStatus)
   - `HqStatusId` → `lookAheadStatus` (changed from FK to enum-like varchar)
   - `IsConfirmed` → `dateStatusId` (replaced boolean with FK to DateStatus)
   - New: `timeStatusId` (FK to TimeStatus)

3. **Organization Fields**:
   - `LeadOrganization` → Split into `leadOrgId` (FK) or `leadOrgName` (free text) with XOR constraint
   - News Release Origin: Handled through `ActivityNROrigins` junction table in legacy, now uses direct FK `newsReleaseOriginId` (integer FK to NewsReleaseOrigin lookup table) for a single optional reference per activity

4. **Text Field Expansions**: Several varchar fields have been changed to `text` type for unlimited length:
   - `Details` → `summary` (text, required)
   - `Significance` → `significance` (text, required)
   - `Schedule` → `schedulingNotes` (text)
   - `Strategy` → `strategy` (text)
   - `HqComments` → `executiveSummary` (text)

5. **Venue Management**: Venue-related fields (`Venue`, `CityId`, `OtherCity`) have been moved to a separate `venueAddresses` table for better normalization.

6. **Audit Fields**:
   - `TimeStamp` → `rowVersion` (bigint for optimistic concurrency control)
   - `CreatedDateTime` and `LastUpdatedDateTime` are now required with default values
   - `CreatedBy` and `LastUpdatedBy` are now required
   - `RowGuid` field has been removed (unused in business logic)

7. **Removed Fields**: Several legacy fields have been removed:
   - `PotentialDates` (deprecated in legacy)
   - `VideographerId` (removed - no longer needed)
   - `IsAtLegislature` (redundant with venue)
   - `IsConfidential` → `isConfidential` on activities table (returned to activities)
   - `IsMilestone` (deprecated in legacy)
   - `pitchStatusId` (removed - pitch workflow simplified)
   - `pitchComments` (removed - pitch workflow simplified)
   - `calendarVisibility` (removed)
   - `venueStatusId` (removed)
   - `eventLeadOrgId` and `eventLeadOrgName` (removed)

8. **New Features**:
   - `displayId`: Computed display identifier with ministry prefix
   - `activityReportSettings`: Junction table for per-activity report settings. Uses `omitted` boolean to control whether activities are excluded from reports. Combined with `isConfidential` on activities to determine inclusion behavior.
   - `reports`: Lookup table for report types (e.g., 'look-ahead', 'thirty-sixty-ninety'). Includes `visibility` (global/team) and `config` (JSONB) for configurable report structure.
   - `isConfidential`: Activity-level boolean property that determines placeholder inclusion when combined with `omitted` flag.
   - `commsContactLeadId` and `leadMinistryId`: Enhanced comms contact model (FK changed from CommunicationContact to SystemUser for commsContactLeadId, renamed contactMinistryId to leadMinistryId)
   - `pitchDate`: Date tracking for pitch workflow
   - `notes`: General notes field (mapped from legacy Comments)
   - `newsReleaseDistributionId`: News release distribution (mapped from legacy NRDistributionId)
   - `premierRequestedId`: Premier request tracking (mapped from legacy PremierRequestedId)
   - `visibility`: Activity visibility control - 'global' (visible to all teams) or 'team' (visible only to creator's team + special teams), default 'global' (mapped from legacy IsCrossGovernment)

### Visibility and Sharing

Activities use a two-layer visibility and sharing model. For detailed usage information, see [Activity Visibility and Sharing](./SCHEMA_USAGE.md#activity-visibility-and-sharing) in the usage guide.

**Legacy Mapping:**

- `IsCrossGovernment = true` → `visibility = 'global'` (no sharing entries needed)
- `IsCrossGovernment = false` + `ActivitySharedWith` entries → `visibility = 'team'`, migrate to `activitySharedWithTeams` (map ministries to their corresponding teams)
- `IsCrossGovernment = false` + no `ActivitySharedWith` → `visibility = 'team'`, no sharing entries

### Constraints

The new schema includes several CHECK constraints to enforce mutual exclusivity (see "New Constraints" column in Field Mappings above for field-level constraints):

- `lead_org_xor`: Exactly one of `leadOrgId` or `leadOrgName` must be provided (XOR constraint)
- `event_planner_lead_xor`: Exactly one of `eventPlannerLeadId` or `eventPlannerLeadName` must be provided (XOR constraint)

Field-level constraints are documented in the "New Constraints" column of the Field Mappings table above. Common constraint types include:

- `notNull`: Field is required and cannot be null
- `default(value)`: Field has a default value if not provided
- `defaultNow()`: Field defaults to current timestamp
- `defaultRandom()`: Field defaults to a random UUID
- `unique`: Field must have unique values across all rows
- `FK`: Foreign key constraint to another table
- `nullable`: Field can be null (no constraint specified means nullable)

---

## Teams

**Legacy Table Name:** _N/A (New table) users were previously grouped by ministries_  
**New Table Name:** `teams`

**Description:** Groups of system users for team-based access control. This is a placeholder table that represents a group of systemUsers that can be used for category access control. Full implementation is pending.

### Field Mappings

| New Field Name        | New Type                   | New Constraints            | Description                                                        |
| --------------------- | -------------------------- | -------------------------- | ------------------------------------------------------------------ |
| `id`                  | `serial`                   | `notNull`, primary key     | Primary key                                                        |
| `name`                | `varchar(255)`             | `notNull`                  | Team name (required)                                               |
| `displayName`         | `varchar(255)`             | nullable                   | Display name for the team (nullable)                               |
| `description`         | `text`                     | nullable                   | Team description (nullable)                                        |
| `isActive`            | `boolean`                  | `notNull`, `default(true)` | Whether the team is active (default: true)                         |
| `createdDateTime`     | `timestamp with time zone` | `notNull`, `defaultNow()`  | Date and time the record was created (required, default: now)      |
| `createdBy`           | `integer`                  | `notNull`, FK              | FK to SystemUser - user who created the record (required)          |
| `lastUpdatedDateTime` | `timestamp with time zone` | `notNull`, `defaultNow()`  | Date and time the record was last updated (required, default: now) |
| `lastUpdatedBy`       | `integer`                  | `notNull`, FK              | FK to SystemUser - user who last updated the record (required)     |

### Notes

- **Placeholder Table**: This table is marked as a placeholder with TODO comments. Full implementation is pending.
- **Purpose**: Used for team-based access control, particularly for controlling which teams can view specific categories via the `teamCategories` junction table.
- **Future Implementation**: A `teamSystemUsers` junction table will be added when teams are fully implemented to link teams to system users.

### Related Tables

- **Junction Tables**:
  - `teamCategories`: Many-to-many relationship between Teams and Categories for access control

---

## Categories

**Legacy Table Name:** `[Gcpe.Hub].[calendar].[Category]`  
**New Table Name:** `categories`

**Description:** Classification categories for activities. Categories can be restricted to specific teams via the visibility field and teamCategories junction table.

### Field Mappings

| Legacy Field Name     | Legacy Type     | New Field Name        | New Type                   | New Constraints                | Mapping Notes                                                                                                                                    |
| --------------------- | --------------- | --------------------- | -------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                  | `int` (serial)  | `id`                  | `serial`                   | `notNull`, primary key         | Direct mapping - Primary key                                                                                                                     |
| `name`                | `nvarchar(255)` | `name`                | `varchar(255)`             | `notNull`                      | Direct mapping                                                                                                                                   |
| `displayName`         | `nvarchar(255)` | `displayName`         | `varchar(255)`             | `notNull`                      | Direct mapping                                                                                                                                   |
| `sortOrder`           | `int`           | `sortOrder`           | `integer`                  | `notNull`, `default(0)`        | Direct mapping                                                                                                                                   |
| `pitchRequired`       | `bit`           | `pitchRequired`       | `boolean`                  | `notNull`, `default(false)`    | Direct mapping                                                                                                                                   |
| -                     | -               | `visibility`          | `varchar(50)`              | `notNull`, `default('global')` | **New field** - Controls category visibility: 'global' (visible to all teams) or 'team' (visible only to teams in teamCategories junction table) |
| `isActive`            | `bit`           | `isActive`            | `boolean`                  | `notNull`, `default(true)`     | Direct mapping                                                                                                                                   |
| `description`         | `nvarchar(max)` | `description`         | `text`                     | nullable                       | Direct mapping                                                                                                                                   |
| `createdDateTime`     | `datetime`      | `createdDateTime`     | `timestamp with time zone` | `notNull`, `defaultNow()`      | Direct mapping                                                                                                                                   |
| `createdBy`           | `int`           | `createdBy`           | `integer`                  | `notNull`, FK                  | Direct mapping - FK to SystemUser                                                                                                                |
| `lastUpdatedDateTime` | `datetime`      | `lastUpdatedDateTime` | `timestamp with time zone` | `notNull`, `defaultNow()`      | Direct mapping                                                                                                                                   |
| `lastUpdatedBy`       | `int`           | `lastUpdatedBy`       | `integer`                  | `notNull`, FK                  | Direct mapping - FK to SystemUser                                                                                                                |

### Access Control

Categories use an explicit visibility model aligned with the pods visibility pattern. For detailed usage information, see [Categories Access Control](./SCHEMA_USAGE.md#categories-access-control) in the usage guide.

### Related Tables

- **Junction Tables**:
  - `teamCategories`: Many-to-many relationship between Categories and Teams for team-scoped access control (used when `visibility = 'team'`)

---

## Pods

**Legacy Table Name:** _N/A (New table)_  
**New Table Name:** `pods`

**Description:** Collections of ministries defined by users. Admins and editors can create pods with global, team-scoped, or private visibility. Users access pods through their team memberships.

### Field Mappings

| New Field Name        | New Type                   | New Constraints                 | Description                                                           |
| --------------------- | -------------------------- | ------------------------------- | --------------------------------------------------------------------- |
| `id`                  | `serial`                   | `notNull`, primary key          | Primary key                                                           |
| `name`                | `varchar(200)`             | `notNull`                       | Pod name (required)                                                   |
| `description`         | `varchar(500)`             | nullable                        | Pod description (nullable)                                            |
| `visibility`          | `varchar(50)`              | `notNull`, `default('private')` | Visibility level: 'global', 'team', or 'private' (default: 'private') |
| `createdBy`           | `integer`                  | `notNull`, FK                   | FK to SystemUser - user who created the pod (required)                |
| `isActive`            | `boolean`                  | `notNull`, `default(true)`      | Whether the pod is active (default: true)                             |
| `createdDateTime`     | `timestamp with time zone` | `notNull`, `defaultNow()`       | Date and time the record was created (required, default: now)         |
| `lastUpdatedDateTime` | `timestamp with time zone` | `notNull`, `defaultNow()`       | Date and time the record was last updated (required, default: now)    |
| `lastUpdatedBy`       | `integer`                  | `notNull`, FK                   | FK to SystemUser - user who last updated the record (required)        |

### Access Control

Pods use an explicit visibility model with three levels: 'global', 'team', and 'private'. For detailed usage information, see [Pods Access Control](./SCHEMA_USAGE.md#pods-access-control) in the usage guide.

### Related Tables

- **Junction Tables**:
  - `podMinistries`: Many-to-many relationship between Pods and Ministries - defines which ministries are included in a pod
  - `podSharedWithTeams`: Many-to-many relationship between Pods and Teams - defines team access when `visibility = 'team'`

---

## Reports

**Legacy Table Name:** _N/A (New table)_  
**New Table Name:** `reports`

**Description:** Report types with configurable fields, sections, and visibility. Defines how activities are included/rendered in different report types. Examples include 'look-ahead', 'thirty-sixty-ninety', and future custom reports.

### Field Mappings

| New Field Name        | New Type                   | New Constraints              | Description                                                                                                                         |
| --------------------- | -------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `id`                  | `serial`                   | `notNull`, primary key       | Primary key                                                                                                                         |
| `name`                | `varchar(255)`             | `notNull`, `unique`          | Unique identifier like 'look-ahead', 'thirty-sixty-ninety' (required, unique)                                                       |
| `displayName`         | `varchar(255)`             | `notNull`                    | User-friendly name like 'Look Ahead', '30/60/90 Day Report' (required)                                                              |
| `sortOrder`           | `integer`                  | `notNull`, `default(0)`      | Order for displaying reports (required, default: 0)                                                                                 |
| `isActive`            | `boolean`                  | `notNull`, `default(true)`   | Whether the report is active (required, default: true)                                                                              |
| `visibility`          | `varchar(50)`              | `notNull`, `default('team')` | Report visibility: 'global' (visible to all teams) or 'team' (visible only to creator's team) (required, default: 'team')           |
| `config`              | `jsonb`                    | nullable                     | Report configuration: fields to display, optional global filter, and sections with ordering and optional section filters (nullable) |
| `description`         | `text`                     | nullable                     | Optional description of the report (nullable)                                                                                       |
| `createdDateTime`     | `timestamp with time zone` | `notNull`, `defaultNow()`    | Date and time the record was created (required, default: now)                                                                       |
| `createdBy`           | `integer`                  | `notNull`, FK                | FK to SystemUser - user who created the record (required)                                                                           |
| `lastUpdatedDateTime` | `timestamp with time zone` | `notNull`, `defaultNow()`    | Date and time the record was last updated (required, default: now)                                                                  |
| `lastUpdatedBy`       | `integer`                  | `notNull`, FK                | FK to SystemUser - user who last updated the record (required)                                                                      |

### Report Configuration

The `config` field stores a JSONB object that defines how activities are included and rendered in different report types. For detailed configuration structure, examples, and filter merging behavior, see [Reports Configuration](./SCHEMA_USAGE.md#reports-configuration) in the usage guide.

### Report Visibility

- **`visibility = 'global'`**: Report is visible to all teams (e.g., Look Ahead)
- **`visibility = 'team'`**: Report is visible only to the creator's team (e.g., 30/60/90)

### Related Tables

- **Junction Tables**:
  - `activityReportSettings`: Many-to-many relationship between Activities and Reports - stores per-activity omitted flags

---

## ActivityReportSettings

**Legacy Table Name:** `activity_report_exclusions` (renamed and transformed)  
**New Table Name:** `activity_report_settings`

**Description:** Per-activity report settings. Stores whether an activity is omitted from a specific report. Every activity must have a setting for every active report. When an activity is created, default rows are created with `omitted=false`. Users can update the omitted value to exclude activities from specific reports.

### Field Mappings

| Legacy Field Name | Legacy Type | New Field Name | New Type                   | New Constraints                      | Mapping Notes                                                                           |
| ----------------- | ----------- | -------------- | -------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------- |
| `activity_id`     | `integer`   | `activityId`   | `integer`                  | `notNull`, FK, primary key component | FK to Activities - primary key component (required)                                     |
| `report_id`       | `integer`   | `reportId`     | `integer`                  | `notNull`, FK, primary key component | FK to Reports - primary key component (required)                                        |
| `is_active`       | `bit`       | _Removed_      | -                          | -                                    | Replaced by `omitted` field                                                             |
| -                 | -           | `omitted`      | `boolean`                  | `notNull`, `default(false)`          | **New field** - Whether activity is omitted from this report (required, default: false) |
| `timestamp`       | `timestamp` | `timestamp`    | `timestamp with time zone` | `notNull`, `defaultNow()`            | Book-keeping timestamp (required, default: now)                                         |

### Inclusion Logic

Activity inclusion in reports is determined by `isConfidential` (on activities) and `omitted` (on activityReportSettings). For detailed inclusion logic, behavior, and legacy mapping information, see [Activity Report Settings](./SCHEMA_USAGE.md#activity-report-settings) in the usage guide.

### Legacy Mapping

This table replaces the legacy boolean flags on the Activity table:

- **`IsConfidential` (notForLookAhead)**: `isConfidential=true` on activities (for placeholder) + `omitted=true` in activityReportSettings (for omission)
- **`notForThirtySixtyNinety`**: `omitted=true` for 'thirty-sixty-ninety' report

### Related Tables

- **Foreign Keys**:
  - `activityId` → `activities.id`
  - `reportId` → `reports.id`

---
