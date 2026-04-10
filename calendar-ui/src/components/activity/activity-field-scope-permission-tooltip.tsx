import type { ReactNode } from 'react';

import type { ActivityFieldScope } from '@corpcal/shared';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import {
  ACTIVITY_FIELD_PERMISSION_DENIED_MESSAGE,
  useActivityFieldScopeControl,
} from './use-activity-field-scope-control';

type ActivityFieldScopePermissionTooltipProps = {
  scope: ActivityFieldScope;
  children: ReactNode;
  className?: string;
};

/**
 * Wraps a scoped form control when the user can view but not edit that scope.
 * Uses a focusable wrapper so tooltips work with disabled controls.
 */
export function ActivityFieldScopePermissionTooltip({
  scope,
  children,
  className,
}: ActivityFieldScopePermissionTooltipProps) {
  const { showPermissionTooltip } = useActivityFieldScopeControl(scope);

  if (!showPermissionTooltip) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('block w-full', className)} tabIndex={0}>
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent variant="light" sideOffset={4}>
          {ACTIVITY_FIELD_PERMISSION_DENIED_MESSAGE}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
