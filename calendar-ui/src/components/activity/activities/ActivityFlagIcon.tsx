import { Flag } from 'lucide-react';
import type { ReactElement } from 'react';

import {
  resolveUserColourPresentation,
  type UserColourKey,
} from '@corpcal/shared';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserColouredAvatar } from '@/components/users/UserColouredAvatar';
import { cn } from '@/lib/utils';

export type ActivityFlagIconSize = 'default' | 'compact';

type ActivityFlagIconProps = {
  assigneeName?: string | null;
  userColourKey?: UserColourKey | null;
  className?: string;
  size?: ActivityFlagIconSize;
};

type ActivityFlagOverflowIconProps = {
  extraCount: number;
  className?: string;
  size?: ActivityFlagIconSize;
};

function getAssigneeInitials(assigneeName: string): string {
  return assigneeName
    .split(' ')
    .slice(0, 2)
    .map((namePart) => namePart[0])
    .join('')
    .toUpperCase();
}

function sizeClasses(size: ActivityFlagIconSize) {
  if (size === 'compact') {
    return {
      container: 'size-[18px]',
      emptyFlag: 'size-[18px]',
      flagBadge: 'size-2',
      initialsFallback: 'text-[7px] font-medium',
      overflowText: 'text-[6px] font-semibold',
      avatarClassName: 'size-[18px] border border-white/70',
    };
  }
  return {
    container: 'size-6',
    emptyFlag: 'size-4',
    flagBadge: 'size-2.5',
    initialsFallback: 'text-[8px] font-medium',
    overflowText: 'text-[7px] font-semibold',
    avatarClassName: 'size-full border border-white/70',
  };
}

/**
 * Shared activity flag affordance used in the activity list and activity page header.
 * Icon content is laid out in a fixed positioning box so the badge anchor stays consistent.
 */
export function ActivityFlagIcon({
  assigneeName,
  userColourKey,
  className,
  size = 'default',
}: ActivityFlagIconProps): ReactElement {
  const sizes = sizeClasses(size);
  const iconContainerClassName = cn(
    'relative inline-flex shrink-0 items-center justify-center',
    sizes.container,
    className
  );

  if (!assigneeName) {
    return (
      <span className={iconContainerClassName}>
        <Flag
          className={cn('text-icon-muted-foreground', sizes.emptyFlag)}
          aria-hidden
        />
      </span>
    );
  }

  const flagColour = userColourKey
    ? resolveUserColourPresentation(userColourKey).flagHex
    : 'var(--flag-button-icon)';

  return (
    <span className={iconContainerClassName}>
      {userColourKey ? (
        <UserColouredAvatar
          userColourKey={userColourKey}
          initials={getAssigneeInitials(assigneeName)}
          size="xs"
          className={sizes.avatarClassName}
          title={assigneeName}
          decorative
        />
      ) : (
        <Avatar className={sizes.avatarClassName} title={assigneeName}>
          <AvatarFallback
            className={cn(
              sizes.initialsFallback,
              'bg-slate-100 text-slate-700'
            )}
          >
            {getAssigneeInitials(assigneeName)}
          </AvatarFallback>
        </Avatar>
      )}
      <Flag
        className={cn('absolute -right-0.5 -bottom-0.5', sizes.flagBadge)}
        style={{ fill: flagColour, color: flagColour }}
        aria-hidden
      />
    </span>
  );
}

export function ActivityFlagOverflowIcon({
  extraCount,
  className,
  size = 'default',
}: ActivityFlagOverflowIconProps): ReactElement {
  const sizes = sizeClasses(size);
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center',
        sizes.container,
        className
      )}
    >
      <Avatar size="sm" className={sizes.avatarClassName}>
        <AvatarFallback className={sizes.overflowText}>
          +{extraCount}
        </AvatarFallback>
      </Avatar>
    </span>
  );
}
