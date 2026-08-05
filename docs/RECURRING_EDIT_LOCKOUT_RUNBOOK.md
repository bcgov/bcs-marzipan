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

## Exempt Roles

- Users in exempt roles can still edit during lockout.
- If exempt role list is explicitly empty, no roles are exempt.
- If exempt role list is missing/invalid, system defaults are used.

## User-Facing Behavior

- Lock acquire can fail with a machine-readable reason:
  - `time_lockout`: blocked by recurring lockout window.
  - `locked_by_other`: another user holds the lock.
- UI should show different messaging for these cases.

## Troubleshooting "Why can't I edit?"

1. Confirm current Pacific time relative to configured lockout window.
2. Confirm lockout `isActive` is enabled.
3. Confirm user's role is or is not in exempt roles.
4. Check if a different user currently holds the edit lock.
5. Verify banner lead minutes and expected banner visibility window.
