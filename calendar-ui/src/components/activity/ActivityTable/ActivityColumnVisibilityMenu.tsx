import { ChevronDown, Columns3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ActivityColumnVisibilityOption {
  id: string;
  label: string;
  visible: boolean;
  disabled?: boolean;
}

export interface ActivityColumnVisibilityMenuProps {
  options: ActivityColumnVisibilityOption[];
  onToggle: (columnId: string, visible: boolean) => void;
}

/** Dropdown with a checkbox per hideable column in the activity grid. */
export function ActivityColumnVisibilityMenu({
  options,
  onToggle,
}: ActivityColumnVisibilityMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm" variant="ghost">
          <Columns3 /> Columns <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.id}
            checked={option.visible}
            disabled={option.disabled}
            onCheckedChange={(checked) => onToggle(option.id, checked === true)}
            onSelect={(e) => e.preventDefault()}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
