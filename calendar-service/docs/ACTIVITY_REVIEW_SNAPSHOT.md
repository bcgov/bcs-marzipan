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

When `reviewed_field_snapshot` is `NULL`, the baseline for diff purposes is the **canonical empty form** (all fields at their default/empty values). Activities in **New** status never show review-diff badges: `changedFieldsSinceReview` is an empty list for reviewers until the activity has left **New** (there is no "last review" yet). For **Changed** or **Reviewed** rows with a null snapshot (e.g. after restore from **Deleted**), the empty-form baseline applies and non-empty fields may appear in the diff.

## Baseline Definition

**"Value at last Reviewed"** — badges indicate fields whose **current normalized value** differs from the normalized value in the last persisted Reviewed snapshot. If a field is changed and then reverted to its original value, the badge is removed.

When no snapshot exists (never Reviewed, or cleared by Deleted), the baseline is the canonical empty form produced by `getEmptyReviewBaseline()` from `packages/shared/src/utils/activity-review-diff.ts`.

## Status Lifecycle Rules

| Status Transition                 | Snapshot Behaviour                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| **Create as New**                 | No snapshot written; `NULL` baseline (empty form)                                    |
| **Update while New**              | Status stays **New** until reviewed; no snapshot; reviewers get no review-diff paths |
| **Create as Reviewed**            | Snapshot written from the created activity state                                     |
| **Update to Reviewed**            | Snapshot replaced with the post-update state                                         |
| **Update to Changed**             | Snapshot unchanged (baseline remains last Reviewed)                                  |
| **Delete requested**              | Snapshot unchanged                                                                   |
| **Soft delete (Deleted)**         | Snapshot cleared (`NULL`), version reset                                             |
| **Restore from Deleted**          | Snapshot remains `NULL` (cleared state persists)                                     |
| **Restore from Delete requested** | Snapshot unchanged                                                                   |

## API Response

The `ActivityResponse` includes an optional field:

```typescript
changedFieldsSinceReview?: string[]
```

- **Included** only when the requesting user has `activities.review` permission.
- **Omitted** for non-reviewers (not present on the response object).
- For activities in **New** status, included as an **empty** array (no "changed since last review" until the first **Reviewed** transition).
- Otherwise contains dotted field paths matching RHF form field names (e.g. `title`, `venueAddress.city`, `categoryIds`).

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

For the activity form field-change checklist (including when to update `buildReviewDiffLookups()`), see [ACTIVITY.md](./ACTIVITY.md).

## Backfill (Mock / Dev only)

The `backfill:review-snapshots` CLI is a **mock-data helper only** for local/dev environments.
Do **not** run this command against production data.

Typical local usage:

```bash
cd calendar-service
npm run seed:snapshot
```

- `npm run seed` runs seed files only.
- `npm run seed:snapshot` runs seed files, then backfills/recomputes review snapshots for local mock data.
- `npm run backfill:review-snapshots -- --mock-changed-only` updates only Changed rows with synthetic prior snapshots for reviewer testing.
- `npm run backfill:review-snapshots -- --reviewed-only` updates only Reviewed rows where snapshot is `NULL`.
- `npm run backfill:review-snapshots -- --recompute-all` rewrites snapshots for all Reviewed rows.

## Junction Field Name-to-ID Resolution

The API response contains display-name arrays for junction fields (`category`, `commsMaterials`, `translationsRequired`, `sharedWith`), while the form data uses ID arrays (`categoryIds`, `commsMaterialIds`, `translationLanguageIds`, `sharedWithTeamIds`). Mapping a response to form data requires name-to-ID lookups so the diff operates on IDs, matching the client form.

Both the server (`ActivitiesService.getReviewDiffLookups()`) and the client (`buildFormLookups` in `calendar-ui`) use the shared `buildReviewDiffLookups()` from `packages/shared/src/utils/build-review-diff-lookups.ts` to construct these resolvers from the same trim/lowercase matching rules.

Server-side lookups are **unscoped** (all active rows, not team-filtered) so that review diffs resolve correctly even when the reviewer's team scoping would exclude an item from the picker.

### Recomputing existing snapshots after deploy

Snapshots written before junction lookup resolution was added contain empty ID arrays for junction fields. After deploying the fix, the "current" side uses real IDs while the stored baseline still has empty arrays, which can cause false-positive review badges on junction fields until the activity is next marked Reviewed.

For local/dev validation, you can recompute all Reviewed snapshots with:

```bash
cd calendar-service
npm run backfill:review-snapshots -- --recompute-all
```

This rewrites `reviewed_field_snapshot` using the updated mapping (with lookups), so the stored baseline matches the new resolution logic and review badges start clean.

For production environments, do not use this CLI command. If historical snapshot realignment is needed, ship a reviewed migration/runbook specifically for production data handling.

## Excluded and review-exempt fields

`diffReviewFields` (used for both `changedFieldsSinceReview` and for deciding whether a save moves **Reviewed** → **Changed**) takes an **effective review-exempt** set, passed in from the server. Two mechanisms apply:

### System-excluded keys (`EXCLUDED_FIELDS`)

The following top-level keys are **never** compared in the review diff (they are system- or workflow-managed, not free-form “content” the reviewer compares):

- `activityStatusId`
- `markAsReviewed`
- `activityHistoryNotes`
- `commsContactLeadId`
- `leadMinistryId`

Defined in `packages/shared/src/utils/activity-review-diff.ts`.

### Review-exempt keys (code + admin)

Additional top-level keys may be **omitted** from the diff: edits to those keys do not produce paths in `changedFieldsSinceReview` and do not, by themselves, cause a **Reviewed** activity to move to **Changed**. That set is the union of:

- **Code-exempt** — `ACTIVITY_REVIEW_EXEMPT_CODE_KEYS` in `packages/shared/src/review-exempt-settings.ts`
- **Admin-configurable** — stored in `application_settings`, validated allowlist; defaults include sharing/visibility–style fields

**Documentation:** [ACTIVITY_REVIEW_EXEMPT_SETTINGS.md](./ACTIVITY_REVIEW_EXEMPT_SETTINGS.md) (API, permissions, settings UI, and what to update when the form schema changes).

## Future: List Page Highlighting

The `changedFieldsSinceReview` array is available on list responses for reviewers. A future milestone can use these paths to highlight changed activities or fields in the activity table without additional API work.
