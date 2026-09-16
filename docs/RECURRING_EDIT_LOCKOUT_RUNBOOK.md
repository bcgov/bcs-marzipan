# Recurring Edit Lockout Runbook

## Purpose

Use recurring edit lockout to prevent activity edits during scheduled windows while warning users ahead of time with a banner.

## Timezone and Window Semantics

- All recurring lockout schedule checks use Pacific time.
- Lockout start time is inclusive.
- Lockout end time is exclusive.
- Example: `09:00` to `10:00` blocks edits from `09:00` through `09:59` and allows edits at `10:00`.

## Banner Timing

- `Banner lead minutes` controls how early the lockout banner appears before the lockout start time.
- Banner is shown from `startTimeOfDay - bannerLeadMinutes` until `endTimeOfDay` (end exclusive).
- Example: start `14:00`, end `16:00`, lead `20` means banner appears at `13:40`.

## Permissions

| Permission                            | Purpose                                                                             |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| `settings.manage.recurring_lockout`   | View and configure lockout schedule and banner (Admin and System Admin by default)  |
| `activities.bypass_recurring_lockout` | Edit activities during an active lockout window (Admin and System Admin by default) |

Bypass uses effective permissions (user role plus team grants), not role ID alone. Assign bypass via role-permission management for custom roles as needed.

## User-Facing Behavior

- Lock acquire can fail with a machine-readable reason:
  - `time_lockout`: blocked by recurring lockout window.
  - `locked_by_other`: another user holds the lock.
- UI should show different messaging for these cases.

## Troubleshooting "Why can't I edit?"

1. Confirm current Pacific time relative to configured lockout window.
2. Confirm lockout `isActive` is enabled.
3. Confirm the user has `activities.bypass_recurring_lockout` (re-login after permission changes).
4. Check if a different user currently holds the edit lock.
5. Verify banner lead minutes and expected banner visibility window.
