import { ChevronDown } from 'lucide-react';

import { FILTER_PANEL_MIN_WIDTH } from '@/components/table/tableConstants';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface LookupReorderMenuProps {
  dragEnabled: boolean;
  disabled?: boolean;
  onDragEnabledChange: (dragEnabled: boolean) => void;
}

const REORDER_OPTIONS = [
  { value: 'drag' as const, label: 'Drag to reorder' },
  { value: 'step' as const, label: 'Step to reorder' },
];

/** Dropdown for lookup custom-order interaction (step vs drag). */
export function LookupReorderMenu({
  dragEnabled,
  disabled = false,
  onDragEnabledChange,
}: LookupReorderMenuProps) {
  const mode = dragEnabled ? 'drag' : 'step';
  const selectedLabel =
    REORDER_OPTIONS.find((opt) => opt.value === mode)?.label ?? '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm" variant="ghost" disabled={disabled}>
          {selectedLabel}
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(FILTER_PANEL_MIN_WIDTH, 'w-48')}
      >
        {REORDER_OPTIONS.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={mode === opt.value}
            disabled={disabled}
            onCheckedChange={(checked) => {
              if (checked === true) {
                onDragEnabledChange(opt.value === 'drag');
              }
            }}
            onSelect={(e) => e.preventDefault()}
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
