# Admin-configurable review-exempt activity fields

This document describes which activity form fields can be marked **review-exempt**: editors may change them without moving a **Reviewed** activity to **Changed**, and those changes do not appear in `changedFieldsSinceReview` (reviewer “changed since last review” paths).

It complements [ACTIVITY_REVIEW_SNAPSHOT.md](./ACTIVITY_REVIEW_SNAPSHOT.md) (snapshot model) and [ACTIVITY.md](./ACTIVITY.md) (field-add playbook).

## Behavior summary

- **Review diff and status** use `diffReviewFields` in `packages/shared/src/utils/activity-review-diff.ts` with an **effective exempt set**:
  - **Code-exempt** — always in the set, not toggleable: `ACTIVITY_REVIEW_EXEMPT_CODE_KEYS` in `packages/shared/src/review-exempt-settings.ts` (e.g. summary, scheduling-related top-level keys).
  - **Admin-configurable** — stored in the database, merged with the code set: `buildEffectiveReviewExemptKeys` uses keys from `application_settings` under `ACTIVITY_REVIEW_EXEMPT_FIELD_KEYS_SETTING` (default seed: `visibility`, `sharedWithTeamIds`).

- **RHF “dirty” / local “Changed”** behaviour on the form is unchanged; exemption applies only to **review workflow** (status transition and `changedFieldsSinceReview`).

## API

- `GET /settings/review-exempt-fields` — returns `{ fieldKeys: string[] }` (configurable keys only, after server validation).
- `PATCH /settings/review-exempt-fields` — body `{ fieldKeys: string[] }` (allowlisted values only; duplicates removed).

**Permission:** `settings.manage.review_exempt_fields` (intended for **System Admin**; see `packages/database/seeds/0010_20260422_review_exempt_fields_seed.sql`).

**Implementation:** `ReviewExemptFieldsController` in `calendar-service`, persistence in `ApplicationSettingsService` (`getReviewExemptFieldKeys` / `setReviewExemptFieldKeys`).

## UI

- **Settings** page, section “Review-exempt fields”: `ReviewExemptFieldsSettingsAdmin` in `calendar-ui` renders `ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_SECTIONS` as grouped checkboxes; labels use `getActivityFieldLabel` / `ACTIVITY_FIELD_LABELS` from shared.

## When you change the activity form or schema

Adding, removing, or renaming a **top-level** `ActivityFormData` field that should be **available** in the admin “review-exempt” list (or that must be **code**-exempt) requires **manual** updates in shared—there is no codegen from the Zod form schema today. Follow the [Field-Add Playbook in ACTIVITY.md](./ACTIVITY.md#field-add-playbook-activity-form), including the review-exempt step.

**Files to touch (review-exempt-specific):**

| File                                                             | What to do                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared/src/review-exempt-settings.ts`                  | For a new **configurable** field: add the key to the correct entry in `ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_SECTIONS` (and ensure it is not in `ACTIVITY_REVIEW_EXEMPT_CODE_KEYS` unless it should be fixed in code). For a new **code-only** exempt field: add to `ACTIVITY_REVIEW_EXEMPT_CODE_KEYS` and **remove** it from the configurable section list if it was listed. |
| `packages/shared/src/schemas/review-exempt-field-keys.schema.ts` | The allowlist is derived from the same configurable keys; ensure the `z.enum` input stays consistent after edits to `ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_KEYS` (rebuild shared).                                                                                                                                                                                            |
| `packages/shared/src/utils/activity-review-diff.ts`              | If the field affects `getEmptyReviewBaseline` or comparison rules, follow the main playbook.                                                                                                                                                                                                                                                                                |

**Deployment:** no extra migration for the setting row beyond seed; if you add new allowed keys, existing DB values remain valid; unknown keys in stored JSON are stripped on read/save.

## Related code references

- Effective merge: `buildEffectiveReviewExemptKeys` — `review-exempt-settings.ts`
- Server use: `ActivitiesService.getEffectiveReviewExemptFieldKeys` — `calendar-service/src/activities/services/activities.service.ts`
- Zod: `reviewExemptFieldKeysSettingsSchema` — `packages/shared/src/schemas/review-exempt-field-keys.schema.ts`
