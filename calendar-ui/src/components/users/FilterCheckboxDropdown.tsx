import { useCallback } from 'react';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FilterTrigger } from '@/components/users/FilterTrigger';

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <FilterTrigger
          label={label}
          active={hasSelection}
          count={selectedValues.length}
          onClear={() => onChange([])}
          clearAriaLabel={`Clear ${label} filter`}
          disabled={disabled}
          className={className}
        />
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
