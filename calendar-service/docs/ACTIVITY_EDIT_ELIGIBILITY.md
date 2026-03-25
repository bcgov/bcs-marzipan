# Who Can Edit an Activity (and Related UI/API Rules)

This document describes when a user may change activity data, how that is exposed in the API, and how the calendar UI behaves (edit lock, read-only form, and comms-contact candidate loading).

## Backend: updating an activity (PATCH)

`CanEditActivityGuard` applies to activity updates. The caller must satisfy `activities.edit` (via `@RequirePermission`) **and** at least one of:

1. **Admin or System Admin** (role bypass), or
2. **Comms contact** on that activity (any row in the activity’s comms contacts), or
3. **Member of the activity’s lead team** (`user.teamIds` includes `activity.leadTeamId`).

Users who only have the activity **shared with** their team for viewing (no lead-team membership and not a comms contact) receive **403** on update.

> **Note:** `activities.create.any` does **not** grant edit access to arbitrary activities by itself. It is used elsewhere (e.g. listing lead teams and comms candidates across teams). See below.

## API response: `canEdit` on `ActivityResponse`

`GET /activities/:id` (and list endpoints that populate it) set `canEdit` when the request is authenticated:

- Requires `activities.edit`, and
- The same effective rule as above: bypass (data scope), or comms contact, or lead-team member (`computeCanEdit` in `ActivitiesService`).

If `activities.edit` is missing, `canEdit` is **false**. If the field is omitted (e.g. unauthenticated context), clients should treat the activity as **not editable**.

## Calendar UI: activity edit page

- **Form fields** are read-only unless the user is allowed to edit **and** the activity is not in a state that blocks editing for that user (e.g. delete-requested/deleted except where policy allows). Another user holding the edit lock also forces read-only.
- **Optimistic edit:** users who _may_ edit can type before acquiring the edit lock; the client acquires the lock on the first real change (`useEditLockIntent`). Users who _may not_ edit never get an enabled form, so they cannot trigger lock acquisition by typing.
- **`canEdit` handling:** the UI treats **missing** `canEdit` as **false** so the form does not allow edits when the API does not explicitly allow them.

## Comms contact candidates: `GET /teams/:teamId/comms-contact-candidates`

Used to populate comms-lead options for the selected **lead team**. Allowed when:

- The caller has **`activities.create.any`**, **or**
- The caller is a **member of `teamId`** (`callerTeamIds.includes(teamId)`).

Otherwise the API returns **403**. The calendar UI must **not** call this endpoint when the user would receive 403 (same condition as above), to avoid console noise and failed React Query requests.

## Related docs

- [ACTIVITY_STATUS_FLOW.md](./ACTIVITY_STATUS_FLOW.md) — status transitions and who may request delete / restore.
- `CanEditActivityGuard` — `calendar-service/src/policy/guards/can-edit-activity.guard.ts`
- `computeCanEdit` — `calendar-service/src/activities/services/activities.service.ts`
