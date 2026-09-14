import type {
  RoleOption,
  UserPermissionOverride,
  UserPermissionOverrideInput,
} from '@corpcal/shared/api/types';
import { cn } from '@/lib/utils';

import { UserRolePermissionsSection } from './UserRolePermissionsSection';
import { UserRoleSelect } from './UserRoleSelect';

export type UserRoleFieldProps = {
  roles: RoleOption[];
  value: string;
  onValueChange: (value: string) => void;
  roleId: number | null;
  disabled?: boolean;
  placeholder?: string;
  triggerClassName?: string;
  savedRoleId?: number | null;
  existingOverrides?: UserPermissionOverride[];
  canEdit?: boolean;
  onPermissionChange: (overrides: UserPermissionOverrideInput[]) => void;
  className?: string;
};

export function UserRoleField({
  roles,
  value,
  onValueChange,
  roleId,
  disabled = false,
  placeholder,
  triggerClassName,
  savedRoleId,
  existingOverrides,
  canEdit = true,
  onPermissionChange,
  className,
}: UserRoleFieldProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-md border px-3 pt-3 pb-3',
        className
      )}
    >
      <UserRoleSelect
        roles={roles}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        placeholder={placeholder}
        triggerClassName={triggerClassName}
      />
      <UserRolePermissionsSection
        roleId={roleId}
        savedRoleId={savedRoleId}
        existingOverrides={existingOverrides}
        canEdit={canEdit}
        onChange={onPermissionChange}
      />
    </div>
  );
}
