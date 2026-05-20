# Activity edit form — updating field values (react-hook-form)

## Why use `setActivityFormFieldValue`?

Custom controls in the activity form (Radix Select/Checkbox primitives, Headless/UI Combobox wrappers, TipTap-backed `RichTextField`, date/time popovers) are wired through `react-hook-form` `Controller` via `FormField`. Under **React 19** and **Vite 8**, values written through Controller `field.onChange` alone have been observed **not always persisting or marking fields dirty** (see CORPCAL-239).

The calendar UI writes those user edits with `form.setValue` and shared options instead, via **`setActivityFormFieldValue`** in [`src/lib/activity-form-set-field.ts`](../src/lib/activity-form-set-field.ts).

## Rule

Inside `FormField` render props under `calendar-ui/src/components/activity/ActivityFormSections/`:

- For **custom controls** (`onValueChange`, `onChange` from Radix/Shadcn, Combobox, `RichTextField`, `ScheduledDatePopoverField`, etc.): call

  ```ts
  setActivityFormFieldValue(form, field.name, nextValue);
  ```

- Prefer passing **`field.name`** so renames stay type-checked against `ActivityFormData`.

## Exceptions

- **Native DOM inputs**: `Textarea` / `Input` that spread `{...field}` may keep default RHF handlers; they are stable for standard change events.

- **`field.onBlur`**: Keep forwarding `onBlur={field.onBlur}` where blur is required for touched/dirty UX (for example [`AddressAutocomplete`](../src/components/activity/ActivityFormSections/ActivityEventSection.tsx) `onBlurCommit`).

## Multi-field updates

When one user action updates several registered fields (for example lead team changing `leadOrgId`), call **`setActivityFormFieldValue` once per field**. Do **not** use ad-hoc `form.setValue` options — use the helper so behaviour matches `ACTIVITY_FIELD_SET_OPTS`.

For Radix Select / RadioGroup string callbacks, coerce through helpers in [`activity-form-coerce-value.ts`](../src/lib/activity-form-coerce-value.ts) (`optionalSelectIdValue`, `lookAheadStatusFormValue`, etc.) instead of inline `Number(value)` or enum casts.

## Verification locally

Ensure activity form sections have no regressions:

```bash
rg 'field\.onChange' calendar-ui/src/components/activity/ActivityFormSections
rg 'DIRTY_CASCADE|setDateOpts' calendar-ui/src/components/activity/ActivityFormSections
```

Both should report no matches after a migration.

Regression coverage:

- [`useActivityEditFormHydration.field-update.test.tsx`](../src/hooks/useActivityEditFormHydration.field-update.test.tsx) — post-hydration `setActivityFormFieldValue` persists and marks dirty.
- [`ActivityOverviewSection.field-update.test.tsx`](../src/components/activity/ActivityFormSections/ActivityOverviewSection.field-update.test.tsx) — checkbox + `FormSelectSafe` wiring after hydration.
- [`ActivityPage.test.tsx`](../src/pages/ActivityPage.test.tsx) — discard flow after a custom control edit (CORPCAL-239).

TipTap/jsdom: mock `@/components/ui/rich-text-field` via [`src/test-utils/rich-text-field-mock.tsx`](../src/test-utils/rich-text-field-mock.tsx) (dynamic `import()` in `vi.mock` — see that file).

## Checklist — adding a new field in activity sections

1. If the UI is Radix/Shadcn, Combobox, rich text, or a date/time popover, wire updates with `setActivityFormFieldValue(form, '<fieldName>', value)`.
2. If multiple fields cascade, one helper call per affected name.
3. Run the grep checks above from the repo root.
4. Add or extend hydration + field-update tests when the behaviour is fragile or regression-prone.
5. **Hydration baseline sentinels** — the form compares RHF `defaultValues` to live values for dirty state and Changed badges. `canonicalizeActivityFormData` (compare/submit oracle) and UI controls often represent “empty” differently:
   - **Optional plain-text Textarea** (`notes`, `schedulingNotes`, `strategy`): canonicalize → `undefined`; Textarea `onChange` → `''`. Add the field to `UI_BASELINE_FIELD_SENTINELS` in [`activity-form-ui-baseline-sentinels.ts`](../src/lib/activity-form-ui-baseline-sentinels.ts) and extend the parameterized cases in [`activity-form-hydrate.test.ts`](../src/lib/activity-form-hydrate.test.ts).
   - **Rich text** (`RichTextField`): canonicalize optional empty → `undefined`; TipTap `onChange` → `EMPTY_RICH_TEXT_DOC`. Same sentinel map + hydrate test update.
   - **Select / date popover / ID array / boolean / venue**: empty storage already matches canonicalize (`undefined`, `[]`, `false`, nested `null`). No hydrate override — see `UI_BASELINE_CANONICAL_ONLY_FIELD_CATEGORIES` in the same module.
6. When adding a sentinel field, also add `canonOptString` (plain text) or rich-text empty handling in `packages/shared/src/utils/activity-form-canonicalize.ts` if the field is optional and compared on save.
