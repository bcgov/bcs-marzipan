# Activity Status Flow

This document describes the business rules for activity statuses: which statuses exist, how they are set, and who can perform status-changing actions.

## Statuses

| Status               | Description                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| **New**              | Initial state when an activity is created (non-admin).                                                       |
| **Changed**          | Set after any edit unless an admin marks as reviewed.                                                        |
| **Reviewed**         | Set when an admin submits create or update with "Mark as reviewed" checked.                                  |
| **Delete requested** | Set when a Comms contact or a member of the activity's lead team requests deletion (notes required).         |
| **Deleted**          | Soft delete; set when an admin/sysAdmin performs "Soft delete" (notes required).                             |
| **Completed**        | Set by a scheduled job a fixed delay after the activity end time (or after midnight for all-day activities). |
| **On hold**          | Not yet implemented; reserved for future use.                                                                |

Status is not user-editable on the activity form; it is set by the system based on the action and the user's role.

## Who Can Do What

- **Request delete**: **Comms contacts** on the activity (any entry in the activity's comms contacts, lead or not) or **members of the activity's lead team** may request delete.
- **Restore**: **Comms contacts** on the activity, **members of the activity's lead team**, or **Admin** / **System Admin** may restore.
- **Soft delete / Hard delete**: Admin or System Admin (and, where applicable, Comms lead for the activity, per existing delete guard).

## How Status Is Set

- **Create**: New activity is set to **New**. If the user is Admin or System Admin and submits with "Mark as reviewed" checked, status is set to **Reviewed**.
- **Update**: If current status is **Delete requested** or **Deleted**, updates are rejected. Otherwise: non-admin always sets status to **Changed**; Admin/System Admin sets **Reviewed** if "Mark as reviewed" is checked, otherwise **Changed**.
- **Request delete**: Sets status to **Delete requested**. Notes are required. Comms contacts on the activity or members of the activity's lead team may call this.
- **Soft delete**: Sets status to **Deleted**. Notes (reason) are required.
- **Hard delete**: A note is required. The delete and the identity of who deleted are recorded in activity history before the activity row is removed.
- **Restore**: Sets status back to the **most recent status before** the activity was set to **Delete requested** or **Deleted** (from activity history). If none is found, fall back to **Changed**.
- **Completed**: A scheduled job sets status to **Completed** a fixed number of minutes after the activity end (or after midnight for all-day). See `ACTIVITY_COMPLETED_DELAY_MINUTES` in shared constants.

## Edit Lock When Delete Requested or Deleted

When status is **Delete requested** or **Deleted**, edits to the activity are not allowed. The UI shows a banner and a **Restore** button for users who are allowed to restore (Comms contacts, members of the activity's lead team, Admin, System Admin).

Only **Admin** or **System Admin** may open the edit page when status is **Delete requested** or **Deleted**. Other users (including those with edit permission) can view the activity and, if allowed, use Restore from the banner; they are redirected to the view page if they navigate directly to the edit URL.

## Activity History

All status changes are recorded in activity history (e.g. `activityStatusId` in the changes array and the appropriate action type). This supports restore logic (previous status) and audit (who requested delete, who performed soft/hard delete).
