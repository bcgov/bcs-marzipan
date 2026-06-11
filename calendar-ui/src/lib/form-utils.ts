import type { FieldErrors, FieldValues, FormState } from 'react-hook-form';

export type MissingRequiredFieldItem = {
  name: string;
  label: string;
};

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
  getFieldLabel?: (fieldName: string) => string
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
  return missingFields;
}

export function getMissingRequiredFields<TFieldValues extends FieldValues>(
  formState: FormState<TFieldValues>,
  getFieldLabel?: (fieldName: string) => string
): string[] {
  return getMissingRequiredFieldItems(formState, getFieldLabel).map(
    (field) => field.label
  );
}

type ZodIssueLike = {
  path: ReadonlyArray<PropertyKey>;
  code?: string;
  message?: unknown;
};

/**
 * True when a Zod issue represents an empty/missing required value, not length,
 * format, or structural refine rules (e.g. event-planner lead selection).
 */
export function isZodMissingRequiredIssue(issue: ZodIssueLike): boolean {
  const code = issue.code;

  if (code === 'too_big' || code === 'too_long') {
    return false;
  }

  if (code === 'too_small' || code === 'invalid_type') {
    return true;
  }

  if (code === 'custom') {
    const message = typeof issue.message === 'string' ? issue.message : '';
    if (
      message.includes('Maximum character limit exceeded') ||
      message.startsWith('When event planners are provided') ||
      message.includes('markAsReviewed and markAsCompleted')
    ) {
      return false;
    }
    if (/ is required$/i.test(message) || /^At least one /i.test(message)) {
      return true;
    }
  }

  return false;
}

/** Maps Zod safeParse issues to top-level field names/labels for submit gating UI. */
export function getMissingRequiredFieldItemsFromZodError(
  error: { issues: ReadonlyArray<ZodIssueLike> },
  getFieldLabel?: (fieldName: string) => string
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

  return missingFields;
}

/** Maps Zod safeParse issues to top-level field labels for submit gating UI. */
export function getMissingRequiredFieldsFromZodError(
  error: { issues: ReadonlyArray<ZodIssueLike> },
  getFieldLabel?: (fieldName: string) => string
): string[] {
  return getMissingRequiredFieldItemsFromZodError(error, getFieldLabel).map(
    (field) => field.label
  );
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
