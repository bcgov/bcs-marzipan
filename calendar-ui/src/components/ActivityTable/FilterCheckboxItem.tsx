import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface FilterCheckboxItemProps extends Omit<
  ComponentPropsWithoutRef<'label'>,
  'onChange'
> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Plain checkbox + label for use in filter panels (Popover or DropdownMenuSubContent).
 * Visually equivalent to DropdownMenuCheckboxItem but needs no Menu context.
 */
export const FilterCheckboxItem = forwardRef<
  HTMLLabelElement,
  FilterCheckboxItemProps
>(
  (
    { checked, onCheckedChange, disabled, className, children, ...props },
    ref
  ) => (
    <label
      ref={ref}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-2 pl-2 text-sm outline-none select-none',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-within:bg-accent focus-within:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      {...props}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(c) => onCheckedChange(c === true)}
        disabled={disabled}
      />
      <span className="truncate">{children}</span>
    </label>
  )
);
FilterCheckboxItem.displayName = 'FilterCheckboxItem';
