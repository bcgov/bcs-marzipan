import { useCallback, useMemo } from 'react';
import type { UseFormReturn, FieldPath, FieldValues } from 'react-hook-form';

/**
 * Generic hook for managing multi-select form fields
 * @param form - React Hook Form instance
 * @param fieldName - Name of the form field to manage
 * @returns Tuple of [selectedValues, toggleFunction]
 */
export function useMultiSelect<
  T extends FieldValues,
  TFieldName extends FieldPath<T>,
  TValue = T[TFieldName] extends (infer U)[] | undefined
    ? U
    : T[TFieldName] extends (infer U)[]
      ? U
      : never,
>(
  form: UseFormReturn<T>,
  fieldName: TFieldName
): [TValue[], (id: TValue) => void] {
  const currentValue = form.watch(fieldName) as TValue[] | undefined;
  const selectedValues = useMemo(
    () => currentValue ?? ([] as TValue[]),
    [currentValue]
  );

  const toggle = useCallback(
    (id: TValue) => {
      const newSelection = selectedValues.includes(id)
        ? selectedValues.filter((item) => item !== id)
        : [...selectedValues, id];
      form.setValue(fieldName, newSelection as T[TFieldName], {
        shouldValidate: true,
      });
    },
    [form, fieldName, selectedValues]
  );

  return [selectedValues, toggle];
}
