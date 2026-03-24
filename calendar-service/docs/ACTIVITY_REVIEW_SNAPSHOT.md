# Activity Review Snapshot

This document describes the "changed since last review" feature: how field-level review diff badges work, the data model, and lifecycle rules.

For general status flow rules see [ACTIVITY_STATUS_FLOW.md](./ACTIVITY_STATUS_FLOW.md).

## Purpose

Reviewers (`activities.review` permission) need to see which fields have changed since the activity was last marked **Reviewed**. The system tracks this via a canonical JSON snapshot of the activity's form-data state, persisted each time the status transitions to **Reviewed**.

## Data Model

Two columns on the `activities` table:

| Column                            | Type      | Nullable | Default | Description                                              |
| --------------------------------- | --------- | -------- | ------- | -------------------------------------------------------- |
| `reviewed_field_snapshot`         | `jsonb`   | Yes      | `NULL`  | Canonical form-data snapshot at last Reviewed transition |
| `reviewed_field_snapshot_version` | `integer` | No       | `1`     | Schema version of the snapshot shape (see Versioning)    |

When `reviewed_field_snapshot` is `NULL`, the baseline is the **canonical empty form** (all fields at their default/empty values). This means New activities that have never been Reviewed will show all populated fields as "changed since last review."

## Baseline Definition

**"Value at last Reviewed"** — badges indicate fields whose **current normalized value** differs from the normalized value in the last persisted Reviewed snapshot. If a field is changed and then reverted to its original value, the badge is removed.

When no snapshot exists (never Reviewed, or cleared by Deleted), the baseline is the canonical empty form produced by `getEmptyReviewBaseline()` from `packages/shared/src/utils/activity-review-diff.ts`.

## Status Lifecycle Rules

| Status Transition                 | Snapshot Behaviour                                  |
| --------------------------------- | --------------------------------------------------- |
| **Create as New**                 | No snapshot written; `NULL` baseline (empty form)   |
| **Create as Reviewed**            | Snapshot written from the created activity state    |
| **Update to Reviewed**            | Snapshot replaced with the post-update state        |
| **Update to Changed**             | Snapshot unchanged (baseline remains last Reviewed) |
| **Delete requested**              | Snapshot unchanged                                  |
| **Soft delete (Deleted)**         | Snapshot cleared (`NULL`), version reset            |
| **Restore from Deleted**          | Snapshot remains `NULL` (cleared state persists)    |
| **Restore from Delete requested** | Snapshot unchanged                                  |

## API Response

The `ActivityResponse` includes an optional field:

```typescript
changedFieldsSinceReview?: string[]
```

- **Included** only when the requesting user has `activities.review` permission.
- **Omitted** for non-reviewers (not present on the response object).
- Contains dotted field paths matching RHF form field names (e.g. `title`, `venueAddress.city`, `categoryIds`).

## UI Indicators

Two visually indistinct badge types appear on form labels (allowing them to be differentiated if needed):

1. **"Changed"** — RHF dirty-field indicator for unsaved edits (existing behaviour).
2. **"Changed since last review"** — Review-diff indicator for fields changed since last Reviewed snapshot.

The dirty indicator takes priority: when a field is both unsaved-dirty and review-changed, only the "Changed" badge is shown. The "Review" badge appears only when the field is not currently dirty but differs from the last Reviewed snapshot.

"Changed since last review" badges are hidden for non-reviewer users and on the create form.

## Versioning

`REVIEW_SNAPSHOT_VERSION` in `packages/shared/src/constants/constants.ts` tracks the canonical shape of the snapshot JSON.

When adding or removing tracked fields, or changing normalisation rules:

1. Bump `REVIEW_SNAPSHOT_VERSION`.
2. On read, snapshots with an older version are treated as absent (empty-form baseline) until the activity is next marked Reviewed, which rewrites the snapshot at the current version.

This avoids the need for a data migration on every schema change. For bulk corrections, a one-time migration script can be written to recompute snapshots for all Reviewed activities.

## Backfill (Initial Migration)

When deploying this feature to an existing database:

- **Reviewed** activities: set `reviewed_field_snapshot` to the canonicalized current state (computed from the activity row plus junction tables). This makes the diff start empty for already-reviewed activities.
- **New / Changed / Delete requested / Completed**: leave `NULL` (implies empty-form baseline).
- **Deleted**: leave `NULL` (cleared state).

Drizzle schema migrations do **not** emit this logic. Use the calendar-service CLI (runs the same `mapResponseToFormData` + `buildReviewSnapshot` path as runtime writes):

```bash
cd calendar-service
npm run backfill:review-snapshots -- --reviewed-only
```

- Idempotent: only updates **Reviewed** rows where `reviewed_field_snapshot` is still `NULL`.
- **Mock / dev seed**: `npm run seed` runs SQL seeds and then applies synthetic prior snapshots for all **Changed** activities so reviewers see non-empty `changedFieldsSinceReview`. To re-run only the mock step: `npm run backfill:review-snapshots -- --mock-changed-only`. To run both backfills: `npm run backfill:review-snapshots` (no flags).

## Excluded Fields

The following fields are excluded from the review diff (they are system-managed, not user-editable):

- `activityStatusId`
- `markAsReviewed`
- `activityHistoryNotes`
- `commsContactLeadId`
- `leadMinistryId`

## Future: List Page Highlighting

The `changedFieldsSinceReview` array is available on list responses for reviewers. A future milestone can use these paths to highlight changed activities or fields in the activity table without additional API work.
