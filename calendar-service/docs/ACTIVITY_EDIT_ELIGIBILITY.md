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
- **Review vs Update (edit page):** users with **`activities.review`** see a **Review** action in addition to **Update**. **Update** saves field changes and sets status to **Changed** (unless combined with review via the Review flow). **Review** marks the activity **Reviewed**; if there are unsaved edits, the Review confirmation saves them and marks reviewed in one step.

## Backend: cloning an activity (POST `/activities/:id/clone`)

`CanCloneActivityGuard` (used with `@RequirePermission('activities.create')`) enforces the following on the **source** activity:

1. The caller must have `activities.create` (controller-level).
2. The caller must satisfy the same edit-eligibility rules as update on the source: Admin/System Admin bypass, comms contact, or lead-team member.
3. When the source status is **`delete_requested`** or **`deleted`**, the caller must additionally hold `activities.delete.any`. This mirrors who is allowed to edit blocked activities in the UI.

The clone endpoint creates a new activity using the same initial-status rules as **create**: `markAsReviewed` in the request body (optional) is honored when the user has `activities.review` (otherwise the new activity starts as **New**), matching `POST /activities`. Client-supplied `activityStatusId` is not accepted. Fields governed by scopes the caller cannot edit (for example `notes`) are stripped from the copied payload, matching the existing field-level write policy. Look-ahead, pitch, translations, and pitch-date fields are never copied and are reset to their create-time defaults.

Two history rows are recorded:

- **Source activity:** a `cloned` entry pointing at the new activity's id/displayId.
- **New activity:** the standard `created` entry, extended with structured `clonedFromActivityId` / `clonedFromDisplayId` provenance in `changes`.

Both entries carry the same optional note provided in the request body.

## Calendar UI: Clone button on the activity page

- **Visibility:** shown only when the user has `activities.create` and passes edit eligibility on the source activity (for blocked statuses this implicitly requires `activities.delete.any`, the same rule that governs editing there). View-only users never see the button.
- **Disabled:** when another user holds the edit lock, or when the current form has unsaved changes. Users must discard or save first before cloning.
- The button lives in the sticky footer between **Discard changes** and **Save**, using the `outline` variant.

## Comms contact candidates: `GET /teams/:teamId/comms-contact-candidates`

Used to populate comms-lead options for the selected **lead team**. Allowed when:

- The caller has **`activities.create.any`**, **or**
- The caller is a **member of `teamId`** (`callerTeamIds.includes(teamId)`).

Otherwise the API returns **403**. The calendar UI must **not** call this endpoint when the user would receive 403 (same condition as above), to avoid console noise and failed React Query requests.

## Related docs

- [ACTIVITY_STATUS_FLOW.md](./ACTIVITY_STATUS_FLOW.md) — status transitions and who may request delete / restore.
- `CanEditActivityGuard` — `calendar-service/src/policy/guards/can-edit-activity.guard.ts`
- `CanCloneActivityGuard` — `calendar-service/src/policy/guards/can-clone-activity.guard.ts`
- `computeCanEdit` — `calendar-service/src/activities/services/activities.service.ts`
