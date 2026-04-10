/**
 * Activity / form helpers for Radix Select: view-only (`readOnly`) without muted
 * disabled styling. Compose with SelectValue, SelectContent, SelectItem from
 * `@/components/ui/select`.
 *
 * Use `disabled` only for field-level rules that should look muted. When both apply,
 * `disabled` wins (muted). When only `readOnly` is true, the trigger keeps
 * full-contrast styling and the menu stays closed.
 *
 * For fields whose options are loaded asynchronously, use {@link FormSelectSafe}
 * instead. It suppresses phantom `onValueChange('')` emissions that Radix fires
 * when the current value has no matching `SelectItem` during option reconciliation.
 */
import { useCallback, useMemo, useRef, type ComponentProps } from 'react';

import { Select, SelectTrigger } from '@/components/ui/select';
import {
  READ_ONLY_STATIC_SELECT_TRIGGER,
  READ_ONLY_STATIC_TRIGGER,
} from '@/lib/read-only-static-field';
import { cn } from '@/lib/utils';

export type FormSelectProps = ComponentProps<typeof Select> & {
  /** Context-driven view-only: non-muted surface, menu does not open. */
  readOnly?: boolean;
};

export function FormSelect({ readOnly, disabled, ...props }: FormSelectProps) {
  const isMuted = Boolean(disabled);
  const viewOnly = Boolean(readOnly) && !isMuted;

  if (viewOnly) {
    return <Select {...props} disabled={false} />;
  }

  return <Select {...props} disabled={isMuted} />;
}

export type FormSelectTriggerProps = ComponentProps<typeof SelectTrigger> & {
  readOnly?: boolean;
};

export function FormSelectTrigger({
  readOnly,
  className,
  ...props
}: FormSelectTriggerProps) {
  return (
    <SelectTrigger
      aria-readonly={readOnly || undefined}
      data-readonly={readOnly ? '' : undefined}
      tabIndex={readOnly ? -1 : undefined}
      className={cn(
        readOnly && READ_ONLY_STATIC_TRIGGER,
        readOnly && READ_ONLY_STATIC_SELECT_TRIGGER,
        className
      )}
      {...props}
    />
  );
}

export type FormSelectSafeProps = FormSelectProps & {
  /**
   * Known option values. When the set is non-empty, `onValueChange` calls
   * with values not in this set (e.g. Radix phantom `''` during async option
   * reconciliation) are suppressed.
   */
  optionValues?: string[];
};

/**
 * Drop-in replacement for {@link FormSelect} that guards against phantom
 * `onValueChange('')` emissions from Radix Select during async option loading.
 */
export function FormSelectSafe({
  optionValues,
  readOnly,
  ...props
}: FormSelectSafeProps) {
  const onValueChangeRef = useRef<((value: string) => void) | undefined>(
    undefined
  );
  onValueChangeRef.current =
    props.onValueChange === undefined
      ? undefined
      : (value: string) => {
          props.onValueChange?.(value);
        };

  const allowedValues = useMemo(
    () => (optionValues?.length ? new Set(optionValues) : null),
    [optionValues]
  );

  const safeOnValueChange = useCallback(
    (value: string) => {
      if (readOnly) return;
      if (allowedValues && !allowedValues.has(value)) return;
      onValueChangeRef.current?.(value);
    },
    [readOnly, allowedValues]
  );

  return (
    <FormSelect
      {...props}
      readOnly={readOnly}
      onValueChange={safeOnValueChange}
    />
  );
}
