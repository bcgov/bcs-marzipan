import { ChevronDown, X } from 'lucide-react';
import {
  useCallback,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type Ref,
} from 'react';

import { cn } from '@/lib/utils';

/**
 * Shared styles for the filter trigger button. Single source of truth for all filter triggers.
 */
const filterTriggerStyles = {
  base: 'flex h-10 min-w-[100px] items-center justify-between gap-1 rounded-md border px-3 py-2 text-sm font-normal whitespace-nowrap transition-colors',
  inactive:
    'border-input bg-background hover:bg-accent hover:text-accent-foreground',
  active: 'border-primary bg-primary text-primary-foreground hover:opacity-90',
  clearIcon: 'ml-1 inline-flex cursor-pointer rounded p-0.5 hover:opacity-80',
  chevron: 'h-4 w-4 shrink-0 opacity-50',
} as const;

export interface FilterTriggerProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'onClear'
> {
  /** Filter label (e.g. "Date", "Category", "Team"). */
  label: string;
  /** Whether the filter has a selection (shows count + clear icon). */
  active: boolean;
  /** Count shown when active, e.g. "Label (count)". Omit or 0 to show "Label (1)" for single-criteria filters like Date. */
  count?: number;
  /** Called when the clear (X) icon is clicked or activated by keyboard. */
  onClear: () => void;
  /** Accessible label for the clear button. */
  clearAriaLabel: string;
  /** React 19: ref forwarded to the root button for Radix asChild. */
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Unified filter trigger button for use with Popover or DropdownMenu.
 * Renders a single button with label, optional count when active, and a clear icon that clears the filter without opening the dropdown (uses onPointerDown to prevent Radix from opening on clear).
 * React 19: ref is passed as a normal prop for use with Radix asChild.
 */
export function FilterTrigger({
  label,
  active,
  count = 1,
  onClear,
  clearAriaLabel,
  disabled,
  className,
  ref,
  ...rest
}: FilterTriggerProps) {
  const handleClearClick = useCallback(
    (e: MouseEvent<HTMLSpanElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onClear();
    },
    [onClear]
  );

  const handleClearPointerDown = useCallback(
    (e: PointerEvent<HTMLSpanElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  const handleClearKeyDown = useCallback(
    (e: KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        onClear();
      }
    },
    [onClear]
  );

  const displayCount = active ? count : 0;
  const labelText = displayCount > 0 ? `${label} (${displayCount})` : label;

  return (
    <button
      type="button"
      ref={ref}
      disabled={disabled}
      className={cn(
        filterTriggerStyles.base,
        active ? filterTriggerStyles.active : filterTriggerStyles.inactive,
        className
      )}
      {...rest}
    >
      <span className="truncate">{labelText}</span>
      {active ? (
        <span
          role="button"
          tabIndex={0}
          onPointerDown={handleClearPointerDown}
          onClick={handleClearClick}
          onKeyDown={handleClearKeyDown}
          className={filterTriggerStyles.clearIcon}
          aria-label={clearAriaLabel}
        >
          <X className="h-3.5 w-3.5" />
        </span>
      ) : (
        <ChevronDown className={filterTriggerStyles.chevron} />
      )}
    </button>
  );
}
