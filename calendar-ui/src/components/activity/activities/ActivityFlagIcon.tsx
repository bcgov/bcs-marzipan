import { Flag } from 'lucide-react';
import type { ReactElement } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type ActivityFlagIconProps = {
  assigneeName?: string | null;
  assigneeFlagColour?: string | null;
  className?: string;
};

function getAssigneeInitials(assigneeName: string): string {
  return assigneeName
    .split(' ')
    .slice(0, 2)
    .map((namePart) => namePart[0])
    .join('')
    .toUpperCase();
}

const iconContainerClassName =
  'relative inline-flex size-6 shrink-0 items-center justify-center';

/**
 * Shared activity flag affordance used in the activity list and activity page header.
 * Icon content is always laid out in a 24px positioning box so the badge anchor
 * stays consistent regardless of the outer button size.
 */
export function ActivityFlagIcon({
  assigneeName,
  assigneeFlagColour,
  className,
}: ActivityFlagIconProps): ReactElement {
  if (!assigneeName) {
    return (
      <span className={cn(iconContainerClassName, className)}>
        <Flag className="text-muted-foreground size-4" aria-hidden />
      </span>
    );
  }

  const flagColour = assigneeFlagColour ?? 'var(--flag-button-icon)';

  return (
    <span className={cn(iconContainerClassName, className)}>
      <Avatar size="sm" className="size-full">
        <AvatarFallback className="text-[8px] font-medium">
          {getAssigneeInitials(assigneeName)}
        </AvatarFallback>
      </Avatar>
      <Flag
        className="absolute -right-0.5 -bottom-0.5 size-2.5"
        style={{ fill: flagColour, color: flagColour }}
        aria-hidden
      />
    </span>
  );
}
