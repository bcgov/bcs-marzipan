import type { FieldPath, FieldPathValue, UseFormReturn } from 'react-hook-form';

import type { ActivityFormData } from '@corpcal/shared/schemas';

/** Shared RHF options for user-driven activity form edits. */
export const ACTIVITY_FIELD_SET_OPTS = {
  shouldDirty: true,
  shouldTouch: true,
  shouldValidate: true,
} as const;

/**
 * Writes an activity form field via `form.setValue` instead of Controller
 * `field.onChange`. Custom controls (Radix Select/Checkbox, nested venue
 * inputs, date popovers) can fail to persist through `field.onChange` under
 * Vite 8 / React 19 scheduling while `setValue` remains reliable.
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
