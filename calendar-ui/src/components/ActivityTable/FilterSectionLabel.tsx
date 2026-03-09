import type { ComponentPropsWithoutRef, MouseEvent } from 'react';

import { DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * Shared section heading for filter dropdowns (e.g. Pitch, Look Ahead).
 * Use for "Pitch status", "Look Ahead section", etc. to keep styling consistent.
 * Optionally show a "Clear all" button that calls onClearAll when provided.
 */
const FILTER_SECTION_LABEL_CLASS = 'text-foreground text-xs font-normal';

export interface FilterSectionLabelProps extends ComponentPropsWithoutRef<
  typeof DropdownMenuLabel
> {
  /** When provided, shows a "Clear all" button that calls this when clicked (clears filters in this section). */
  onClearAll?: () => void;
}

export function FilterSectionLabel({
  className,
  onClearAll,
  children,
  ...props
}: FilterSectionLabelProps) {
  const handleClearClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClearAll?.();
  };

  return (
    <DropdownMenuLabel
      className={cn(FILTER_SECTION_LABEL_CLASS, className)}
      {...props}
    >
      {onClearAll ? (
        <div className="flex w-full items-center justify-between gap-2">
          <span>{children}</span>
          <button
            type="button"
            onClick={handleClearClick}
            className="text-primary shrink-0 text-xs font-normal hover:underline"
            aria-label="Clear all filters in this section"
          >
            Clear all
          </button>
        </div>
      ) : (
        children
      )}
    </DropdownMenuLabel>
  );
}
