# UI map for QA rollups

Use these **user-facing names** in rollups. Routes match `calendar-ui/src/App.tsx`.

## Global chrome

| Name                | Route / location             | Areas QA often cares about        |
| ------------------- | ---------------------------- | --------------------------------- |
| Sign in             | `/login`                     | Email/password, Microsoft sign-in |
| App header          | All authenticated pages      | Notifications bell, navigation    |
| Notification center | `/notifications` (bell icon) | Unread list, open item, mark read |

## Activities

| Name                   | Route              | Areas                                                                                                                                      |
| ---------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Activity list          | `/` (home)         | Grid columns, filters, sort, flags, favourites, lock/"is editing" line, review highlighting on cells                                       |
| Activity detail / edit | `/activity/:id`    | Page header (status, last updated, flags, history), connection alert (top), form sections, sticky footer (save, discard, review, complete) |
| Create activity        | `/create-activity` | Same form sections as edit; create confirm modal                                                                                           |

### Activity form sections (edit and create)

Use these labels when pointing QA to a field group:

| Section         | Typical contents                                                 |
| --------------- | ---------------------------------------------------------------- |
| Overview        | Title, categories, ministries, status, pitch, etc.               |
| Event           | Venue, venue preset, event planners, location fields             |
| Schedule        | Dates, times, all-day, recurrence                                |
| Sharing         | Visibility, Share With teams, quick-share shortcuts              |
| Release / comms | Release and communications fields (if visible for activity type) |
| Other sections  | Follow on-screen section headings                                |

### Activity modals and dialogs

| Name                   | When it appears                                                        |
| ---------------------- | ---------------------------------------------------------------------- |
| Edit confirm           | Saving edits (may include "update public last updated" for some roles) |
| Review / Mark reviewed | Review workflow                                                        |
| Complete activity      | Completing an activity                                                 |
| Discard changes        | Footer when form has unsaved edits                                     |
| Delete / soft delete   | Destructive actions from activity page                                 |
| Activity history       | History control in header                                              |
| Assign / flag          | Flag control in header or list                                         |

## Reports

| Name    | Route      | Areas                                                                                                            |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| Reports | `/reports` | Report type tabs, date/range filters, Look Ahead / Exec LA day tabs, table, preview/print, custom report builder |

## Administration

| Name               | Route        | Areas                                                                                                |
| ------------------ | ------------ | ---------------------------------------------------------------------------------------------------- |
| Settings (lookups) | `/settings`  | Left/nav sections: venue presets, categories, tags, ministries, banner, permissions visibility, etc. |
| Users and teams    | `/users`     | Users tab, Teams tab, create user, create team                                                       |
| User detail        | `/users/:id` | Edit user modal, permissions, change log, transfer                                                   |
| Team detail        | `/teams/:id` | Team edit modal, members, change log                                                                 |

## Other routes

| Name           | Route             |
| -------------- | ----------------- |
| Dashboard      | `/dashboard`      |
| Global history | `/global-history` |

## Mapping code to this map (agent only)

When reading diffs, use this rough guide — do not put these paths in the QA document:

- `calendar-ui/src/pages/ActivityPage.tsx` → Activity detail / edit
- `calendar-ui/src/pages/ActivityListPage.tsx` → Activity list
- `calendar-ui/src/components/activity/ActivityFormSections/*` → Form sections above
- `calendar-ui/src/pages/ReportsPage.tsx` → Reports
- `calendar-ui/src/pages/Settings.tsx` + `components/admin/*` → Settings
- `calendar-ui/src/pages/UserManagement.tsx`, `UserDetailPage.tsx`, `TeamDetails.tsx` → Users and teams

Backend-only changes: describe **visible behaviour** on the pages above, or state **no visible change** if QA would not see a difference.
