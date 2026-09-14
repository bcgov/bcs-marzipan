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
      {roleDescription ? (
        <div className="bg-muted/50 text-muted-foreground rounded-md border px-3 py-2 text-sm">
          {roleDescription}
        </div>
      ) : null}
    </div>
  );
}
