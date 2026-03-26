import { cn } from '@/lib/utils';

/**
 * Strict “static field” styling for context read-only: no placeholder affordance,
 * no dropdown chevrons, no hover/focus rings that suggest interactivity.
 */
export const READ_ONLY_STATIC_TRIGGER = cn(
  'cursor-default pointer-events-none shadow-none transition-none',
  'hover:bg-background hover:border-input hover:shadow-none',
  'focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input'
);

/** Radix Select trigger: hide chevron (last svg) and empty placeholder text. */
export const READ_ONLY_STATIC_SELECT_TRIGGER = cn(
  '[&>svg:last-child]:hidden',
  '[&_[data-placeholder]]:hidden'
);

/** Native inputs/textareas: hide placeholder text when read-only. */
export const READ_ONLY_STATIC_PLACEHOLDER = cn(
  'placeholder:text-transparent placeholder:opacity-0'
);

/** Combobox chips row: static border, no focus ring affordance on hover. */
export const READ_ONLY_STATIC_COMBOBOX_CHIPS = cn(
  'cursor-default shadow-none transition-none',
  'hover:border-input hover:shadow-none',
  'focus-within:border-input focus-within:ring-0 focus-within:shadow-none'
);
