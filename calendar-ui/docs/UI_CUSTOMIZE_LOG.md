# UI customize log

Append-only notes for fork-level UI changes that diverge from stock Shadcn/Radix/Base UI behavior. See also [SHADCN_STANDARDIZATION_GUIDE.md](./SHADCN_STANDARDIZATION_GUIDE.md).

---

## Radix Select popover (scroll + height)

**Files:** [src/components/ui/select.tsx](../src/components/ui/select.tsx), [src/styles/globals.css](../src/styles/globals.css)

- Capped dropdown height with `min(var(--popover-list-max-height), var(--radix-select-content-available-height))`.
- Removed default Radix `ScrollUpButton` / `ScrollDownButton` chevron strips.
- Content uses flex column with `min-h-0`; viewport uses `min-h-0 flex-1 overflow-y-auto` so the list scrolls inside the panel instead of being clipped by the parent without a scrollbar.
- Radix injects CSS that hides the select viewport scrollbar; restored visible scrollbar via shared `.popover-list-scroll` rules targeting `[data-radix-select-viewport].popover-list-scroll` with `!important` where needed.

---

## Popover list scrollbar consistency

**Date:** 2026-03-18

**Token:** `--popover-list-max-height: 18rem` in `:root` and `.dark` ([globals.css](../src/styles/globals.css)).

**Shared class:** `.popover-list-scroll` — themed thin scrollbar (Firefox `scrollbar-color`, WebKit track/thumb). Select viewport uses an additional selector block so Radix’s injected hide is overridden.

**Components updated:**

| Component            | Change                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Select               | Viewport class `popover-list-scroll`; content max-height uses token                                                       |
| Combobox             | `ComboboxContent` and `ComboboxList` max-height tied to token; list has `popover-list-scroll`                             |
| Command              | `CommandList`: `popover-list-scroll`, `max-h` = token (replaces 300px)                                                    |
| DropdownMenu         | `DropdownMenuContent` / `SubContent`: token-capped max-height, `popover-list-scroll`, submenus scroll (`overflow-y-auto`) |
| freeform-combobox    | Popup and list use token + `popover-list-scroll`                                                                          |
| address-autocomplete | Suggestions panel: token + `popover-list-scroll`                                                                          |

**Rationale:** One visual and height story for scrollable overlay lists; long submenu panels can scroll instead of clipping.

---

## Read-only vs disabled (form surfaces)

**Date:** 2026-03-19

**Goal:** Context-driven view-only forms should keep full-contrast “editable” surfaces; reserve `disabled` for field-level muting (e.g. venue TBD).

**Files:**

| File                                                                                                        | Change                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [src/components/app/form-select.tsx](../src/components/app/form-select.tsx)                                 | `FormSelect` / `FormSelectTrigger`: Radix Select stays non-`disabled` for view-only; controlled `open={false}`; trigger `pointer-events-none` + `aria-readonly` when read-only.                                                                                                                                                                                                                                            |
| [src/components/ui/checkbox.tsx](../src/components/ui/checkbox.tsx)                                         | Optional `readOnly`: sets `disabled` for interaction, `data-readonly`, `opacity-100!` to avoid muted look.                                                                                                                                                                                                                                                                                                                 |
| [src/components/ui/switch.tsx](../src/components/ui/switch.tsx)                                             | Optional `readOnly`: same pattern as Checkbox.                                                                                                                                                                                                                                                                                                                                                                             |
| [src/components/ui/radio-group.tsx](../src/components/ui/radio-group.tsx)                                   | Optional `readOnly` on root + context; items use `opacity-100!` when read-only.                                                                                                                                                                                                                                                                                                                                            |
| [src/components/ui/scheduled-date-popover-field.tsx](../src/components/ui/scheduled-date-popover-field.tsx) | Optional `readOnly`: popover does not open; trigger not `disabled` for view-only.                                                                                                                                                                                                                                                                                                                                          |
| [src/components/ui/twelve-hour-time-field.tsx](../src/components/ui/twelve-hour-time-field.tsx)             | Optional `readOnly`: static 12h display; popover opens on focus (schedule row). Optional `allDay`: strip + `Switch` at top; when on, trigger shows label (clock/label reopen popover), picker disabled with no selection highlight. Schedule row hides arrow + end time when all day. Popover portals into field wrapper for tab order; roving `tabIndex` + arrows in picker columns; inline hour/minute use ArrowUp/Down. |
| [src/components/ui/popover.tsx](../src/components/ui/popover.tsx)                                           | `PopoverContent` optional `container` for portal mount (inline tab order).                                                                                                                                                                                                                                                                                                                                                 |
| [src/components/ui/button.tsx](../src/components/ui/button.tsx)                                             | `Button` uses `forwardRef` for focus management.                                                                                                                                                                                                                                                                                                                                                                           |
| [src/components/ui/address-autocomplete.tsx](../src/components/ui/address-autocomplete.tsx)                 | Optional `readOnly`: native `readOnly` on input; no dropdown.                                                                                                                                                                                                                                                                                                                                                              |

**Base UI Combobox:** Root already supports `readOnly` (distinct from `disabled`). Activity forms pass `readOnly={readOnly}` instead of `disabled={readOnly}` for chip multiselects — no fork in [combobox.tsx](../src/components/ui/combobox.tsx) required for that behavior.

**Static-field look (stricter read-only):** Shared Tailwind fragments in [read-only-static-field.ts](../src/lib/read-only-static-field.ts) — hide placeholders, dropdown chevrons, and hover/focus affordances on read-only triggers; [combobox.tsx](../src/components/ui/combobox.tsx) wraps Root with a read-only context for chips/chip-remove/chevron.

---

## Activity form: no shadow on field surfaces

**Date:** 2026-03-19

**Goal:** Activity create/edit/view forms use a single visual rule: native inputs, textareas, chip comboboxes, input groups, outline triggers (date/time popovers), and switches do not show the stock `shadow-xs` / outline-button shadow.

**Files:**

| File                                                                                            | Change                                                                                                                                              |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| [src/components/activity/ActivityFormBody.tsx](../src/components/activity/ActivityFormBody.tsx) | Wrapper applies descendant `shadow-none` via `data-slot` / `button[data-variant=outline]` selectors (`ACTIVITY_FORM_FIELD_SHADOW_RESET`).           |
| [src/components/ui/freeform-combobox.tsx](../src/components/ui/freeform-combobox.tsx)           | Chips-mode trigger `div` gets `data-slot="freeform-combobox-chips"` so the activity form scope can remove its shadow without affecting other pages. |

**Rationale:** Stock Shadcn-style inputs use `shadow-xs`; read-only fields already used `shadow-none`, which looked inconsistent next to editable fields. Scoping under `ActivityFormBody` avoids changing global `Input` / `Textarea` / combobox defaults for the rest of the app.

---

## Required-field asterisk colour (activity form)

**Date:** 2026-03-22

**Tokens:** In [globals.css](../src/styles/globals.css), `--required-field-indicator` points at `--activity-status-deleted` (same as Deleted activity status badge background / `--status-red`). Exposed to Tailwind as `--color-required-field-indicator` in `@theme`.

**Component:** [form.tsx](../src/components/ui/form.tsx) exports `RequiredFieldIndicator` (asterisk using `text-[var(--color-required-field-indicator)]`).

**Activity sections using it:** [ActivityOverviewSection.tsx](../src/components/activity/ActivityFormSections/ActivityOverviewSection.tsx) (category, title, lead team, summary), [ActivityScheduleSection.tsx](../src/components/activity/ActivityFormSections/ActivityScheduleSection.tsx) (Date / Time row labels), [ActivityCommsSection.tsx](../src/components/activity/ActivityFormSections/ActivityCommsSection.tsx) (comms lead). Visibility intentionally has no required asterisk (API defaults `global`).

---

## Deferred inline field errors (activity / onChange forms)

**Date:** 2026-06-10

**Goal:** With `mode: 'onChange'` and programmatic `setValue(..., { shouldValidate: true })`, react-hook-form can hold validation errors on mount while the sticky submit bar still uses live Zod/RHF state. Inline `FormMessage` / `aria-invalid` should not appear until the user has interacted with a field or attempted submit.

**Files:**

| File                                                        | Change                                                                                                                                                                                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [src/components/ui/form.tsx](../src/components/ui/form.tsx) | `useFormField` exposes `showError`: error is shown only when `isTouched`, `isDirty`, or `submitCount > 0`. `FormControl` and `FormMessage` use `showError` instead of raw `error` for `aria-invalid`, `aria-describedby`, and message text. |

**Scope:** Applies to all forms using `FormControl` / `FormMessage` from this module (not opt-in via `FormDisplayOptionsProvider`).

**Note:** `FormLabel` still uses raw `error` for destructive label styling; labels may turn red before the inline message appears.

**Rationale:** Keeps validation running on change for submit gating without showing errors on untouched empty fields on first paint. Left in `useFormField` so message, control, and a11y attributes stay consistent in one place.
