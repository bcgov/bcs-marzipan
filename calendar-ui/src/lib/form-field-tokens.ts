/**
 * Shared form control metrics. Values are defined on `:root` in globals.css.
 *
 * Use with Tailwind arbitrary properties, e.g. `h-(--input-height)`, or use
 * `Button` / triggers with `size="input"` which already apply this height.
 */
export const FORM_CONTROL_HEIGHT_CSS_VAR = '--input-height' as const;

/**
 * Invalid-state Tailwind utilities for bordered controls.
 * Contract: anything wrapped by FormControl (`components/ui/form.tsx`) must accept merged props
 * (especially `aria-invalid`) on the element that draws the border and include
 * the appropriate token below on that element.
 */
/** Red border + ring when `aria-invalid` is true (Input, Textarea, Select, etc.). */
export const FORM_CONTROL_INVALID_RING_CLASS =
  'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40';

/** Combobox / InputGroup-style controls: 3px invalid ring to match focus-within. */
export const FORM_CONTROL_INVALID_RING_CLASS_COMBO =
  'aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-[3px] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40';

/** Unchecked checkbox border; defined on `:root` in globals.css. */
export const CHECKBOX_BORDER_CSS_VAR = '--checkbox-border' as const;

/** Secondary icon colour; defined on `:root` in globals.css. */
export const ICON_MUTED_FOREGROUND_CSS_VAR = '--icon-muted-foreground' as const;

/** Active/selected action icon colour; defined on `:root` in globals.css. */
export const ICON_ACTIVE_FOREGROUND_CSS_VAR =
  '--icon-active-foreground' as const;

/** Review / changed-field highlight background; defined on `:root` in globals.css. */
export const REVIEW_HIGHLIGHT_CSS_VAR = '--review-highlight' as const;
