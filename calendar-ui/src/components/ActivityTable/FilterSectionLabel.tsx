import type { ComponentPropsWithoutRef, MouseEvent } from 'react';

import { DropdownMenuSectionTitle } from '@/components/ui/dropdown-menu';

/**
 * Shared section heading for filter dropdowns (e.g. Pitch, Look Ahead).
 * Use for "Pitch status", "Look Ahead section", etc. to keep styling consistent.
 * Optionally show a "Clear all" button that calls onClearAll when provided.
 */
export interface FilterSectionLabelProps extends ComponentPropsWithoutRef<
  typeof DropdownMenuSectionTitle
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
    <DropdownMenuSectionTitle className={className} {...props}>
      {onClearAll ? (
        <div className="flex w-full items-center justify-between gap-6">
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
    </DropdownMenuSectionTitle>
  );
}
