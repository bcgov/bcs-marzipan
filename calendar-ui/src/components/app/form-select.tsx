/**
 * Activity / form helpers for Radix Select: view-only (`readOnly`) without muted
 * disabled styling. Compose with SelectValue, SelectContent, SelectItem from
 * `@/components/ui/select`.
 *
 * Use `disabled` only for field-level rules that should look muted. When both apply,
 * `disabled` wins (muted). When only `readOnly` is true, the trigger keeps
 * full-contrast styling and the menu stays closed.
 */
import type { ComponentProps } from 'react';

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

export function FormSelect({
  readOnly,
  disabled,
  open,
  ...props
}: FormSelectProps) {
  const isMuted = Boolean(disabled);
  const viewOnly = Boolean(readOnly) && !isMuted;

  if (viewOnly) {
    return (
      <Select
        {...props}
        disabled={false}
        open={false}
        onOpenChange={() => {}}
      />
    );
  }

  return (
    <Select
      {...props}
      disabled={isMuted}
      open={open}
      onOpenChange={(nextOpen) => props.onOpenChange?.(nextOpen)}
    />
  );
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
