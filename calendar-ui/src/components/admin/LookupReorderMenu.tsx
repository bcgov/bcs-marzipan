import { ChevronDown, GripVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface LookupReorderMenuProps {
  dragEnabled: boolean;
  disabled?: boolean;
  onDragEnabledChange: (dragEnabled: boolean) => void;
}

/** Dropdown for lookup custom-order interaction (step vs drag). */
export function LookupReorderMenu({
  dragEnabled,
  disabled = false,
  onDragEnabledChange,
}: LookupReorderMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm" variant="ghost" disabled={disabled}>
          <GripVertical /> Reorder <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuCheckboxItem
          checked={dragEnabled}
          disabled={disabled}
          onCheckedChange={(checked) => onDragEnabledChange(checked === true)}
          onSelect={(e) => e.preventDefault()}
        >
          Drag to reorder
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
