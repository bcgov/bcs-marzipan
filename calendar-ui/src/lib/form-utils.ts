import type { FieldErrors, FieldValues, FormState } from 'react-hook-form';

import {
  getZodIssueKind,
  isZodMissingRequiredIssue,
  type ZodIssueKind,
  type ZodIssueLike,
} from '@corpcal/shared/validation';

export { isZodMissingRequiredIssue };

export type MissingRequiredFieldItem = {
  name: string;
  label: string;
};

export type FocusFieldOptions = {
  /** Limits lookup to descendants of this node (defaults to `document`). */
  root?: ParentNode | null;
};

export type FocusFirstInvalidFieldOptions = FocusFieldOptions & {
  getFieldLabel?: (fieldName: string) => string;
  fieldOrder?: readonly string[];
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

function getFieldLookupRoot(root?: ParentNode | null): ParentNode | null {
  if (root != null) {
    return root;
  }

  return typeof document !== 'undefined' ? document : null;
}

function findFieldElement(
  fieldName: string,
  root?: ParentNode | null
): Element | null {
  const scope = getFieldLookupRoot(root);
  if (!scope) {
    return null;
  }

  const escapedFieldName = toCssAttributeValue(fieldName);
  const selectors = [
    `[name="${escapedFieldName}"]`,
    `[data-field="${escapedFieldName}"]`,
    `[id="${escapedFieldName}"]`,
  ] as const;

  for (const selector of selectors) {
    const match = scope.querySelector(selector);
    if (match) {
      return match;
    }
  }

  return null;
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

export function focusRequiredField(
  fieldName: string,
  options?: FocusFieldOptions
): boolean {
  const fieldElement = findFieldElement(fieldName, options?.root);
  if (!fieldElement) {
    return false;
  }

  fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const focusTarget = getFocusableFieldTarget(fieldElement);
  focusTarget?.focus({ preventScroll: true });

  return true;
}

export function focusFirstMissingRequiredField(
  missingFields: readonly MissingRequiredFieldItem[],
  options?: FocusFieldOptions
): boolean {
  for (const field of missingFields) {
    if (focusRequiredField(field.name, options)) {
      return true;
    }
  }

  return false;
}

function extractTopLevelInvalidFieldItems<TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues> | undefined,
  getFieldLabel?: (fieldName: string) => string
): MissingRequiredFieldItem[] {
  const invalidFields: MissingRequiredFieldItem[] = [];
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
        const topLevelField = currentPath.split('.')[0];
        if (!seenFields.has(topLevelField)) {
          seenFields.add(topLevelField);
          invalidFields.push({
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
        extractErrors(error as FieldErrors<TFieldValues>, currentPath);
      }
    });
  };

  extractErrors(errors);
  return invalidFields;
}

/** Maps react-hook-form field errors to top-level invalid fields for focus order. */
export function getInvalidFieldItemsFromFieldErrors<
  TFieldValues extends FieldValues,
>(
  errors: FieldErrors<TFieldValues>,
  getFieldLabel?: (fieldName: string) => string,
  fieldOrder?: readonly string[]
): MissingRequiredFieldItem[] {
  return applyMissingFieldOrder(
    extractTopLevelInvalidFieldItems(errors, getFieldLabel),
    fieldOrder
  );
}

/** Maps all Zod safeParse issues to top-level invalid fields for submit focus. */
export function getInvalidFieldItemsFromZodError(
  error: { issues: ReadonlyArray<ZodIssueLike> },
  getFieldLabel?: (fieldName: string) => string,
  fieldOrder?: readonly string[]
): MissingRequiredFieldItem[] {
  const invalidFields: MissingRequiredFieldItem[] = [];
  const seenFields = new Set<string>();

  for (const issue of error.issues) {
    const topLevelField = issue.path[0];
    if (typeof topLevelField !== 'string' || seenFields.has(topLevelField)) {
      continue;
    }
    seenFields.add(topLevelField);
    invalidFields.push({
      name: topLevelField,
      label: getFieldLabel ? getFieldLabel(topLevelField) : topLevelField,
    });
  }

  return applyMissingFieldOrder(invalidFields, fieldOrder);
}

/** Scrolls to and focuses the first invalid field from a failed form submit. */
export function focusFirstInvalidField<TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues>,
  options?: FocusFirstInvalidFieldOptions
): boolean {
  const invalidFields = getInvalidFieldItemsFromFieldErrors(
    errors,
    options?.getFieldLabel,
    options?.fieldOrder
  );

  return focusFirstMissingRequiredField(invalidFields, {
    root: options?.root,
  });
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
  return getInvalidFieldItemsFromFieldErrors(
    formState.errors,
    getFieldLabel,
    fieldOrder
  );
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

function formatZodIssuePath(path: ReadonlyArray<PropertyKey>): string {
  return path
    .filter(
      (segment): segment is string | number =>
        typeof segment === 'string' || typeof segment === 'number'
    )
    .join('.');
}

/** Flat RHF `FieldErrors` for console logging (paths + messages, no form values). */
export function summarizeFieldErrorsForLog<TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues>
): Array<{ path: string; message: string; type?: string }> {
  const out: Array<{ path: string; message: string; type?: string }> = [];

  const walk = (node: unknown, path: string) => {
    if (!node || typeof node !== 'object') {
      return;
    }

    if (
      'message' in node &&
      typeof (node as { message?: unknown }).message === 'string'
    ) {
      const field = node as { message: string; type?: string };
      out.push({ path, message: field.message, type: field.type });
      return;
    }

    for (const key of Object.keys(node)) {
      walk(
        (node as Record<string, unknown>)[key],
        path ? `${path}.${key}` : key
      );
    }
  };

  walk(errors, '');
  return out;
}

/** Zod `safeParse` issues for console logging (paths, codes, required vs constraint). */
export function summarizeZodIssuesForLog(error: {
  issues: ReadonlyArray<ZodIssueLike>;
}): Array<{
  path: string;
  message: string;
  code?: string;
  issueKind?: ZodIssueKind;
}> {
  return error.issues.map((issue) => ({
    path: formatZodIssuePath(issue.path),
    message:
      typeof issue.message === 'string'
        ? issue.message
        : issue.message == null
          ? ''
          : JSON.stringify(issue.message),
    code: issue.code,
    issueKind: getZodIssueKind(issue),
  }));
}

export type ActivityFormValidationFailureLog = {
  rhfFieldErrors: Array<{ path: string; message: string; type?: string }>;
  resolverIssues: Array<{
    path: string;
    message: string;
    code?: string;
    issueKind?: ZodIssueKind;
  }>;
  /** Present when comparing resolver vs sticky-bar `safeParse` schemas. */
  stickyBarIssues?: Array<{
    path: string;
    message: string;
    code?: string;
    issueKind?: ZodIssueKind;
  }>;
};

type ActivityFormZodParseSchema = {
  safeParse: (
    data: unknown
  ) =>
    | { success: true }
    | { success: false; error: { issues: ReadonlyArray<ZodIssueLike> } };
};

/**
 * Structured validation context for activity create/edit submit failures.
 * Pass the result to `logger.error` alongside the message (no PII / field values).
 */
export function buildActivityFormValidationFailureLog(
  errors: FieldErrors<FieldValues>,
  values: unknown,
  resolverSchema: ActivityFormZodParseSchema,
  stickyBarSchema?: ActivityFormZodParseSchema
): ActivityFormValidationFailureLog {
  const resolverParse = resolverSchema.safeParse(values);
  const resolverIssues = resolverParse.success
    ? []
    : summarizeZodIssuesForLog(resolverParse.error);

  let stickyBarIssues: ActivityFormValidationFailureLog['stickyBarIssues'];
  if (stickyBarSchema) {
    const stickyParse = stickyBarSchema.safeParse(values);
    stickyBarIssues = stickyParse.success
      ? []
      : summarizeZodIssuesForLog(stickyParse.error);
  }

  return {
    rhfFieldErrors: summarizeFieldErrorsForLog(errors),
    resolverIssues,
    stickyBarIssues,
  };
}
