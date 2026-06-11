# Adding required activity form fields

Activity create/edit forms show a sticky-bar hint (`"N more required fields"`) driven by
`createActivityRequestSchema` / `updateActivityRequestSchema` and
`isZodMissingRequiredIssue` (calendar-ui `form-utils.ts`).

Classification uses **stable Zod issue metadata**, not validation message text.

## Checklist when adding a required create field

1. **Add schema validation** in `activity.schema.ts` (or the relevant request schema).
2. **Choose how the empty state is detected** (see below).
3. **Add a user-facing label** in `ACTIVITY_FIELD_LABELS` (`activity-field-labels.ts`).
4. **Update `ACTIVITY_CREATE_REQUIRED_FIELD_KEYS`** if the field is required on create
   (used for UI required indicators; keep in sync with the schema).
5. **Add a contract test** in `activity.schema.spec.ts` or
   `is-zod-missing-required-issue.spec.ts`: empty payload → `safeParse` fails → issue for
   that field is classified as missing-required.
6. **Rebuild `@corpcal/shared`** (`npm run build` in `packages/shared`) before running
   calendar-ui tests — vitest resolves shared from `dist/esm`.

## How issues are classified

| Validation style                               | Issue signal                                | Counts as missing-required? |
| ---------------------------------------------- | ------------------------------------------- | --------------------------- |
| `z.string().min(1)`                            | `too_small`                                 | Yes (automatic)             |
| `z.array(...).min(1)`                          | `too_small`                                 | Yes (automatic)             |
| Required `z.number().int()` etc.               | `invalid_type`                              | Yes (automatic)             |
| `z.string().max(n)` when too long              | `too_big`                                   | No (automatic)              |
| Custom `.refine()` — field empty               | `custom` + `params: { kind: 'required' }`   | Yes                         |
| Custom `.refine()` — value present but invalid | `custom` + `params: { kind: 'constraint' }` | No                          |

Use helpers from `zod-issue-kind.ts`:

```ts
import {
  zodRequiredIssueParams,
  zodConstraintIssueParams,
} from '../validation/zod-issue-kind';

// Empty/missing required value (e.g. rich-text summary after plain-text check)
.refine((data) => hasSummary(data), {
  message: SUMMARY_REQUIRED_MESSAGE,
  path: ['summary'],
  ...zodRequiredIssueParams(),
})

// Structural rule when data is already provided (e.g. exactly one lead planner)
.refine(eventPlannerLeadRefine, {
  message: EVENT_PLANNER_LEAD_REFINE_MESSAGE,
  path: ['eventPlanners'],
  ...zodConstraintIssueParams(),
})
```

For Zod v4, spread `zodRequiredIssueParams()` / `zodConstraintIssueParams()` into the
refine options object. Each helper sets `params: { kind: 'required' | 'constraint' }`
on the emitted issue (do not put `kind` at the top level of the refine options).

## Same path, two failure modes

Some fields fail in more than one way (e.g. `commsContacts`):

- **Empty array / missing** → `.min(1)` → `too_small` → missing-required.
- **Entries present but no lead** → separate `.refine()` with `kind: 'constraint'`.

Do not use a single object-level refine for both cases unless you use `superRefine` and
emit the correct `kind` per branch.

## What you do not need to change

- `calendar-ui/src/lib/form-utils.ts` — imports `isZodMissingRequiredIssue` from `@corpcal/shared/validation`.
- `useActivityFormSubmitState.ts` — derives missing fields from live `safeParse`.

## Related files

- `packages/shared/src/validation/zod-issue-kind.ts` — `ZOD_ISSUE_KIND` constants
- `packages/shared/src/validation/is-zod-missing-required-issue.ts` — classifier
- `packages/shared/src/utils/activity-field-labels.ts` — labels and required-key list
- `calendar-ui/src/lib/form-utils.ts` — maps classified issues to sticky-bar copy
