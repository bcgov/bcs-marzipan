import type { FieldErrors, FieldValues, FormState } from 'react-hook-form';

import {
  isZodMissingRequiredIssue,
  type ZodIssueLike,
} from '@corpcal/shared/validation';

export { isZodMissingRequiredIssue };

export type MissingRequiredFieldItem = {
  name: string;
  label: string;
};

const FOCUSABLE_FIELD_SELECTOR = [
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function toCssAttributeValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function findFieldElement(fieldName: string): Element | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const escapedFieldName = toCssAttributeValue(fieldName);
  return (
    document.querySelector(`[name="${escapedFieldName}"]`) ??
    document.querySelector(`[data-field="${escapedFieldName}"]`) ??
    document.getElementById(fieldName)
  );
}

function getFocusableFieldTarget(element: Element): HTMLElement | null {
  if (
    element instanceof HTMLElement &&
    element.matches(FOCUSABLE_FIELD_SELECTOR)
  ) {
    return element;
  }

  return element.querySelector<HTMLElement>(FOCUSABLE_FIELD_SELECTOR);
}

export function focusRequiredField(fieldName: string): boolean {
  const fieldElement = findFieldElement(fieldName);
  if (!fieldElement) {
    return false;
  }

  fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const focusTarget = getFocusableFieldTarget(fieldElement);
  focusTarget?.focus({ preventScroll: true });

  return true;
}

export function focusFirstMissingRequiredField(
  missingFields: readonly MissingRequiredFieldItem[]
): boolean {
  for (const field of missingFields) {
    if (focusRequiredField(field.name)) {
      return true;
    }
  }

  return false;
}

/**
 * Sorts missing-field items to match a canonical form layout order.
 * Fields not in `fieldOrder` keep their relative order and appear after known fields.
 */
export function sortMissingRequiredFieldItems(
  items: readonly MissingRequiredFieldItem[],
  fieldOrder: readonly string[]
): MissingRequiredFieldItem[] {
  const indexByName = new Map(fieldOrder.map((name, index) => [name, index]));
  const known: MissingRequiredFieldItem[] = [];
  const unknown: MissingRequiredFieldItem[] = [];

  for (const item of items) {
    if (indexByName.has(item.name)) {
      known.push(item);
    } else {
      unknown.push(item);
    }
  }

  known.sort((a, b) => indexByName.get(a.name)! - indexByName.get(b.name)!);

  return [...known, ...unknown];
}

function applyMissingFieldOrder(
  items: MissingRequiredFieldItem[],
  fieldOrder?: readonly string[]
): MissingRequiredFieldItem[] {
  return fieldOrder ? sortMissingRequiredFieldItems(items, fieldOrder) : items;
}

/**
 * Extracts missing required field labels from react-hook-form FormState errors.
 *
 * @param formState - The FormState object from react-hook-form containing errors
 * @param getFieldLabel - Optional function to map field names to user-friendly labels.
 *                        If not provided, field names will be returned as-is.
 * @returns Array of field labels (or field names if no mapper provided) that have validation errors
 *
 * @example
 * ```ts
 * const form = useForm<MyFormData>();
 * const missingFields = getMissingRequiredFields(
 *   form.formState,
 *   (fieldName) => fieldLabelMap[fieldName] || fieldName
 * );
 * ```
 */
export function getMissingRequiredFieldItems<TFieldValues extends FieldValues>(
  formState: FormState<TFieldValues>,
  getFieldLabel?: (fieldName: string) => string,
  fieldOrder?: readonly string[]
): MissingRequiredFieldItem[] {
  const errors = formState.errors;
  const missingFields: MissingRequiredFieldItem[] = [];
  const seenFields = new Set<string>();

  const extractErrors = (
    errorObj: FieldErrors<TFieldValues> | undefined,
    fieldPath = ''
  ) => {
    if (!errorObj || typeof errorObj !== 'object') return;

    Object.keys(errorObj).forEach((key) => {
      const currentPath = fieldPath ? `${fieldPath}.${key}` : key;
      const error = errorObj[key as keyof typeof errorObj];

      if (error && typeof error === 'object' && 'message' in error) {
        // This is a field error - use the top-level field name for display
        const topLevelField = currentPath.split('.')[0];
        if (!seenFields.has(topLevelField)) {
          seenFields.add(topLevelField);
          missingFields.push({
            name: topLevelField,
            label: getFieldLabel ? getFieldLabel(topLevelField) : topLevelField,
          });
        }
      } else if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        !Array.isArray(error)
      ) {
        // This is a nested object, recurse
        extractErrors(error as FieldErrors<TFieldValues>, currentPath);
      }
    });
  };

  extractErrors(errors);
  return applyMissingFieldOrder(missingFields, fieldOrder);
}

export function getMissingRequiredFields<TFieldValues extends FieldValues>(
  formState: FormState<TFieldValues>,
  getFieldLabel?: (fieldName: string) => string,
  fieldOrder?: readonly string[]
): string[] {
  return getMissingRequiredFieldItems(formState, getFieldLabel, fieldOrder).map(
    (field) => field.label
  );
}

/**
 * Maps Zod safeParse issues to top-level field names/labels for submit gating UI.
 * Issue classification is defined in `@corpcal/shared` — see REQUIRED_FIELDS.md
 * when adding required activity fields.
 */
export function getMissingRequiredFieldItemsFromZodError(
  error: { issues: ReadonlyArray<ZodIssueLike> },
  getFieldLabel?: (fieldName: string) => string,
  fieldOrder?: readonly string[]
): MissingRequiredFieldItem[] {
  const missingFields: MissingRequiredFieldItem[] = [];
  const seenFields = new Set<string>();

  for (const issue of error.issues) {
    if (!isZodMissingRequiredIssue(issue)) {
      continue;
    }

    const topLevelField = issue.path[0];
    if (typeof topLevelField !== 'string' || seenFields.has(topLevelField)) {
      continue;
    }
    seenFields.add(topLevelField);
    missingFields.push({
      name: topLevelField,
      label: getFieldLabel ? getFieldLabel(topLevelField) : topLevelField,
    });
  }

  return applyMissingFieldOrder(missingFields, fieldOrder);
}

/** Maps Zod safeParse issues to top-level field labels for submit gating UI. */
export function getMissingRequiredFieldsFromZodError(
  error: { issues: ReadonlyArray<ZodIssueLike> },
  getFieldLabel?: (fieldName: string) => string,
  fieldOrder?: readonly string[]
): string[] {
  return getMissingRequiredFieldItemsFromZodError(
    error,
    getFieldLabel,
    fieldOrder
  ).map((field) => field.label);
}

/** Muted sticky-bar copy when create/edit submit is blocked by required fields. */
export function formatMissingRequiredFieldsCountMessage(
  count: number
): string | null {
  if (count <= 0) return null;
  return count === 1
    ? '1 more required field'
    : `${count} more required fields`;
}
