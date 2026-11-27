import type { UserColourKey } from '@corpcal/shared';
import { ActivityFlagIcon } from '@/components/activity/activities/ActivityFlagIcon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { UserColouredAvatar } from './UserColouredAvatar';
import { UserColourSwatchPicker } from './UserColourSwatchPicker';

export function initialsFromDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  return (
    trimmed
      .split(/\s+/)
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || ''
  );
}

type UserColourIdentityFieldProps = {
  value: UserColourKey;
  onChange: (key: UserColourKey) => void;
  /** Used for flag preview, tooltips, and default initials when `avatarInitials` omitted. */
  previewAssigneeName: string;
  /** When set, overrides initials derived from `previewAssigneeName` (e.g. display name only on create). */
  avatarInitials?: string;
  disabled?: boolean;
  id?: string;
  /** Create flow: avatar + toggle until expanded; single row kept when expanded. */
  collapsible?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /**
   * Create flow: avatar lives in the display-name input; this block is toggle + picker only.
   */
  embedded?: boolean;
};

export function UserColourIdentityField({
  value,
  onChange,
  previewAssigneeName,
  avatarInitials: avatarInitialsProp,
  disabled,
  id,
  collapsible = false,
  expanded = true,
  onExpandedChange,
  embedded = false,
}: UserColourIdentityFieldProps) {
  const showPicker = !collapsible || expanded;
  const avatarInitials =
    avatarInitialsProp !== undefined
      ? avatarInitialsProp
      : initialsFromDisplayName(previewAssigneeName);

  const toggleControl = collapsible ? (
    <Button
      type="button"
      variant="link"
      className="text-primary h-auto min-h-0 px-0 py-0 text-sm font-normal"
      disabled={disabled}
      onClick={() => onExpandedChange?.(!expanded)}
    >
      {expanded ? 'Hide colours' : 'Change colour'}
    </Button>
  ) : null;

  return (
    <div className={cn('space-y-3', embedded && collapsible && '-mt-1')}>
      {collapsible && !embedded ? (
        <div className="flex flex-wrap items-center gap-3">
          <UserColouredAvatar
            userColourKey={value}
            initials={avatarInitials}
            size="md"
            title={previewAssigneeName}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-sm"
            disabled={disabled}
            onClick={() => onExpandedChange?.(!expanded)}
          >
            {expanded ? 'Hide colours' : 'Change colour'}
          </Button>
        </div>
      ) : null}

      {collapsible && embedded ? toggleControl : null}

      {!collapsible ? (
        <div className="w-full max-w-full">
          <ActivityFlagIcon
            assigneeName={previewAssigneeName}
            userColourKey={value}
          />
        </div>
      ) : null}

      {showPicker ? (
        <div className="w-full max-w-full">
          <UserColourSwatchPicker
            id={id}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        </div>
      ) : null}
    </div>
  );
}
