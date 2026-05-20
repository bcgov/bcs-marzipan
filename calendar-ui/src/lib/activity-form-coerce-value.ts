import { LOOK_AHEAD_STATUS } from '@corpcal/shared/constants/constants';
import type { ActivityFormData } from '@corpcal/shared/schemas';

/**
 * Radix Select emits `''` when cleared. Map to `undefined` for optional lookup ID fields.
 * Positive integers only — `'0'` and non-numeric strings become `undefined` (DB IDs are ≥ 1).
 */
export function optionalSelectIdValue(value: string): number | undefined {
  if (value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * Radix RadioGroup emits string values. Map empty to `undefined`; ignore unknown literals.
 */
export function optionalRadioEnumValue<T extends string>(
  value: string,
  allowed: readonly T[]
): T | undefined {
  if (value === '') return undefined;
  return (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

/** Look-ahead status radios — typed against {@link ActivityFormData}. */
export function lookAheadStatusFormValue(
  value: string
): ActivityFormData['lookAheadStatus'] {
  return optionalRadioEnumValue(value, LOOK_AHEAD_STATUS);
}

/**
 * Look-ahead section radios use dynamic lookup keys; store non-empty strings as-is.
 */
export function lookAheadSectionFormValue(
  value: string
): ActivityFormData['lookAheadSection'] {
  return value === '' ? undefined : value;
}

/** Display value for optional numeric Select fields (`undefined` → `''`). */
export function optionalIdSelectDisplayValue(
  value: number | null | undefined
): string {
  return value != null ? String(value) : '';
}

/** Display value for optional string RadioGroup fields (`undefined`/`null` → `''`). */
export function optionalRadioDisplayValue(
  value: string | null | undefined
): string {
  return value ?? '';
}
