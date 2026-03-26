import type { HTMLAttributes, MouseEvent } from 'react';

import { cn } from '@/lib/utils';

export interface FilterSectionLabelProps extends HTMLAttributes<HTMLDivElement> {
  /** When provided, shows a "Clear all" button that calls this when clicked. */
  onClearAll?: () => void;
}

/**
 * Shared section heading for filter panels (e.g. Pitch, Look Ahead, Translations).
 * Uses plain markup so it works inside Popover, DropdownMenuContent, or DropdownMenuSubContent.
 */
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

  if (!onClearAll) {
    return (
      <div
        className={cn(
          'text-muted-foreground px-2 py-1.5 text-xs font-normal uppercase',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex w-full items-center justify-between gap-6 px-2 py-1.5',
        className
      )}
      {...props}
    >
      <span className="text-muted-foreground text-xs font-normal uppercase">
        {children}
      </span>
      <button
        type="button"
        onClick={handleClearClick}
        className="text-primary focus-visible:ring-ring shrink-0 text-xs font-normal hover:underline focus-visible:ring-2 focus-visible:outline-none"
        aria-label="Clear all filters in this section"
      >
        Clear all
      </button>
    </div>
  );
}
