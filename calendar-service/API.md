# Calendar Service API Documentation

Base URL: `http://localhost:3001`

## Activities Endpoints

### Create Activity

**POST** `/activities`

Creates a new calendar activity with related junction table records.

**Request Body:**

```json
{
  "title": "Ministry Event",
  "summary": "Important event description",
  "significance": "High profile event",
  "startDate": "2026-03-13",
  "startTime": "14:30",
  "endDate": "2026-03-13",
  "endTime": "16:00",
  "isAllDay": false,
  "dateStatusId": 1,
  "timeStatusId": 1,
  "venueStatusId": null,
  "activityStatusId": 1,
  "leadMinistryId": 1,
  "isIssue": false,
  "reportSettings": [
    { "reportId": 1, "omitted": false },
    { "reportId": 2, "omitted": true }
  ],
  "commsContacts": [
    { "userId": 8, "isLead": true },
    { "userId": 12, "isLead": false }
  ],
  "sharedWithTeamIds": [],
  "schedulingNotes": "Room booking required",
  "strategy": null,
  "notes": "General notes for admin change log",
  "pitchDate": "2026-03-10",
  "pitchRequiredStatusId": null,
  "translationsRequiredStatusId": null,
  "newsReleaseDistributionId": 1,
  "premierRequestedId": 2,
  "venueAddress": {
    "venueName": null,
    "addressLine1": "123 Main St",
    "addressLine2": null,
    "city": "Victoria",
    "provinceOrState": "BC",
    "country": "Canada"
  },
  "categoryIds": [2, 5],
  "tagIds": [1, 2]
}
```

**`venueStatusId`:** Optional. Id from the venue-status lookup (`/lookups/venue-statuses`), or `null` / omit when the activity has no venue or no venue status.

**`venueAddress`:** Optional object. Fields are nullable strings: `venueName`, `addressLine1`, `addressLine2` (floor, suite, unit, etc.), `city`, `provinceOrState`, `country`. Per-activity addresses persist `addressLine2` on `venue_addresses`; admin **venue presets** also store `addressLine2` (see lookups below).

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": 6,
    "displayId": "MIN-000006",
    "title": "Ministry Event",
    "summary": "Important event description",
    "startDate": "2026-03-13",
    "startTime": "14:30"
  }
}
```

---

### Get All Activities

**GET** `/activities`

Retrieves all activities with optional filtering.

**Query Parameters:**

Array filters accept comma-separated values in the query string (e.g. `tagIds=1,2`) or repeated keys. Multiple values use OR semantics (match any).

| Parameter                      | Type                           | Description                                                                                                                     |
| ------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `title`                        | string                         | Exact title match                                                                                                               |
| `startDateFrom`                | ISO date                       | Lower bound of the scheduled-span overlap window (optional; may be used alone)                                                  |
| `startDateTo`                  | ISO date                       | Upper bound of the scheduled-span overlap window (optional; may be used alone)                                                  |
| `endDateFrom`                  | ISO date                       | Activity `endDate` on or after                                                                                                  |
| `endDateTo`                    | ISO date                       | Activity `endDate` on or before                                                                                                 |
| `scheduledDateRangeOverlaps`   | boolean (`true`)               | Requires both activity dates and span overlap; UI/reports set this with date bounds (see below)                                 |
| `activityStatusIds`            | int[]                          | Filter by status IDs (OR). When omitted, deleted activities are excluded; completed are excluded unless `includeCompleted=true` |
| `leadMinistryIds`              | int[]                          | Lead ministry IDs (OR)                                                                                                          |
| `leadOrgIds`                   | int[]                          | Lead organization IDs (OR)                                                                                                      |
| `leadTeamIds`                  | int[]                          | Lead team IDs (OR)                                                                                                              |
| `commsContactLeadUserIds`      | int[]                          | Lead comms contact user IDs (OR)                                                                                                |
| `flagAssigneeUserIds`          | int[]                          | Flag assignee user IDs (OR)                                                                                                     |
| `sharedWithTeamIds`            | int[]                          | Shared-with team IDs (OR)                                                                                                       |
| `eventPlannerLeadIds`          | int[]                          | Lead event planner IDs (OR)                                                                                                     |
| `tagIds`                       | int[]                          | Tag IDs (OR)                                                                                                                    |
| `categoryNames`                | string[]                       | Category display or internal names (OR, case-insensitive)                                                                       |
| `translationRequiredStatusIds` | int[]                          | Translations-required status IDs (OR)                                                                                           |
| `translationLanguageIds`       | int[]                          | Required translation language IDs (OR)                                                                                          |
| `pitchRequiredStatusNames`     | string[]                       | Pitch-required status names (OR, case-insensitive)                                                                              |
| `lookAheadStatusValues`        | string[]                       | Look-ahead status values (OR)                                                                                                   |
| `lookAheadSectionValues`       | string[]                       | Look-ahead section bucket keys (OR)                                                                                             |
| `dateConfirmedFilter`          | `confirmed` \| `not_confirmed` | Date confirmation status                                                                                                        |
| `timeConfirmedFilter`          | `confirmed` \| `not_confirmed` | Time confirmation status                                                                                                        |
| `pitchDateNotScheduled`        | boolean (`true`)               | Activities with no pitch date                                                                                                   |
| `pitchDateScheduled`           | boolean (`true`)               | Activities with any pitch date set (when no pitch date range bounds)                                                            |
| `pitchDateFrom`                | ISO date                       | Pitch date on or after                                                                                                          |
| `pitchDateTo`                  | ISO date                       | Pitch date on or before                                                                                                         |
| `city`                         | string                         | Filter by venue city                                                                                                            |
| `isIssue`                      | boolean                        | Filter by issue flag                                                                                                            |
| `includeCompleted`             | boolean (`true`)               | Include completed-status activities when no `activityStatusIds` filter                                                          |
| `includeDeleted`               | boolean (`true`)               | Include deleted-status activities (Admin/System Admin only)                                                                     |
| `page`                         | integer                        | Page number (default `1`)                                                                                                       |
| `limit`                        | integer                        | Page size (default `20`, max `100`; not applied to unpaginated list responses today)                                            |

**Scheduled date window (`startDateFrom` / `startDateTo`):** bounds use **span overlap**, not containment. An activity matches when its scheduled range intersects the window: `activity.end >= startDateFrom` (when set) and `activity.start <= startDateTo` (when set). Either bound may be omitted for an open-ended window. `startDate` must be set; activities with no start date never match.

When `scheduledDateRangeOverlaps=true` (Activity List, Reports, and Look Ahead always send this with date bounds), `endDate` must also be set. Without the flag, a missing `endDate` is treated as a single-day span (`COALESCE(endDate, startDate)`).

**Example:** `GET /activities?startDateFrom=2026-01-01&activityStatusIds=1,3&tagIds=5`

Report data (`GET /reports/data/:type`) accepts the same filter fields except `page` and `limit`. Keyword `search` is **not** sent on report data fetch; the UI applies search client-side over the cached payload. Export endpoints (`GET /reports/export/:type/:format`) accept optional `search` and apply it server-side so PDF/CSV/XLSX match the filtered preview.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "displayId": "MIN-000001",
      "title": "Activity Title",
      "summary": "Activity description",
      "category": ["Event", "Release"],
      "categoryIds": [1, 2],
      "tags": [{ "id": "...", "text": "high-priority" }]
    }
  ]
}
```

---

### Get Activity by ID

**GET** `/activities/:id`

Retrieves a single activity by its ID.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "displayId": "MIN-000001",
    "title": "Activity Title"
  }
}
```

---

### Get Activity Categories

**GET** `/activities/categories`

Retrieves all available activity categories.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Event",
      "displayName": "Event"
    }
  ]
}
```

---

### Update Activity

**PATCH** `/activities/:id`

Updates an existing activity. Only provided fields are updated (partial update).

**Request Body:**

```json
{
  "title": "Updated Title",
  "summary": "Updated description",
  "categoryIds": [1, 3],
  "tagIds": ["00000000-0000-4000-8000-000000000106"]
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Updated Title"
  }
}
```

**Note:** Junction table records (categories, tags, etc.) are replaced entirely if provided.

---

### Soft Delete Activity

**DELETE** `/activities/:id/soft-delete`

Soft deletes an activity by setting `activityStatusId` to 'deleted'. Requires a reason for audit purposes. Deleted activities are excluded from default queries unless `includeDeleted=true` (Admin/System Admin) or included via `activityStatusIds`.

**Authorization:** The caller may perform soft delete if they have the `activities.delete` permission (e.g. Admin, System Admin) **or** if they are the **comms lead** for this activity (the user listed in `activity_comms_contacts` for this activity with `isLead=true`). See **commsContacts** in the Notes section. When the caller lacks permission, the API returns 403 Forbidden and does not reveal whether the activity exists.

**Request Body:**

```json
{
  "reason": "Activity cancelled due to scheduling conflict"
}
```

**Validation:** `reason` must be between 10 and 1000 characters.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Example Activity",
    "activityStatusId": 4,
    "activityStatus": "Deleted"
  }
}
```

**Note:** The reason is stored in `activityHistory` with action type `soft_deleted`.

---

### Delete Activity (Hard Delete)

**DELETE** `/activities/:id`

Permanently deletes an activity from the database.

**Authorization:** Same as soft delete: the caller may perform hard delete if they have the `activities.delete` permission **or** if they are the **comms lead** for this activity. When the caller lacks permission, the API returns 403 Forbidden and does not reveal whether the activity exists (to avoid information disclosure); when the caller has permission, a non-existent activity returns 404 from the service layer.

**Response:** `200 OK`

```json
{
  "message": "Activity #1 deleted successfully"
}
```

**Note:** Use soft delete if you want to preserve the record for audit purposes.

---

## Lookups Endpoints

Reference data for dropdowns and filters. All responses follow the format: `{ "success": true, "data": [...] }`

### Get Categories

**GET** `/lookups/categories`

**Cache:** 1 hour

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Event",
      "displayName": "Event",
      "label": "Event",
      "value": 1
    }
  ]
}
```

---

### Get Activity Statuses

**GET** `/lookups/activity-statuses`

**Cache:** 1 hour

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Draft",
      "displayName": "Draft",
      "label": "Draft",
      "value": 1
    }
  ]
}
```

---

### Get Organizations

**GET** `/lookups/organizations`

**Query Parameters:** `userId` (integer), `role` (string), `organizationId` (integer)

**Cache:** 5 minutes

```json
{
  "success": true,
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000004",
      "name": "Ministry of Finance",
      "displayName": "Ministry of Finance",
      "label": "Ministry of Finance",
      "value": "00000000-0000-4000-8000-000000000004"
    }
  ]
}
```

---

### Get Users

**GET** `/lookups/users`

**Query Parameters:** `userId` (integer), `role` (string), `organizationId` (integer), `userIds` (comma-separated integers)

**Cache:** 5 minutes

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "label": "John Doe",
      "value": 1,
      "email": "john.doe@example.com",
      "username": "jdoe"
    }
  ]
}
```

---

### Get Tags

**GET** `/lookups/tags`

**Cache:** 1 hour

```json
{
  "success": true,
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000105",
      "key": "high-priority",
      "displayName": "High Priority",
      "label": "High Priority",
      "value": "00000000-0000-4000-8000-000000000105"
    }
  ]
}
```

---

### Get Event Planners

**GET** `/lookups/event-planners`

**Cache:** 1 hour

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Event Planner Name",
      "displayName": "Event Planner Display Name",
      "label": "Event Planner Display Name",
      "value": 1
    }
  ]
}
```

---

### Get News Release Distributions

**GET** `/lookups/news-release-distributions`

**Cache:** 1 hour

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Distribution Name",
      "displayName": "Distribution Display Name",
      "label": "Distribution Display Name",
      "value": 1
    }
  ]
}
```

---

### Get Premier Requested Options

**GET** `/lookups/premier-requested`

**Cache:** 1 hour

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Premier Requested Name",
      "displayName": "Premier Requested Display Name",
      "label": "Premier Requested Display Name",
      "value": 1
    }
  ]
}
```

---

### Get Comms Materials

**GET** `/lookups/comms-materials`

**Cache:** 1 hour

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "News Release",
      "displayName": "News Release",
      "label": "News Release",
      "value": 1
    }
  ]
}
```

---

### Get Translation Languages

**GET** `/lookups/translation-languages`

**Cache:** 1 hour

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "French",
      "displayName": "French",
      "label": "French",
      "value": 1
    }
  ]
}
```

---

### Get Government Representatives

**GET** `/lookups/government-representatives`

**Cache:** 1 hour

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Smith",
      "displayName": "John Smith",
      "label": "John Smith",
      "value": 1,
      "title": "Minister",
      "ministryId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

---

### Get Activities for Lookup

**GET** `/lookups/activities`

Simplified activity list for "Related Activities" dropdowns.

**Query Parameters:** `userId` (integer), `role` (string)

**Cache:** 5 minutes

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Ministry Event",
      "label": "Ministry Event",
      "value": 1
    }
  ]
}
```

---

### Get Venue Presets

**GET** `/lookups/venue-presets`

Returns admin-defined venue presets for the activity form. All active presets appear in the Venue Name combobox; up to 4 pinned presets are shown as quick-select badges beneath the Venue input. Each item includes venue address fields plus `isPinned` and `pinnedSortOrder`.

**Cache:** 1 hour

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "venueName": "BC Legislature",
      "addressLine1": "501 Belleville St",
      "addressLine2": null,
      "city": "Victoria",
      "provinceOrState": "British Columbia",
      "country": "Canada",
      "isPinned": true,
      "pinnedSortOrder": 1
    }
  ]
}
```

---

### Create Venue Preset

**POST** `/lookups/venue-presets`

**Permission:** `lookups.manage`

**Body:** `venueName` (required), `addressLine1`, `addressLine2`, `city`, `provinceOrState`, `country`, `sortOrder` (default 0), `isActive` (default true), `isPinned` (default false), `pinnedSortOrder` (default 0). Duplicate addresses (same `addressLine1` + `addressLine2`) are rejected.

---

### Update Venue Preset

**PATCH** `/lookups/venue-presets/:id`

**Permission:** `lookups.manage`

**Body:** Same as create (all optional for partial update). Duplicate address check applies when address fields change.

---

### Delete Venue Preset

**DELETE** `/lookups/venue-presets/:id`

**Permission:** `lookups.manage`

---

## Error Responses

### 400 Bad Request

Validation failed or invalid request data.

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

### 404 Not Found

Resource not found.

```json
{
  "statusCode": 404,
  "message": "Activity with id 999 not found"
}
```

### 500 Internal Server Error

Server error occurred.

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Notes

- **Authentication:** Endpoints that create, update, or delete resources require a valid JWT (cookie or `Authorization: Bearer`). The **authenticated user** is used for audit fields and activity history.
- **Rate Limiting:** Not currently implemented.
- **CORS:** Enabled for development. Configure allowed origins for production.
- **Audit Fields:** `createdBy`, `lastUpdatedBy`, `createdDateTime`, and `lastUpdatedDateTime` are set from the authenticated user and current time on create and update. Activity history records the user ID for each change.
- **Display ID:** Auto-generated as `<MINISTRY_ABBREV>-<6_DIGIT_ID>` (e.g., `MIN-000006`).
- **Report Settings:** The `reportSettings` field controls whether activities are omitted from specific reports. Each setting includes:
  - `reportId`: The ID of the report
  - `omitted`: Boolean indicating if the activity is omitted from this report (default: false)
  - Inclusion behavior is determined by `isConfidential` (on activity) and `omitted` (on reportSettings):
    - `omitted=true` → Activity is omitted
    - `omitted=false` and `isConfidential=false` → Activity included with standard details
    - `omitted=false` and `isConfidential=true` → Activity included with placeholder (redacted) details
- **isConfidential:** Activity-level boolean property. When true, activity shows as placeholder in reports (unless omitted).
- **commsContacts:** Array of comms contacts for the activity. Each contact has:
  - `userId`: The ID of the user
  - `isLead`: Boolean indicating if this is the lead contact (exactly one must be true)
  - In responses, also includes `name`: The display name of the user
