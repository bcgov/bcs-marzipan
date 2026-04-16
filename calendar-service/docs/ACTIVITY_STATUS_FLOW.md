# Activity Status Flow

This document describes the business rules for activity statuses: which statuses exist, how they are set, and who can perform status-changing actions.

For the activity docs index and field-add playbook, see [ACTIVITY.md](./ACTIVITY.md).

For general edit permission (who may PATCH an activity, UI read-only rules, and comms-candidate API access), see [ACTIVITY_EDIT_ELIGIBILITY.md](./ACTIVITY_EDIT_ELIGIBILITY.md).

## Statuses

| Status               | Description                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **New**              | Initial state when an activity is created (non-admin). Stays **New** on ordinary saves until someone with `activities.review` marks it **Reviewed**.                              |
| **Changed**          | Set when an activity that was already **Reviewed** is saved again without being marked reviewed (or via restore fallback). Not used merely because a **New** activity was edited. |
| **Reviewed**         | Set when a user with `activities.review` marks an activity reviewed (create confirm, or edit **Review** / update with `markAsReviewed`).                                          |
| **Delete requested** | Set when a Comms contact or a member of the activity's lead team requests deletion (notes required).                                                                              |
| **Deleted**          | Soft delete; set when an admin/sysAdmin performs "Soft delete" (notes required).                                                                                                  |
| **Completed**        | Set by a scheduled job after the activity end (or after midnight Pacific for all-day), using an administrator-configurable buffer and run schedule in `application_settings`.     |
| **On hold**          | Not yet implemented; reserved for future use.                                                                                                                                     |

Status is not user-editable on the activity form; it is set by the system based on the action and the user's role.

## Who Can Do What

- **Request delete**: **Comms contacts** on the activity (any entry in the activity's comms contacts, lead or not) or **members of the activity's lead team** may request delete.
- **Restore**: **Comms contacts** on the activity, **members of the activity's lead team**, or **Admin** / **System Admin** may restore.
- **Soft delete / Hard delete**: Admin or System Admin (and, where applicable, Comms lead for the activity, per existing delete guard).

## How Status Is Set

- **Create**: New activity is set to **New**. If the user has `activities.review` and submits with "Mark as reviewed" checked on the create confirmation dialog, status is set to **Reviewed**.
- **Update**: If current status is **Delete requested** or **Deleted**, updates are rejected. Otherwise: while status is **New**, any successful save (with or without `activities.review`) keeps **New** unless the user has `activities.review` and submits with **Review** / `markAsReviewed: true`, in which case status becomes **Reviewed**. Once status is **Reviewed**, a later save without marking reviewed sets **Changed**; users with `activities.review` set **Reviewed** when they use **Review** / `markAsReviewed: true` on PATCH.
- **Request delete**: Sets status to **Delete requested**. Notes are required. Comms contacts on the activity or members of the activity's lead team may call this.
- **Soft delete**: Sets status to **Deleted**. Notes (reason) are required.
- **Hard delete**: A note is required. The delete and the identity of who deleted are recorded in activity history before the activity row is removed.
- **Restore**: Sets status back to the **most recent status before** the activity was set to **Delete requested** or **Deleted** (from activity history). If none is found, fall back to **Changed**.
- **Completed**: A quarter-hour cron job sets status to **Completed** for eligible activities once the effective end plus the configured buffer has passed (effective end: timed end in Pacific with fixed UTC-7, or midnight Pacific on the day after `endDate` for all-day), unless automation is disabled with schedule **never** (admins can still run completion manually). **Cadence** and **buffer** are read from `application_settings`: `activity_completion_schedule` (every 15 minutes, hourly, twice daily, daily, or never) and `activity_completion_buffer_minutes` (0, 15, 30, or 45). Defaults and when a tick runs are defined in `@corpcal/shared` (`packages/shared/src/activity-completion.ts`, e.g. `DEFAULT_COMPLETION_SCHEDULE`, `DEFAULT_COMPLETION_BUFFER_MINUTES`, `shouldRunCompletionJob`).

## Edit Lock When Delete Requested or Deleted

When status is **Delete requested** or **Deleted**, edits to the activity are not allowed. The UI shows a banner and a **Restore** button for users who are allowed to restore (Comms contacts, members of the activity's lead team, Admin, System Admin).

Only **Admin** or **System Admin** may open the edit page when status is **Delete requested** or **Deleted**. Other users (including those with edit permission) can view the activity and, if allowed, use Restore from the banner; they are redirected to the view page if they navigate directly to the edit URL.

## Review Snapshot (Changed Since Last Review)

When status transitions to **Reviewed**, a canonical snapshot of the activity's form data is persisted. Reviewers see per-field "changed since last review" badges by comparing the current state to this snapshot. **Deleted** clears the snapshot; **Delete requested** does not. See [ACTIVITY_REVIEW_SNAPSHOT.md](./ACTIVITY_REVIEW_SNAPSHOT.md) for full details.

## Activity History

All status changes are recorded in activity history (e.g. `activityStatusId` in the changes array and the appropriate action type). This supports restore logic (previous status) and audit (who requested delete, who performed soft/hard delete).
