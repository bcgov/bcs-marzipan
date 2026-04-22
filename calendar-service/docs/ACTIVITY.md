# Activity Docs Index

This is the root document for activity-domain service docs. Use it as the entry point for behavior, lifecycle, and review-diff guidance.

## Core Activity Docs

- [ACTIVITY_STATUS_FLOW.md](./ACTIVITY_STATUS_FLOW.md) - status definitions, transitions, who can perform each action, and lock/restore behavior.
- [ACTIVITY_EDIT_ELIGIBILITY.md](./ACTIVITY_EDIT_ELIGIBILITY.md) - who may edit, permission guards, and related UI/API edit constraints.
- [ACTIVITY_REVIEW_SNAPSHOT.md](./ACTIVITY_REVIEW_SNAPSHOT.md) - "changed since last review" snapshot model, versioning, diff behavior, and backfill details.
- [ACTIVITY_REVIEW_EXEMPT_SETTINGS.md](./ACTIVITY_REVIEW_EXEMPT_SETTINGS.md) - review-exempt fields (code + admin settings, API, UI, and maintenance when the form changes).

## Field-Add Playbook (Activity Form)

Use this checklist whenever you add, remove, rename, or materially change an `ActivityFormData` field that should participate in "changed since last review."

1. Update shared form schema/types in `packages/shared/src/schemas/activity.schema.ts`.
2. Ensure response-to-form mapping includes the field in `packages/shared/src/utils/activity-form-mapper.ts` (`mapResponseToFormData`).
3. Set the canonical empty value in `packages/shared/src/utils/activity-review-diff.ts` (`getEmptyReviewBaseline`).
4. Confirm canonicalization/diff behavior in `packages/shared/src/utils/activity-form-canonicalize.ts` and `packages/shared/src/utils/activity-review-diff.ts` (`diffReviewFields`) matches intended semantics (ordering, null/empty normalization, object keying).
5. If the field has a user-visible review badge label/path mapping, update `packages/shared/src/utils/activity-field-labels.ts`.
6. **Review impact (review-exempt list):** If the new field is a **top-level** `ActivityFormData` key, decide whether it should ever be **review-exempt** (edits that do not force Reviewed → Changed or show in `changedFieldsSinceReview`). Update `packages/shared/src/review-exempt-settings.ts`:
   - If it should be **configurable** by System Admins in Settings, add it to the appropriate `ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_SECTIONS` group (order aligned with `ActivityFormBody` / section components in `calendar-ui`). Ensure it is **not** listed in `ACTIVITY_REVIEW_EXEMPT_CODE_KEYS` if admins should control it.
   - If it should **always** be exempt (product rule, not admin-toggleable), add it to `ACTIVITY_REVIEW_EXEMPT_CODE_KEYS` and do **not** add it to the configurable sections. Rebuild `@corpcal/shared` so `review-exempt-field-keys.schema.ts` stays aligned.
   - If the field must **never** be exempt (e.g. primary content or compliance-sensitive), do not add it to either list; it will always affect review state when it changes. Fields that are **system-only** in the diff (see `EXCLUDED_FIELDS` in `activity-review-diff.ts`) are not admin options.
7. For full details and API reference, see [ACTIVITY_REVIEW_EXEMPT_SETTINGS.md](./ACTIVITY_REVIEW_EXEMPT_SETTINGS.md).
8. Bump `REVIEW_SNAPSHOT_VERSION` in `packages/shared/src/constants/constants.ts`.
9. Add or update tests for changed-path detection and snapshot behavior in shared utils tests.

### When to update `buildReviewDiffLookups()`

Only update `packages/shared/src/utils/build-review-diff-lookups.ts` when a field maps from API display values to form IDs (name-to-ID resolution).

- Typical cases: junction-style fields represented as names in `ActivityResponse` but as `*Ids` in form data.
- Not needed for scalar fields already represented in response/form with directly mappable values.

### Deployment and data alignment

- If the new/changed field affects stored snapshot semantics for already Reviewed records, run:

```bash
cd calendar-service
npm run backfill:review-snapshots -- --reviewed-only
```

- This rewrites `reviewed_field_snapshot` using current mapping/canonicalization so existing data aligns with the new logic.
