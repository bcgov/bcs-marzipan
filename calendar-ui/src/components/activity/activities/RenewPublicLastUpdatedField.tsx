import { PERMISSIONS } from '@corpcal/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type RenewPublicLastUpdatedFieldProps = {
  permissions: string[];
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
};

/** Shown when the user may defer public last-updated on save (opt-in renew). */
export function RenewPublicLastUpdatedField({
  permissions,
  checked,
  onCheckedChange,
  id = 'renew-public-last-updated',
}: RenewPublicLastUpdatedFieldProps) {
  const canDefer = permissions.includes(
    PERMISSIONS.ACTIVITIES.PUBLIC_LAST_UPDATED_DEFER
  );
  if (!canDefer) {
    return null;
  }

  return (
    <div className="flex items-start gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <Label htmlFor={id} className="leading-snug font-normal">
        Update public &quot;Last updated&quot; timestamp
      </Label>
    </div>
  );
}
