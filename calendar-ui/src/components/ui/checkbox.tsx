import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    /**
     * View-only: non-interactive like disabled but keeps full opacity (use for
     * context read-only forms). Prefer over `disabled` when the surface should
     * not look muted.
     */
    readOnly?: boolean;
  }
>(({ className, readOnly, disabled, checked, tabIndex, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    data-readonly={readOnly ? '' : undefined}
    className={cn(
      'group peer border-checkbox-border ring-offset-background focus-visible:ring-ring h-4 w-4 shrink-0 rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:border-[#0F6CBD] data-[state=checked]:bg-[#0F6CBD]',
      'data-[state=indeterminate]:border-[#0F6CBD] data-[state=indeterminate]:bg-[#0F6CBD]',
      readOnly && 'pointer-events-none opacity-100!',
      className
    )}
    checked={checked}
    disabled={readOnly ? false : disabled}
    tabIndex={readOnly ? -1 : tabIndex}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn('flex items-center justify-center text-white')}
    >
      <Check className="h-4 w-4 group-data-[state=indeterminate]:hidden" />
      <Minus
        className="hidden h-3 w-3 group-data-[state=indeterminate]:block"
        strokeWidth={3}
        aria-hidden
      />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
