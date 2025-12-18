import type { FormState, FieldValues, FieldErrors } from 'react-hook-form';

type VenueAddress = {
  street?: string;
  city?: string;
  provinceOrState?: string;
  country?: string;
};

/**
 * Normalizes venueAddress from form data to ensure it's a proper object or null.
 * Returns null if the address is invalid or has no meaningful fields.
 */
export function normalizeVenueAddress(venueAddress: unknown): {
  street: string;
  city: string;
  provinceOrState: string;
  country: string;
} | null {
  if (!venueAddress) {
    return null;
  }

  if (
    typeof venueAddress !== 'object' ||
    Array.isArray(venueAddress) ||
    venueAddress === null
  ) {
    return null;
  }

  const venue = venueAddress as VenueAddress;

  // Check if at least one field has a value
  const hasValidFields =
    venue.street || venue.city || venue.provinceOrState || venue.country;

  if (!hasValidFields) {
    return null;
  }

  // Normalize to ensure all fields are strings
  return {
    street: venue.street || '',
    city: venue.city || '',
    provinceOrState: venue.provinceOrState || '',
    country: venue.country || '',
  };
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
