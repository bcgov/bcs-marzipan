import type { ComponentPropsWithoutRef, MouseEvent } from 'react';

import {
  DropdownMenuItem,
  DropdownMenuSectionTitle,
} from '@/components/ui/dropdown-menu';

/**
 * Shared section heading for filter dropdowns (e.g. Pitch, Look Ahead).
 * For use only inside DropdownMenuContent or DropdownMenuSubContent.
 *
 * When `onClearAll` is provided, a "Clear all" button is rendered as a
 * DropdownMenuItem so it participates in arrow-key navigation and has
 * a visible focus state.
 */
export interface FilterSectionLabelProps extends ComponentPropsWithoutRef<
  typeof DropdownMenuSectionTitle
> {
  /** When provided, shows a "Clear all" button that calls this when clicked. */
  onClearAll?: () => void;
}

export function FilterSectionLabel({
  className,
  onClearAll,
  children,
  ...props
}: FilterSectionLabelProps) {
  if (!onClearAll) {
    return (
      <DropdownMenuSectionTitle className={className} {...props}>
        {children}
      </DropdownMenuSectionTitle>
    );
  }

  const handleClearSelect = (e: Event) => {
    e.preventDefault();
    onClearAll();
  };

  const handleClearClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClearAll();
  };

  return (
    <div className="flex w-full items-center justify-between gap-6 px-2 py-1.5">
      <span className="text-muted-foreground text-xs font-normal uppercase">
        {children}
      </span>
      <DropdownMenuItem
        asChild
        className="h-auto shrink-0 cursor-pointer gap-0 rounded-none p-0 text-xs font-normal focus:bg-transparent focus:text-inherit"
        onSelect={handleClearSelect}
      >
        <button
          type="button"
          onClick={handleClearClick}
          className="text-primary focus-visible:ring-ring text-xs font-normal hover:underline focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Clear all filters in this section"
        >
          Clear all
        </button>
      </DropdownMenuItem>
    </div>
  );
}
