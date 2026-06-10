import {
  useFormState,
  useWatch,
  type FieldValues,
  type FormState,
  type UseFormReturn,
} from 'react-hook-form';
import type { ZodType } from 'zod';

import {
  formatMissingRequiredFieldsCountMessage,
  getMissingRequiredFields,
  getMissingRequiredFieldsFromZodError,
} from '../lib/form-utils';

type UseActivityFormSubmitStateOptions<TFieldValues extends FieldValues> = {
  getFieldLabel?: (fieldName: string) => string;
  /**
   * When provided, validity and missing-field UI derive from live safeParse of
   * watched values so the sticky bar updates as the user edits (not only after
   * RHF async validation settles).
   */
  schema?: ZodType<TFieldValues>;
};

export type ActivityFormSubmitState = {
  isFormValid: boolean;
  missingFields: string[];
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
  const watchedValues = useWatch({ control: form.control });
  const { isValid, errors } = useFormState({
    control: form.control,
  });

  if (options?.schema) {
    const values = (watchedValues ?? form.getValues()) as TFieldValues;
    const result = options.schema.safeParse(values);
    const missingFields = result.success
      ? []
      : getMissingRequiredFieldsFromZodError(
          result.error,
          options.getFieldLabel
        );

    return {
      isFormValid: result.success,
      missingFields,
      missingFieldsHelperText: formatMissingRequiredFieldsCountMessage(
        missingFields.length
      ),
      canSubmit: result.success,
    };
  }

  const missingFields = getMissingRequiredFields(
    { errors } as FormState<TFieldValues>,
    options?.getFieldLabel
  );

  return {
    isFormValid: isValid,
    missingFields,
    missingFieldsHelperText: formatMissingRequiredFieldsCountMessage(
      missingFields.length
    ),
    canSubmit: isValid,
  };
}
