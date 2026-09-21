/**
 * Shared form control metrics. Values are defined on `:root` in globals.css.
 *
 * Use with Tailwind arbitrary properties, e.g. `h-(--input-height)`, or use
 * `Button` / triggers with `size="input"` which already apply this height.
 */
export const FORM_CONTROL_HEIGHT_CSS_VAR = '--input-height' as const;

/** Unchecked checkbox border; defined on `:root` in globals.css. */
export const CHECKBOX_BORDER_CSS_VAR = '--checkbox-border' as const;

/** Secondary icon colour; defined on `:root` in globals.css. */
export const ICON_MUTED_FOREGROUND_CSS_VAR = '--icon-muted-foreground' as const;

/** Review / changed-field highlight background; defined on `:root` in globals.css. */
export const REVIEW_HIGHLIGHT_CSS_VAR = '--review-highlight' as const;
