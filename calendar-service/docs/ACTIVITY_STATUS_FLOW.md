# Activity Status Flow

This document describes the business rules for activity statuses: which statuses exist, how they are set, and who can perform status-changing actions.

For general edit permission (who may PATCH an activity, UI read-only rules, and comms-candidate API access), see [ACTIVITY_EDIT_ELIGIBILITY.md](./ACTIVITY_EDIT_ELIGIBILITY.md).

## Statuses

| Status               | Description                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **New**              | Initial state when an activity is created (non-admin).                                                                                   |
| **Changed**          | Set after any edit unless an admin marks as reviewed.                                                                                    |
| **Reviewed**         | Set when a user with `activities.review` marks an activity reviewed (create confirm, or edit **Review** / update with `markAsReviewed`). |
| **Delete requested** | Set when a Comms contact or a member of the activity's lead team requests deletion (notes required).                                     |
| **Deleted**          | Soft delete; set when an admin/sysAdmin performs "Soft delete" (notes required).                                                         |
| **Completed**        | Set by a scheduled job a fixed delay after the activity end time (or after midnight for all-day activities).                             |
| **On hold**          | Not yet implemented; reserved for future use.                                                                                            |

Status is not user-editable on the activity form; it is set by the system based on the action and the user's role.

## Who Can Do What

- **Request delete**: **Comms contacts** on the activity (any entry in the activity's comms contacts, lead or not) or **members of the activity's lead team** may request delete.
- **Restore**: **Comms contacts** on the activity, **members of the activity's lead team**, or **Admin** / **System Admin** may restore.
- **Soft delete / Hard delete**: Admin or System Admin (and, where applicable, Comms lead for the activity, per existing delete guard).

## How Status Is Set

- **Create**: New activity is set to **New**. If the user has `activities.review` and submits with "Mark as reviewed" checked on the create confirmation dialog, status is set to **Reviewed**.
- **Update**: If current status is **Delete requested** or **Deleted**, updates are rejected. Otherwise: users **without** `activities.review` always set status to **Changed** on save. Users **with** `activities.review` set **Reviewed** when they either use the **Review** action on the activity edit page (or save with pending changes via that flow) or send `markAsReviewed: true` on PATCH; saving changes with **Update** alone (without marking reviewed) sets **Changed**.
- **Request delete**: Sets status to **Delete requested**. Notes are required. Comms contacts on the activity or members of the activity's lead team may call this.
- **Soft delete**: Sets status to **Deleted**. Notes (reason) are required.
- **Hard delete**: A note is required. The delete and the identity of who deleted are recorded in activity history before the activity row is removed.
- **Restore**: Sets status back to the **most recent status before** the activity was set to **Delete requested** or **Deleted** (from activity history). If none is found, fall back to **Changed**.
- **Completed**: A scheduled job sets status to **Completed** a fixed number of minutes after the activity end (or after midnight for all-day). See `ACTIVITY_COMPLETED_DELAY_MINUTES` in shared constants.

## Edit Lock When Delete Requested or Deleted

When status is **Delete requested** or **Deleted**, edits to the activity are not allowed. The UI shows a banner and a **Restore** button for users who are allowed to restore (Comms contacts, members of the activity's lead team, Admin, System Admin).

Only **Admin** or **System Admin** may open the edit page when status is **Delete requested** or **Deleted**. Other users (including those with edit permission) can view the activity and, if allowed, use Restore from the banner; they are redirected to the view page if they navigate directly to the edit URL.

## Review Snapshot (Changed Since Last Review)

When status transitions to **Reviewed**, a canonical snapshot of the activity's form data is persisted. Reviewers see per-field "changed since last review" badges by comparing the current state to this snapshot. **Deleted** clears the snapshot; **Delete requested** does not. See [ACTIVITY_REVIEW_SNAPSHOT.md](./ACTIVITY_REVIEW_SNAPSHOT.md) for full details.

## Activity History

All status changes are recorded in activity history (e.g. `activityStatusId` in the changes array and the appropriate action type). This supports restore logic (previous status) and audit (who requested delete, who performed soft/hard delete).
