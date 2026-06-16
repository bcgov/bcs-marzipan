import {
  useFormState,
  useWatch,
  type FieldValues,
  type FormState,
  type UseFormReturn,
} from 'react-hook-form';

import {
  formatMissingRequiredFieldsCountMessage,
  getMissingRequiredFieldItems,
  getMissingRequiredFieldItemsFromZodError,
  type MissingRequiredFieldItem,
} from '../lib/form-utils';

type ActivityFormValidationSchema<TFieldValues extends FieldValues> = {
  safeParse: (data: unknown) =>
    | { success: true; data: TFieldValues }
    | {
        success: false;
        error: Parameters<typeof getMissingRequiredFieldItemsFromZodError>[0];
      };
};

type UseActivityFormSubmitStateOptions<TFieldValues extends FieldValues> = {
  getFieldLabel?: (fieldName: string) => string;
  /**
   * When provided, validity and missing-field UI derive from live safeParse of
   * watched values so the sticky bar updates as the user edits (not only after
   * RHF async validation settles).
   */
  schema?: ActivityFormValidationSchema<TFieldValues>;
};

export type ActivityFormSubmitState = {
  isFormValid: boolean;
  missingFields: string[];
  missingFieldItems: MissingRequiredFieldItem[];
  missingFieldsHelperText: string | null;
  canSubmit: boolean;
};

/**
 * Subscribes to activity form values / validation for create/edit submit gating.
 */
export function useActivityFormSubmitState<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  options?: UseActivityFormSubmitStateOptions<TFieldValues>
): ActivityFormSubmitState {
  // useWatch subscribes to edits; getValues() reads the latest store on each render.
  // Do not memoize getValues() on watchedValues — RHF may reuse the watch object reference.
  useWatch({ control: form.control });
  const values = form.getValues();
  const { isValid, errors } = useFormState({
    control: form.control,
    disabled: Boolean(options?.schema),
  });

  if (options?.schema) {
    const result = options.schema.safeParse(values);
    const missingFieldItems = result.success
      ? []
      : getMissingRequiredFieldItemsFromZodError(
          result.error,
          options.getFieldLabel
        );

    return {
      isFormValid: result.success,
      missingFields: missingFieldItems.map((field) => field.label),
      missingFieldItems,
      missingFieldsHelperText: formatMissingRequiredFieldsCountMessage(
        missingFieldItems.length
      ),
      canSubmit: result.success,
    };
  }

  const missingFieldItems = getMissingRequiredFieldItems(
    { errors } as FormState<TFieldValues>,
    options?.getFieldLabel
  );

  return {
    isFormValid: isValid,
    missingFields: missingFieldItems.map((field) => field.label),
    missingFieldItems,
    missingFieldsHelperText: formatMissingRequiredFieldsCountMessage(
      missingFieldItems.length
    ),
    canSubmit: isValid,
  };
}
