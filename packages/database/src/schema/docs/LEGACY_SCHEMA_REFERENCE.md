# Legacy Schema Reference Documentation

> **IMPORTANT: This file should NOT be edited.**
>
> This file represents documentation of the legacy schema and is required to match
> the legacy SQL database for migration purposes. Any changes to this file could
> break the migration process.

This document provides a comprehensive reference of all legacy database schemas as defined in the original SQL Server database. The schemas have been translated from SQL Server types to PostgreSQL types for use with Drizzle ORM.

## Table of Contents

1. [Activity](#activity)
2. [ActivityCategories](#activitycategories)
3. [Category](#category)
4. [City](#city)
5. [ActivityCommunicationMaterials](#activitycommunicationmaterials)
6. [ActivityFilter](#activityfilter)
7. [ActivityInitiatives](#activityinitiatives)
8. [ActivityKeywords](#activitykeywords)
9. [ActivityNROrigins](#activitynrorigins)
10. [ActivitySectors](#activitysectors)
11. [ActivitySharedWith](#activitysharedwith)
12. [ActivityTags](#activitytags)
13. [ActivityThemes](#activitythemes)
14. [FavoriteActivity](#favoriteactivity)
15. [Log](#log)
16. [NewsFeed](#newsfeed)
17. [SystemUserMinistry](#systemuserministry)

---

## Activity

**Table Name:** `[Gcpe.Hub].[calendar].[Activity]`

**Description:** Core entity for calendar events. Represents activities, meetings, and events in the government calendar system. Contains comprehensive information about event details, scheduling, status, and metadata. Review flags are only triggered by updates made by non-Admin role users.

### Columns

| Column Name                         | SQL Server Type     | PostgreSQL Type            | Nullable | Constraints                            | Description                                                                    |
| ----------------------------------- | ------------------- | -------------------------- | -------- | -------------------------------------- | ------------------------------------------------------------------------------ |
| `id`                                | `int`               | `serial`                   | No       | Primary Key                            | Unique identifier for the activity                                             |
| `StartDateTime`                     | `datetime`          | `timestamp with time zone` | Yes      |                                        | Start date and time of the activity                                            |
| `EndDateTime`                       | `datetime`          | `timestamp with time zone` | Yes      |                                        | End date and time of the activity                                              |
| `PotentialDates`                    | `nvarchar(70)`      | `varchar(70)`              | Yes      |                                        | Alternative dates for the activity (deprecated unused in Legacy)               |
| `Title`                             | `nvarchar(500)`     | `varchar(500)`             | Yes      |                                        | Title of the activity                                                          |
| `Details`                           | `nvarchar(700)`     | `varchar(700)`             | Yes      |                                        | Summary                                                                        |
| `Schedule`                          | `nvarchar(500)`     | `varchar(500)`             | Yes      |                                        | Scheduling Consideration and Approval Notes                                    |
| `Significance`                      | `nvarchar(500)`     | `varchar(500)`             | Yes      |                                        | Significance of the activity                                                   |
| `Strategy`                          | `nvarchar(500)`     | `varchar(500)`             | Yes      |                                        | Strategic information about the activity                                       |
| `Comments`                          | `nvarchar(4000)`    | `varchar(4000)`            | Yes      |                                        | Notes field in UI used for admin change log and tracking                       |
| `HqComments`                        | `nvarchar(2000)`    | `varchar(2000)`            | Yes      |                                        | Executive Summary field (visible in Look Ahead report)                         |
| `LeadOrganization`                  | `nvarchar(100)`     | `varchar(100)`             | Yes      |                                        | Org leading the activity (UI logic connects to ContactMinistryId)              |
| `Translations`                      | `nvarchar(500)`     | `varchar(500)`             | Yes      |                                        | Translation required (includes free text entry)                                |
| `StatusId`                          | `int`               | `integer`                  | Yes      | Foreign Key → Status                   | Status of the activity                                                         |
| `HqStatusId`                        | `int`               | `integer`                  | Yes      | Foreign Key → Status                   | Look Ahead report status                                                       |
| `HqSection`                         | `int`               | `integer`                  | No       |                                        | Look Ahead report section                                                      |
| `NRDateTime`                        | `datetime`          | `timestamp with time zone` | Yes      |                                        | News release date and time                                                     |
| `NRDistributionId`                  | `int`               | `integer`                  | Yes      | Foreign Key → NRDistribution           | News release distribution identifier                                           |
| `PremierRequestedId`                | `int`               | `integer`                  | Yes      | Foreign Key → PremierRequested         | Premier request identifier                                                     |
| `ContactMinistryId`                 | `unique identifier` | `uuid`                     | Yes      | Foreign Key → Ministry                 | Contact ministry identifier                                                    |
| `GovernmentRepresentativeId`        | `int`               | `integer`                  | Yes      | Foreign Key → GovernmentRepresentative | Government representative identifier                                           |
| `CommunicationContactId`            | `int`               | `integer`                  | Yes      | Foreign Key → CommunicationContact     | Communication contact identifier                                               |
| `EventPlannerId`                    | `int`               | `integer`                  | Yes      | Foreign Key → EventPlanner             | Event planner identifier                                                       |
| `VideographerId`                    | `int`               | `integer`                  | Yes      | Foreign Key → Videographer             | Videographer identifier (used for Digital options)                             |
| `Venue`                             | `nvarchar(150)`     | `varchar(150)`             | Yes      |                                        | Venue or location of the activity                                              |
| `CityId`                            | `int`               | `integer`                  | Yes      | Foreign Key → City                     | City identifier                                                                |
| `OtherCity`                         | `nvarchar(150)`     | `varchar(150)`             | Yes      |                                        | Other city name if not in lookup table                                         |
| `IsActive`                          | `bit`               | `boolean`                  | No       | Default: `false`                       | Whether the activity is active                                                 |
| `IsConfirmed`                       | `bit`               | `boolean`                  | No       | Default: `false`                       | Whether the activity is confirmed                                              |
| `IsIssue`                           | `bit`               | `boolean`                  | No       | Default: `false`                       | Whether the activity has issues                                                |
| `IsAllDay`                          | `bit`               | `boolean`                  | No       | Default: `false`                       | Whether the activity is all-day                                                |
| `IsAtLegislature`                   | `bit`               | `boolean`                  | No       | Default: `false`                       | Whether the activity is at the legislature                                     |
| `IsConfidential`                    | `bit`               | `boolean`                  | No       | Default: `false`                       | Not for Look Ahead signals admin details not to be added to HQComments         |
| `IsCrossGovernment`                 | `bit`               | `boolean`                  | No       | Default: `false`                       | Whether the activity is cross-government                                       |
| `IsMilestone`                       | `bit`               | `boolean`                  | No       | Default: `false`                       | Whether the activity is a milestone (deprecated unused in Legacy)              |
| `IsTitleNeedsReview`                | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating title needs review                                             |
| `IsDetailsNeedsReview`              | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating details need review                                            |
| `IsRepresentativeNeedsReview`       | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating representative needs review                                    |
| `IsCityNeedsReview`                 | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating city needs review                                              |
| `IsStartDateNeedsReview`            | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating start date needs review                                        |
| `IsEndDateNeedsReview`              | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating end date needs review                                          |
| `IsCategoriesNeedsReview`           | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating categories need review                                         |
| `IsCommMaterialsNeedsReview`        | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating communication materials need review                            |
| `IsActiveNeedsReview`               | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating active status needs review                                     |
| `IsSignificanceNeedsReview`         | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating significance needs review                                      |
| `IsStrategyNeedsReview`             | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating strategy needs review                                          |
| `IsschedulingNotesNeedsReview`      | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating scheduling considerations need review                          |
| `IsInternalNotesNeedsReview`        | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating internal notes need review                                     |
| `IsLeadOrganizationNeedsReview`     | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating lead organization needs review                                 |
| `IsInitiativesNeedsReview`          | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating initiatives need review                                        |
| `IsTagsNeedsReview`                 | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating tags need review                                               |
| `IsOriginNeedsReview`               | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating origin needs review                                            |
| `IsDistributionNeedsReview`         | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating distribution needs review                                      |
| `IsTranslationsRequiredNeedsReview` | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating translations requirement needs review                          |
| `IsPremierRequestedNeedsReview`     | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating premier requested needs review                                 |
| `IsVenueNeedsReview`                | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating venue needs review                                             |
| `IsEventPlannerNeedsReview`         | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating event planner needs review                                     |
| `IsDigitalNeedsReview`              | `bit`               | `boolean`                  | No       | Default: `false`                       | Flag indicating digital needs review                                           |
| `CreatedDateTime`                   | `datetime`          | `timestamp with time zone` | Yes      |                                        | Date and time the record was created                                           |
| `CreatedBy`                         | `int`               | `integer`                  | Yes      | Foreign Key → SystemUser               | User who created the record                                                    |
| `LastUpdatedDateTime`               | `datetime`          | `timestamp with time zone` | Yes      |                                        | Date and time the record was last updated                                      |
| `LastUpdatedBy`                     | `int`               | `integer`                  | Yes      | Foreign Key → SystemUser               | User who last updated the record                                               |
| `TimeStamp`                         | `timestamp`         | `timestamp with time zone` | No       |                                        | Row version timestamp for concurrency control (byte[] NOT NULL in Activity.cs) |
| `RowGuid`                           | `unique identifier` | `uuid`                     | Yes      |                                        | Unique identifier for the row (Nullable<Guid> in Activity.cs)                  |

### Notes

- The table contains extensive "Needs Review" flags for granular review tracking of different aspects of an activity.
- Foreign key relationships exist to multiple lookup tables (Status, City, GovernmentRepresentative, etc.).
- The `HqComments` field is only visible to headquarters users.
- Many boolean flags use default values of `false` for safety.

---

## ActivityCategories

**Table Name:** `[Gcpe.Hub].[calendar].[ActivityCategories]`

**Description:** Junction table establishing a many-to-many relationship between Activities and Categories. Allows activities to be classified with multiple categories.

### Columns

| Column Name           | SQL Server Type     | PostgreSQL Type            | Nullable | Constraints              | Description                               |
| --------------------- | ------------------- | -------------------------- | -------- | ------------------------ | ----------------------------------------- |
| `Id`                  | `int`               | `serial`                   | No       | Primary Key              | Unique identifier for the junction record |
| `ActivityId`          | `int`               | `integer`                  | No       | Foreign Key → Activity   | Reference to the activity                 |
| `CategoryId`          | `int`               | `integer`                  | No       | Foreign Key → Category   | Reference to the category                 |
| `IsActive`            | `bit`               | `boolean`                  | No       | Default: `true`          | Whether this relationship is active       |
| `CreatedDateTime`     | `datetime`          | `timestamp with time zone` | Yes      |                          | Date and time the record was created      |
| `CreatedBy`           | `int`               | `integer`                  | Yes      | Foreign Key → SystemUser | User who created the record               |
| `LastUpdatedDateTime` | `datetime`          | `timestamp with time zone` | No       |                          | Date and time the record was last updated |
| `LastUpdatedBy`       | `int`               | `integer`                  | Yes      | Foreign Key → SystemUser | User who last updated the record          |
| `TimeStamp`           | `Timestamp`         | `timestamp with time zone` | No       |                          | Row version timestamp                     |
| `RowGuid`             | `unique identifier` | `uuid`                     | No       |                          | Unique identifier for the row             |

---

## Category

**Table Name:** `[Gcpe.Hub].[calendar].[Category]`

**Description:** Lookup table for activity categories. Categories are used to classify and organize activities. This table is extensible by administrators via the admin UI.

### Columns

| Column Name | SQL Server Type     | PostgreSQL Type            | Nullable | Constraints     | Description                        |
| ----------- | ------------------- | -------------------------- | -------- | --------------- | ---------------------------------- |
| `Id`        | `int`               | `serial`                   | No       | Primary Key     | Unique identifier for the category |
| `Name`      | `nvarchar(50)`      | `varchar(50)`              | Yes      |                 | Name of the category               |
| `SortOrder` | `int`               | `integer`                  | Yes      |                 | Sort order for display purposes    |
| `IsActive`  | `bit`               | `boolean`                  | No       | Default: `true` | Whether the category is active     |
| `TimeStamp` | `Timestamp`         | `timestamp with time zone` | No       |                 | Row version timestamp              |
| `RowGuid`   | `unique identifier` | `uuid`                     | No       |                 | Unique identifier for the row      |

---

## City

**Table Name:** `[Gcpe.Hub].[calendar].[City]`

**Description:** Lookup table for cities where activities can take place. Used to filter and organize activities by location.

### Columns

| Column Name | SQL Server Type     | PostgreSQL Type            | Nullable | Constraints | Description                                                |
| ----------- | ------------------- | -------------------------- | -------- | ----------- | ---------------------------------------------------------- |
| `Id`        | `int`               | `serial`                   | No       | Primary Key | Unique identifier for the city                             |
| `Name`      | `nvarchar(50)`      | `varchar(50)`              | Yes      |             | Name of the city (nullable in City.cs)                     |
| `IsActive`  | `bit`               | `boolean`                  | Yes      |             | Whether the city is active (Nullable<bool> in City.cs)     |
| `TimeStamp` | `Timestamp`         | `timestamp with time zone` | No       |             | Row version timestamp (byte[] NOT NULL in City.cs)         |
| `RowGuid`   | `unique identifier` | `uuid`                     | Yes      |             | Unique identifier for the row (Nullable<Guid> in City.cs)  |
| `SortOrder` | `int`               | `integer`                  | Yes      |             | Sort order for display purposes (Nullable<int> in City.cs) |

---

## ActivityCommunicationMaterials

**Table Name:** `[Gcpe.Hub].[calendar].[ActivityCommunicationMaterials]`

**Description:** Junction table establishing a many-to-many relationship between Activities and CommunicationMaterials. Links activities to their associated communication materials.

### Columns

| Column Name               | SQL Server Type     | PostgreSQL Type            | Nullable | Constraints                         | Description                                                                                       |
| ------------------------- | ------------------- | -------------------------- | -------- | ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| `Id`                      | `int`               | `serial`                   | No       | Primary Key                         | Unique identifier for the junction record (NOT NULL in ActivityCommunicationMaterial.cs)          |
| `ActivityId`              | `int`               | `integer`                  | No       | Foreign Key → Activity              | Reference to the activity (NOT NULL in ActivityCommunicationMaterial.cs)                          |
| `CommunicationMaterialId` | `int`               | `integer`                  | No       | Foreign Key → CommunicationMaterial | Reference to the communication material (NOT NULL in ActivityCommunicationMaterial.cs)            |
| `IsActive`                | `bit`               | `boolean`                  | No       | Default: `true`                     | Whether this relationship is active (NOT NULL in ActivityCommunicationMaterial.cs)                |
| `CreatedDateTime`         | `datetime`          | `timestamp with time zone` | Yes      |                                     | Date and time the record was created (Nullable<DateTime> in ActivityCommunicationMaterial.cs)     |
| `CreatedBy`               | `int`               | `integer`                  | Yes      | Foreign Key → SystemUser            | User who created the record (Nullable<int> in ActivityCommunicationMaterial.cs)                   |
| `LastUpdatedDateTime`     | `datetime`          | `timestamp with time zone` | No       |                                     | Date and time the record was last updated (DateTime NOT NULL in ActivityCommunicationMaterial.cs) |
| `LastUpdatedBy`           | `int`               | `integer`                  | Yes      | Foreign Key → SystemUser            | User who last updated the record (Nullable<int> in ActivityCommunicationMaterial.cs)              |
| `TimeStamp`               | `Timestamp`         | `timestamp with time zone` | No       |                                     | Row version timestamp (byte[] NOT NULL in ActivityCommunicationMaterial.cs)                       |
| `RowGuid`                 | `unique identifier` | `uuid`                     | No       |                                     | Unique identifier for the row (Guid NOT NULL in ActivityCommunicationMaterial.cs)                 |

---

## ActivityFilter

**Table Name:** `[Gcpe.Hub].[calendar].[ActivityFilter]`

**Description:** Table for storing saved filter queries for activities. Allows users to save and reuse complex filter configurations.

### Columns

| Column Name           | SQL Server Type    | PostgreSQL Type            | Nullable | Constraints              | Description                                                         |
| --------------------- | ------------------ | -------------------------- | -------- | ------------------------ | ------------------------------------------------------------------- |
| `Id`                  | `int`              | `serial`                   | No       | Primary Key              | Unique identifier for the filter                                    |
| `QueryString`         | `nvarchar(300)`    | `varchar(300)`             | Yes      |                          | Query string representing the filter                                |
| `Name`                | `nvarchar(200)`    | `varchar(200)`             | Yes      |                          | Name of the saved filter                                            |
| `SortOrder`           | `int`              | `integer`                  | Yes      |                          | Sort order for display purposes                                     |
| `IsActive`            | `bit`              | `boolean`                  | Yes      |                          | Whether the filter is active                                        |
| `CreatedDateTime`     | `datetime`         | `timestamp with time zone` | Yes      |                          | Date and time the record was created                                |
| `CreatedBy`           | `int`              | `integer`                  | Yes      | Foreign Key → SystemUser | User who created the record                                         |
| `LastUpdatedDateTime` | `datetime`         | `timestamp with time zone` | Yes      |                          | Date and time the record was last updated                           |
| `LastUpdatedBy`       | `int`              | `integer`                  | Yes      | Foreign Key → SystemUser | User who last updated the record                                    |
| `TimeStamp`           | `timestamp`        | `timestamp with time zone` | No       |                          | Row version timestamp (byte[] NOT NULL in ActivityFilter.cs)        |
| `RowGuid`             | `uniqueidentifier` | `uuid`                     | Yes      |                          | Unique identifier for the row (Nullable<Guid> in ActivityFilter.cs) |

---

## ActivityInitiatives

**Table Name:** `[Gcpe.Hub].[calendar].[ActivityInitiatives]`

**Description:** Junction table establishing a many-to-many relationship between Activities and Initiatives. Links activities to government initiatives.

### Columns

| Column Name           | SQL Server Type    | PostgreSQL Type            | Nullable | Constraints              | Description                               |
| --------------------- | ------------------ | -------------------------- | -------- | ------------------------ | ----------------------------------------- |
| `Id`                  | `int`              | `serial`                   | No       | Primary Key              | Unique identifier for the junction record |
| `ActivityId`          | `int`              | `integer`                  | No       | Foreign Key → Activity   | Reference to the activity                 |
| `InitiativeId`        | `int`              | `integer`                  | No       | Foreign Key → Initiative | Reference to the initiative               |
| `IsActive`            | `bit`              | `boolean`                  | No       | Default: `true`          | Whether this relationship is active       |
| `CreatedDateTime`     | `datetime`         | `timestamp with time zone` | Yes      |                          | Date and time the record was created      |
| `CreatedBy`           | `int`              | `integer`                  | Yes      | Foreign Key → SystemUser | User who created the record               |
| `LastUpdatedDateTime` | `datetime`         | `timestamp with time zone` | Yes      |                          | Date and time the record was last updated |
| `LastUpdatedBy`       | `int`              | `integer`                  | Yes      | Foreign Key → SystemUser | User who last updated the record          |
| `TimeStamp`           | `timestamp`        | `timestamp with time zone` | No       |                          | Row version timestamp                     |
| `RowGuid`             | `uniqueidentifier` | `uuid`                     | No       |                          | Unique identifier for the row             |

---

## ActivityKeywords

**Table Name:** `[Gcpe.Hub].[calendar].[ActivityKeywords]`

**Description:** Junction table establishing a many-to-many relationship between Activities and Keywords. Links activities to keywords for search and categorization.

### Columns

| Column Name           | SQL Server Type | PostgreSQL Type            | Nullable | Constraints                         | Description                               |
| --------------------- | --------------- | -------------------------- | -------- | ----------------------------------- | ----------------------------------------- |
| `ActivityId`          | `int`           | `integer`                  | No       | Primary Key, Foreign Key → Activity | Reference to the activity                 |
| `KeywordId`           | `int`           | `integer`                  | No       | Primary Key, Foreign Key → Keyword  | Reference to the keyword                  |
| `IsActive`            | `bit`           | `boolean`                  | No       | Default: `true`                     | Whether this relationship is active       |
| `LastUpdatedDateTime` | `datetime`      | `timestamp with time zone` | No       |                                     | Date and time the record was last updated |
| `LastUpdatedBy`       | `int`           | `integer`                  | No       | Foreign Key → SystemUser            | User who last updated the record          |

**Note:** This table does not include `CreatedDateTime`, `CreatedBy`, `TimeStamp`, or `RowGuid` fields, unlike other junction tables.

---

## ActivityNROrigins

**Table Name:** `[Gcpe.Hub].[calendar].[ActivityNROrigins]`

**Description:** Junction table establishing a many-to-many relationship between Activities and NROrigins (News Release Origins). Links activities to their news release origins.

### Columns

| Column Name           | SQL Server Type    | PostgreSQL Type            | Nullable | Constraints              | Description                                                                          |
| --------------------- | ------------------ | -------------------------- | -------- | ------------------------ | ------------------------------------------------------------------------------------ |
| `Id`                  | `int`              | `serial`                   | No       | Primary Key              | Unique identifier for the junction record                                            |
| `ActivityId`          | `int`              | `integer`                  | No       | Foreign Key → Activity   | Reference to the activity                                                            |
| `NROriginId`          | `int`              | `integer`                  | No       | Foreign Key → NROrigin   | Reference to the news release origin                                                 |
| `IsActive`            | `bit`              | `boolean`                  | No       | Default: `true`          | Whether this relationship is active                                                  |
| `CreatedDateTime`     | `datetime`         | `timestamp with time zone` | Yes      |                          | Date and time the record was created (Nullable<DateTime> in ActivityNROrigin.cs)     |
| `CreatedBy`           | `int`              | `integer`                  | Yes      | Foreign Key → SystemUser | User who created the record (Nullable<int> in ActivityNROrigin.cs)                   |
| `LastUpdatedDateTime` | `datetime`         | `timestamp with time zone` | No       |                          | Date and time the record was last updated (DateTime NOT NULL in ActivityNROrigin.cs) |
| `LastUpdatedBy`       | `int`              | `integer`                  | Yes      | Foreign Key → SystemUser | User who last updated the record (Nullable<int> in ActivityNROrigin.cs)              |
| `TimeStamp`           | `timestamp`        | `timestamp with time zone` | No       |                          | Row version timestamp (byte[] NOT NULL in ActivityNROrigin.cs)                       |
| `RowGuid`             | `uniqueidentifier` | `uuid`                     | No       |                          | Unique identifier for the row (Guid NOT NULL in ActivityNROrigin.cs)                 |

---

## ActivitySectors

**Table Name:** `[Gcpe.Hub].[calendar].[ActivitySectors]`

**Description:** Junction table establishing a many-to-many relationship between Activities and Sectors. Links activities to government sectors.

### Columns

| Column Name           | SQL Server Type    | PostgreSQL Type            | Nullable | Constraints              | Description                                                                        |
| --------------------- | ------------------ | -------------------------- | -------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `Id`                  | `int`              | `serial`                   | No       | Primary Key              | Unique identifier for the junction record                                          |
| `ActivityId`          | `int`              | `integer`                  | No       | Foreign Key → Activity   | Reference to the activity                                                          |
| `SectorId`            | `uniqueidentifier` | `uuid`                     | No       | Foreign Key → Sector     | Reference to the sector                                                            |
| `IsActive`            | `bit`              | `boolean`                  | No       | Default: `true`          | Whether this relationship is active                                                |
| `CreatedDateTime`     | `datetime`         | `timestamp with time zone` | Yes      |                          | Date and time the record was created (Nullable<DateTime> in ActivitySector.cs)     |
| `CreatedBy`           | `int`              | `integer`                  | Yes      | Foreign Key → SystemUser | User who created the record (Nullable<int> in ActivitySector.cs)                   |
| `LastUpdatedDateTime` | `datetime`         | `timestamp with time zone` | No       |                          | Date and time the record was last updated (DateTime NOT NULL in ActivitySector.cs) |
| `LastUpdatedBy`       | `int`              | `integer`                  | Yes      | Foreign Key → SystemUser | User who last updated the record (Nullable<int> in ActivitySector.cs)              |
| `TimeStamp`           | `timestamp`        | `timestamp with time zone` | No       |                          | Row version timestamp (byte[] NOT NULL in ActivitySector.cs)                       |
| `RowGuid`             | `uniqueidentifier` | `uuid`                     | No       |                          | Unique identifier for the row (Guid NOT NULL in ActivitySector.cs)                 |

---

## ActivitySharedWith

**Table Name:** `[Gcpe.Hub].[calendar].[ActivitySharedWith]`

**Description:** Junction table establishing a many-to-many relationship between Activities and Ministries. Indicates which ministries an activity is shared with.

### Columns

| Column Name           | SQL Server Type    | PostgreSQL Type            | Nullable | Constraints              | Description                                                                             |
| --------------------- | ------------------ | -------------------------- | -------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `Id`                  | `int`              | `serial`                   | No       | Primary Key              | Unique identifier for the junction record                                               |
| `ActivityId`          | `int`              | `integer`                  | No       | Foreign Key → Activity   | Reference to the activity                                                               |
| `MinistryId`          | `uniqueidentifier` | `uuid`                     | No       | Foreign Key → Ministry   | Reference to the ministry                                                               |
| `IsActive`            | `bit`              | `boolean`                  | No       | Default: `true`          | Whether this relationship is active                                                     |
| `CreatedDateTime`     | `datetime`         | `timestamp with time zone` | Yes      |                          | Date and time the record was created (Nullable<DateTime> in ActivitySharedWith.cs)      |
| `CreatedBy`           | `int`              | `integer`                  | Yes      | Foreign Key → SystemUser | User who created the record (Nullable<int> in ActivitySharedWith.cs)                    |
| `LastUpdatedDateTime` | `datetime`         | `timestamp with time zone` | Yes      |                          | Date and time the record was last updated (Nullable<DateTime> in ActivitySharedWith.cs) |
| `LastUpdatedBy`       | `int`              | `integer`                  | Yes      | Foreign Key → SystemUser | User who last updated the record (Nullable<int> in ActivitySharedWith.cs)               |
| `TimeStamp`           | `timestamp`        | `timestamp with time zone` | No       |                          | Row version timestamp (byte[] NOT NULL in ActivitySharedWith.cs)                        |
| `RowGuid`             | `uniqueidentifier` | `uuid`                     | No       |                          | Unique identifier for the row (Guid NOT NULL in ActivitySharedWith.cs)                  |

---

## ActivityTags

**Table Name:** `[Gcpe.Hub].[calendar].[ActivityTags]`

**Description:** Junction table establishing a many-to-many relationship between Activities and Tags. Links activities to tags for flexible categorization and search.

### Columns

| Column Name           | SQL Server Type    | PostgreSQL Type            | Nullable | Constraints                         | Description                               |
| --------------------- | ------------------ | -------------------------- | -------- | ----------------------------------- | ----------------------------------------- |
| `ActivityId`          | `int`              | `integer`                  | No       | Primary Key, Foreign Key → Activity | Reference to the activity                 |
| `TagId`               | `uniqueidentifier` | `uuid`                     | No       | Primary Key, Foreign Key → Tag      | Reference to the tag                      |
| `IsActive`            | `bit`              | `boolean`                  | No       | Default: `true`                     | Whether this relationship is active       |
| `CreatedDateTime`     | `datetime`         | `timestamp with time zone` | No       |                                     | Date and time the record was created      |
| `CreatedBy`           | `int`              | `integer`                  | No       | Foreign Key → SystemUser            | User who created the record               |
| `LastUpdatedDateTime` | `datetime`         | `timestamp with time zone` | No       |                                     | Date and time the record was last updated |
| `LastUpdatedBy`       | `int`              | `integer`                  | No       | Foreign Key → SystemUser            | User who last updated the record          |

**Note:** This table does not include `TimeStamp` or `RowGuid` fields, unlike most other junction tables.

---

## ActivityThemes

**Table Name:** `[Gcpe.Hub].[calendar].[ActivityThemes]`

**Description:** Junction table establishing a many-to-many relationship between Activities and Themes. Links activities to themes for thematic organization.

### Columns

| Column Name           | SQL Server Type    | PostgreSQL Type            | Nullable | Constraints                         | Description                               |
| --------------------- | ------------------ | -------------------------- | -------- | ----------------------------------- | ----------------------------------------- |
| `ActivityId`          | `int`              | `integer`                  | No       | Primary Key, Foreign Key → Activity | Reference to the activity                 |
| `ThemeId`             | `uniqueidentifier` | `uuid`                     | No       | Primary Key, Foreign Key → Theme    | Reference to the theme                    |
| `IsActive`            | `bit`              | `boolean`                  | No       | Default: `true`                     | Whether this relationship is active       |
| `CreatedDateTime`     | `datetime`         | `timestamp with time zone` | No       |                                     | Date and time the record was created      |
| `CreatedBy`           | `int`              | `integer`                  | No       | Foreign Key → SystemUser            | User who created the record               |
| `LastUpdatedDateTime` | `datetime`         | `timestamp with time zone` | No       |                                     | Date and time the record was last updated |
| `LastUpdatedBy`       | `int`              | `integer`                  | No       | Foreign Key → SystemUser            | User who last updated the record          |

**Note:** This table does not include `TimeStamp` or `RowGuid` fields, unlike most other junction tables.

---

## FavoriteActivity

**Table Name:** `[Gcpe.Hub].[calendar].[FavoriteActivity]`

**Description:** Junction table establishing a many-to-many relationship between SystemUsers and Activities. Allows users to mark activities as favorites/watch lists for quick access.

### Columns

| Column Name    | SQL Server Type | PostgreSQL Type | Nullable | Constraints                           | Description                  |
| -------------- | --------------- | --------------- | -------- | ------------------------------------- | ---------------------------- |
| `SystemUserId` | `int`           | `integer`       | No       | Primary Key, Foreign Key → SystemUser | Reference to the system user |
| `ActivityId`   | `int`           | `integer`       | No       | Primary Key, Foreign Key → Activity   | Reference to the activity    |

**Note:** This table uses a composite primary key consisting of `SystemUserId` and `ActivityId`. It does not include audit fields like `CreatedDateTime`, `CreatedBy`, `TimeStamp`, or `RowGuid`, unlike most other junction tables.

---

## Log

**Table Name:** `[Gcpe.Hub].[calendar].[Log]`

**Description:** Audit trail table for tracking activity changes. Records field-level modifications to activities, including old and new values, operation types, and user information.

### Columns

| Column Name           | SQL Server Type    | PostgreSQL Type            | Nullable | Constraints              | Description                                             |
| --------------------- | ------------------ | -------------------------- | -------- | ------------------------ | ------------------------------------------------------- |
| `Id`                  | `int`              | `serial`                   | No       | Primary Key              | Unique identifier for the log entry                     |
| `ActivityId`          | `int`              | `integer`                  | No       | Foreign Key → Activity   | Reference to the activity being logged                  |
| `LogType`             | `int`              | `integer`                  | No       |                          | Type of log entry                                       |
| `TableName`           | `nvarchar(50)`     | `varchar(50)`              | Yes      |                          | Name of the table that was modified                     |
| `FieldName`           | `nvarchar(1000)`   | `varchar(1000)`            | Yes      |                          | Name of the field that was changed                      |
| `OldValue`            | `nvarchar(1000)`   | `varchar(1000)`            | Yes      |                          | Previous value before the change                        |
| `NewValue`            | `nvarchar(1000)`   | `varchar(1000)`            | Yes      |                          | New value after the change                              |
| `Operation`           | `nvarchar(50)`     | `varchar(50)`              | No       |                          | Operation type (INSERT, UPDATE, DELETE, etc.)           |
| `IsActive`            | `bit`              | `boolean`                  | No       | Default: `true`          | Whether the log entry is active                         |
| `CreatedDateTime`     | `datetime`         | `timestamp with time zone` | Yes      |                          | Date and time the log entry was created                 |
| `CreatedBy`           | `int`              | `integer`                  | Yes      | Foreign Key → SystemUser | User who created the log entry                          |
| `LastUpdatedDateTime` | `datetime`         | `timestamp with time zone` | No       |                          | Date and time the record was last updated               |
| `LastUpdatedBy`       | `int`              | `integer`                  | Yes      | Foreign Key → SystemUser | User who last updated the record                        |
| `TimeStamp`           | `timestamp`        | `timestamp with time zone` | No       |                          | Row version timestamp (byte[] NOT NULL in Log.cs)       |
| `RowGuid`             | `uniqueidentifier` | `uuid`                     | No       |                          | Unique identifier for the row (Guid NOT NULL in Log.cs) |

---

## NewsFeed

**Table Name:** `[Gcpe.Hub].[calendar].[NewsFeed]`

**Description:** Table for storing news feed entries related to activities and ministries. Used for displaying activity-related news and updates.

### Columns

| Column Name           | SQL Server Type    | PostgreSQL Type            | Nullable | Constraints              | Description                                                  |
| --------------------- | ------------------ | -------------------------- | -------- | ------------------------ | ------------------------------------------------------------ |
| `Id`                  | `int`              | `serial`                   | No       | Primary Key              | Unique identifier for the news feed entry                    |
| `ActivityId`          | `int`              | `integer`                  | Yes      | Foreign Key → Activity   | Reference to the related activity (nullable)                 |
| `MinistryId`          | `uniqueidentifier` | `uuid`                     | No       | Foreign Key → Ministry   | Reference to the ministry                                    |
| `Text`                | `nvarchar(1000)`   | `varchar(1000)`            | Yes      |                          | News feed text content                                       |
| `Description`         | `nvarchar(50)`     | `varchar(50)`              | Yes      |                          | Short description of the news feed entry                     |
| `IsActive`            | `bit`              | `boolean`                  | No       | Default: `true`          | Whether the news feed entry is active                        |
| `CreatedDateTime`     | `datetime`         | `timestamp with time zone` | Yes      |                          | Date and time the record was created                         |
| `CreatedBy`           | `int`              | `integer`                  | Yes      | Foreign Key → SystemUser | User who created the record                                  |
| `LastUpdatedDateTime` | `datetime`         | `timestamp with time zone` | Yes      |                          | Date and time the record was last updated                    |
| `LastUpdatedBy`       | `int`              | `integer`                  | Yes      | Foreign Key → SystemUser | User who last updated the record                             |
| `TimeStamp`           | `timestamp`        | `timestamp with time zone` | No       |                          | Row version timestamp (byte[] NOT NULL in NewsFeed.cs)       |
| `RowGuid`             | `uniqueidentifier` | `uuid`                     | No       |                          | Unique identifier for the row (Guid NOT NULL in NewsFeed.cs) |

---

## SystemUserMinistry

**Table Name:** `[Gcpe.Hub].[calendar].[SystemUserMinistry]`

**Description:** Junction table establishing a many-to-many relationship between SystemUsers and Ministries. Links users to ministries they are associated with for access control and filtering.

### Columns

| Column Name           | SQL Server Type    | PostgreSQL Type            | Nullable | Constraints              | Description                                                            |
| --------------------- | ------------------ | -------------------------- | -------- | ------------------------ | ---------------------------------------------------------------------- |
| `Id`                  | `int`              | `serial`                   | No       | Primary Key              | Unique identifier for the junction record                              |
| `SystemUserId`        | `int`              | `integer`                  | Yes      | Foreign Key → SystemUser | Reference to the system user                                           |
| `MinistryId`          | `uniqueidentifier` | `uuid`                     | Yes      | Foreign Key → Ministry   | Reference to the ministry                                              |
| `IsActive`            | `bit`              | `boolean`                  | No       | Default: `true`          | Whether this relationship is active                                    |
| `CreatedDateTime`     | `datetime`         | `timestamp with time zone` | Yes      |                          | Date and time the record was created                                   |
| `CreatedBy`           | `int`              | `integer`                  | Yes      | Foreign Key → SystemUser | User who created the record                                            |
| `LastUpdatedDateTime` | `datetime`         | `timestamp with time zone` | Yes      |                          | Date and time the record was last updated                              |
| `LastUpdatedBy`       | `int`              | `integer`                  | Yes      | Foreign Key → SystemUser | User who last updated the record                                       |
| `TimeStamp`           | `timestamp`        | `timestamp with time zone` | No       |                          | Row version timestamp (byte[] NOT NULL in SystemUserMinistry.cs)       |
| `RowGuid`             | `uniqueidentifier` | `uuid`                     | No       |                          | Unique identifier for the row (Guid NOT NULL in SystemUserMinistry.cs) |

---

## Type Mapping Reference

### SQL Server to PostgreSQL Type Mappings

| SQL Server Type     | PostgreSQL Type            | Notes                                           |
| ------------------- | -------------------------- | ----------------------------------------------- |
| `int`               | `integer` or `serial`      | Use `serial` for auto-incrementing primary keys |
| `bit`               | `boolean`                  |                                                 |
| `datetime`          | `timestamp with time zone` |                                                 |
| `timestamp`         | `timestamp with time zone` |                                                 |
| `nvarchar(n)`       | `varchar(n)`               |                                                 |
| `unique identifier` | `uuid`                     |                                                 |
| `uniqueidentifier`  | `uuid`                     |                                                 |

### Common Patterns

- **Primary Keys:** Use `serial` for integer primary keys, `uuid().defaultRandom()` for UUID primary keys
- **Foreign Keys:** Use `integer()` or `uuid()` depending on the referenced table's primary key type
- **Timestamps:** Use `timestamp('column_name', { withTimezone: true })` for all datetime/timestamp fields
- **Booleans:** Use `boolean()` with `.notNull().default(false)` or `.default(true)` as appropriate
- **Nullable Fields:** Omit `.notNull()` to allow null values
- **Required Fields:** Use `.notNull()` to enforce non-null constraints

---

## Data Quality Notes

This documentation is based on the legacy C# entity definitions from `Hub.Legacy/Gcpe.Calendar.Data/Entity/`. The schemas have been verified against the source code to ensure accuracy.

### Corrections Made from CSV (double check these fields):

1. **Activity table:**
   - `Title`, `Details`, `Schedule`, `Significance` are nullable (string in C#), not required
   - `TimeStamp` is NOT NULL (byte[] in C#), not nullable
   - `RowGuid` is nullable (Nullable<Guid> in C#)

2. **City table:**
   - `IsActive` is nullable (Nullable<bool> in C#)
   - `RowGuid` is nullable (Nullable<Guid> in C#)
   - `SortOrder` is nullable (Nullable<int> in C#)

3. **ActivityCommunicationMaterials:**
   - Has `Id` field as primary key (int NOT NULL in C#)
   - Composite primary key removed (table uses single `Id` PK)

4. **ActivityFilter:**
   - `TimeStamp` is NOT NULL (byte[] in C#), not nullable

5. **ActivityNROrigins:**
   - `CreatedBy` is nullable (Nullable<int> in C#), not required
   - `LastUpdatedBy` is nullable (Nullable<int> in C#), not required

6. **ActivitySectors:**
   - `LastUpdatedDateTime` is NOT NULL (DateTime in C#)

7. **ActivitySharedWith:**
   - `LastUpdatedDateTime` is nullable (Nullable<DateTime> in C#)

8. **FavoriteActivity:**
   - Uses composite primary key (SystemUserId, ActivityId)
   - No audit fields (CreatedDateTime, CreatedBy, TimeStamp, RowGuid)

9. **Log:**
   - `LastUpdatedDateTime` is NOT NULL (DateTime in C#)
   - `TimeStamp` is NOT NULL (byte[] in C#)
   - `RowGuid` is NOT NULL (Guid in C#)

10. **NewsFeed:**
    - `MinistryId` is NOT NULL (Guid in C#)
    - `IsActive` is NOT NULL (bool in C#)
    - `TimeStamp` is NOT NULL (byte[] in C#)
    - `RowGuid` is NOT NULL (Guid in C#)

11. **SystemUserMinistry:**
    - `IsActive` is NOT NULL (bool in C#)
    - `TimeStamp` is NOT NULL (byte[] in C#)
    - `RowGuid` is NOT NULL (Guid in C#)

All schemas have been verified against the C# entity definitions to ensure type accuracy and nullability constraints match the source code.

---

## Related Tables (Not in CSV)

The following tables are referenced by foreign keys but are not defined in the provided CSV:

- `Status` - Referenced by `Activity.StatusId` and `Activity.HqStatusId`
- `NRDistribution` - Referenced by `Activity.NRDistributionId`
- `PremierRequested` - Referenced by `Activity.PremierRequestedId`
- `Ministry` - Referenced by `Activity.ContactMinistryId` and `ActivitySharedWith.MinistryId`
- `GovernmentRepresentative` - Referenced by `Activity.GovernmentRepresentativeId`
- `CommunicationContact` - Referenced by `Activity.CommunicationContactId`
- `EventPlanner` - Referenced by `Activity.EventPlannerId`
- `Videographer` - Referenced by `Activity.VideographerId`
- `SystemUser` - Referenced by various `CreatedBy` and `LastUpdatedBy` fields
- `CommunicationMaterial` - Referenced by `ActivityCommunicationMaterials.CommunicationMaterialId`
- `Initiative` - Referenced by `ActivityInitiatives.InitiativeId`
- `Keyword` - Referenced by `ActivityKeywords.KeywordId`
- `NROrigin` - Referenced by `ActivityNROrigins.NROriginId`
- `Sector` - Referenced by `ActivitySectors.SectorId`
- `Theme` - Referenced by `ActivityThemes.ThemeId`
- `Tag` - Referenced by `ActivityTags.TagId`

The following tables are now fully documented and translated:

- `FavoriteActivity` - User favorites/watch lists (junction table)
- `Log` - Activity change audit trail
- `NewsFeed` - News feed entries
- `SystemUserMinistry` - User-ministry relationships (junction table)

These tables are defined in other schema files within the legacy folder.
