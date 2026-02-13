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
  "activityStatusId": 1,
  "leadMinistryId": "00000000-0000-4000-8000-000000000004",
  "isIssue": false,
  "reportSettings": [
    { "reportId": 1, "omitted": false },
    { "reportId": 2, "omitted": true }
  ],
  "commsContacts": [
    { "userId": 8, "isLead": true },
    { "userId": 12, "isLead": false }
  ],
  "sharedWithAll": false,
  "schedulingNotes": "Room booking required",
  "notes": "General notes for admin change log",
  "pitchDate": "2026-03-10",
  "newsReleaseDistributionId": 1,
  "premierRequestedId": 2,
  "venueAddress": {
    "venueName": null,
    "street": "123 Main St",
    "city": "Victoria",
    "provinceOrState": "BC",
    "country": "Canada"
  },
  "categoryIds": [2, 5],
  "tagIds": ["00000000-0000-4000-8000-000000000105"]
}
```

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
| Parameter | Type | Description |
|-----------|------|-------------|
| `title` | string | Filter by title |
| `startDateFrom` | ISO date | Activities starting on or after this date |
| `startDateTo` | ISO date | Activities starting on or before this date |
| `endDateFrom` | ISO date | Activities ending on or after this date |
| `endDateTo` | ISO date | Activities ending on or before this date |
| `activityStatusId` | integer | Filter by activity status (default: excludes deleted activities) |
| `leadMinistryId` | UUID | Filter by lead ministry |
| `city` | string | Filter by city (from venueAddress) |
| `isIssue` | boolean | Filter by issue flag |

**Example:** `GET /activities?startDateFrom=2026-01-01&activityStatusId=1`

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

Soft deletes an activity by setting `activityStatusId` to 'deleted'. Requires a reason for audit purposes. Deleted activities are excluded from default queries unless explicitly requested via `activityStatusId` filter.

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
    "activityStatusId": 6,
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

**Query Parameters:** `userId` (integer), `role` (string), `organizationId` (UUID)

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

**Query Parameters:** `userId` (integer), `role` (string), `organizationId` (UUID), `userIds` (comma-separated integers)

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

### Get Venue Quick-Picks

**GET** `/lookups/venue-quick-picks`

Returns admin-configured quick-pick venues for the activity form (max 4 active). Used as tags under the Venue address input.

**Cache:** 1 hour

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "venueName": "BC Legislature",
      "street": "501 Belleville St",
      "city": "Victoria",
      "provinceOrState": "British Columbia",
      "country": "Canada"
    }
  ]
}
```

---

### Get Venue Last-Used

**GET** `/lookups/venue-last-used`

Returns the last 2 distinct venue addresses used by the current user (from activities they last updated). Requires authentication.

```json
{
  "success": true,
  "data": [
    {
      "id": -1,
      "venueName": "Conference Room A",
      "street": "123 Main St",
      "city": "Victoria",
      "provinceOrState": "British Columbia",
      "country": "Canada"
    }
  ]
}
```

---

### Create Venue Quick-Pick

**POST** `/lookups/venue-quick-picks`

**Permission:** `lookups.manage`

**Body:** `venueName` (required), `street`, `city`, `provinceOrState`, `country`, `sortOrder` (default 0), `isActive` (default true). Maximum 4 active quick-picks enforced.

---

### Update Venue Quick-Pick

**PATCH** `/lookups/venue-quick-picks/:id`

**Permission:** `lookups.manage`

**Body:** Same as create (all optional for partial update).

---

### Delete Venue Quick-Pick

**DELETE** `/lookups/venue-quick-picks/:id`

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
