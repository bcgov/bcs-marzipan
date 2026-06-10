import type { FieldErrors, FieldValues, FormState } from 'react-hook-form';
import type { ZodError } from 'zod';

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
export function getMissingRequiredFields<TFieldValues extends FieldValues>(
  formState: FormState<TFieldValues>,
  getFieldLabel?: (fieldName: string) => string
): string[] {
  const errors = formState.errors;
  const missingFields: string[] = [];
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
          const label = getFieldLabel
            ? getFieldLabel(topLevelField)
            : topLevelField;
          missingFields.push(label);
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
  return missingFields;
}

/** Maps Zod safeParse issues to top-level field labels for submit gating UI. */
export function getMissingRequiredFieldsFromZodError(
  error: ZodError,
  getFieldLabel?: (fieldName: string) => string
): string[] {
  const missingFields: string[] = [];
  const seenFields = new Set<string>();

  for (const issue of error.issues) {
    const topLevelField = issue.path[0];
    if (typeof topLevelField !== 'string' || seenFields.has(topLevelField)) {
      continue;
    }
    seenFields.add(topLevelField);
    missingFields.push(
      getFieldLabel ? getFieldLabel(topLevelField) : topLevelField
    );
  }

  return missingFields;
}

/** Muted sticky-bar copy when create/edit submit is blocked by required fields. */
export function formatMissingRequiredFieldsCountMessage(
  count: number
): string | null {
  if (count <= 0) return null;
  return count === 1
    ? '1 required field missing'
    : `${count} required fields missing`;
}
