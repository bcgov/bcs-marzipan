import type { FieldPath, FieldPathValue, UseFormReturn } from 'react-hook-form';

import type { ActivityFormData } from '@corpcal/shared/schemas';

/**
 * Shared RHF options for user-driven activity form edits.
 * Use only via {@link setActivityFormFieldValue} in activity sections so cascades stay consistent.
 *
 * `shouldValidate` is false so a single control edit does not re-run the full
 * create schema on every Radix callback (which can block Save for unrelated
 * baseline errors). Submit and explicit validation paths still run the resolver.
 */
export const ACTIVITY_FIELD_SET_OPTS = {
  shouldDirty: true,
  shouldTouch: true,
  shouldValidate: false,
} as const;

/**
 * Writes an activity form field via `form.setValue` instead of Controller `field.onChange`.
 *
 * **When to use:** Radix/Shadcn custom controls (Select, Checkbox, Combobox wrappers),
 * TipTap-backed `RichTextField`, date/time popovers — anything whose callback is not a
 * native input `event` bubbling through `{...field}`.
 *
 * **When not required:** Plain `Input`/`Textarea` with `{...field}`.
 *
 * **Cascades:** Call this once per affected `FieldPath<ActivityFormData>` instead of mixing
 * `field.onChange` with raw `setValue(..., { shouldDirty: true })`.
 *
 * @see ../../docs/ACTIVITY_FORM_FIELD_UPDATES.md — project doc (package root docs/)
 */
export function setActivityFormFieldValue<
  TName extends FieldPath<ActivityFormData>,
>(
  form: UseFormReturn<ActivityFormData>,
  name: TName,
  value: FieldPathValue<ActivityFormData, TName>
): void {
  form.setValue(name, value, ACTIVITY_FIELD_SET_OPTS);
}
