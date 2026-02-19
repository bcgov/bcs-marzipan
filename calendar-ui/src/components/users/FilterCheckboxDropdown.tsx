import { ChevronDown, X } from 'lucide-react';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface FilterCheckboxOption {
  value: string;
  label: string;
}

interface FilterCheckboxDropdownProps {
  label: string;
  options: FilterCheckboxOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Multi-select filter dropdown with checkboxes.
 * States: unselected (gray button + chevron), open (dropdown with checkboxes), active (primary button + count + clear X).
 */
export function FilterCheckboxDropdown({
  label,
  options,
  selectedValues,
  onChange,
  disabled = false,
  className,
}: FilterCheckboxDropdownProps) {
  const hasSelection = selectedValues.length > 0;

  const handleToggle = useCallback(
    (value: string) => {
      if (selectedValues.includes(value)) {
        onChange(selectedValues.filter((v) => v !== value));
      } else {
        onChange([...selectedValues, value]);
      }
    },
    [onChange, selectedValues]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange([]);
    },
    [onChange]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={hasSelection ? 'default' : 'outline'}
          size="sm"
          disabled={disabled}
          className={cn(
            'min-w-[100px] justify-between gap-1 font-normal',
            className
          )}
        >
          <span className="truncate">
            {hasSelection ? `${label} (${selectedValues.length})` : label}
          </span>
          {hasSelection ? (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange([]);
                }
              }}
              className="ml-1 inline-flex cursor-pointer rounded p-0.5 hover:bg-white/20"
              aria-label={`Clear ${label} filter`}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-64 overflow-auto" align="start">
        {options.length === 0 ? (
          <p className="text-muted-foreground py-2 text-center text-sm">
            No options
          </p>
        ) : (
          options.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={selectedValues.includes(opt.value)}
              onCheckedChange={() => handleToggle(opt.value)}
              onSelect={(e) => e.preventDefault()}
            >
              <span className="truncate">{opt.label}</span>
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
