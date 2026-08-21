import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface TeamsComboboxSelectAllRowProps {
  allSelected: boolean;
  disabled?: boolean;
  onToggleSelectAll: () => void;
}

export function TeamsComboboxSelectAllRow({
  allSelected,
  disabled,
  onToggleSelectAll,
}: TeamsComboboxSelectAllRowProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none',
        disabled
          ? 'pointer-events-none opacity-50'
          : 'hover:bg-accent hover:text-accent-foreground'
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) onToggleSelectAll();
      }}
    >
      <span className="flex-1 text-left font-medium">Select all teams</span>
      {allSelected ? (
        <CheckIcon
          className="pointer-events-none absolute right-2 size-4 shrink-0"
          aria-hidden
        />
      ) : null}
    </button>
  );
}
