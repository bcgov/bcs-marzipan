import { Info } from 'lucide-react';

import type { RoleOption } from '@corpcal/shared/api/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type UserRoleSelectProps = {
  roles: RoleOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  triggerClassName?: string;
};

export function UserRoleSelect({
  roles,
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select role',
  triggerClassName,
}: UserRoleSelectProps) {
  const selectedRole = roles.find((role) => String(role.id) === value);
  const roleDescription = selectedRole?.description?.trim();
  const roleSummary =
    selectedRole && roleDescription
      ? `${selectedRole.name} role ${roleDescription.charAt(0).toLowerCase()}${roleDescription.slice(1)}`
      : null;

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role.id} value={String(role.id)}>
              {role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {roleSummary ? (
        <div className="text-muted-foreground flex items-start gap-2 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{roleSummary}</span>
        </div>
      ) : null}
    </div>
  );
}
