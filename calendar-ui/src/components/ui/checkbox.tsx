import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
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
>(({ className, readOnly, disabled, checked, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    data-readonly={readOnly ? '' : undefined}
    className={cn(
      'peer border-input ring-offset-background focus-visible:ring-ring h-4 w-4 shrink-0 rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[#0F6CBD]',
      readOnly && 'opacity-100!',
      className
    )}
    style={{
      backgroundColor: checked ? '#0F6CBD' : undefined,
    }}
    checked={checked}
    disabled={readOnly || disabled}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn('flex items-center justify-center text-white')}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
