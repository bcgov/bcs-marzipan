import { Tooltip as TooltipPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

const tooltipContentVariants = {
  default: 'bg-foreground text-background px-3 py-1.5 text-balance',
  light:
    'border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md',
} as const;

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  variant = 'default',
  arrowClassName,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & {
  /** Visual variant: default (dark) or light (light with border and matching arrow). */
  variant?: keyof typeof tooltipContentVariants;
  /** Optional class for the arrow when variant is not light (e.g. custom fill). */
  arrowClassName?: string;
}) {
  const useLightArrow = variant === 'light';
  const useCustomArrow = useLightArrow || arrowClassName != null;

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md text-xs',
          tooltipContentVariants[variant],
          className
        )}
        {...props}
      >
        {children}
        {useCustomArrow ? (
          <TooltipPrimitive.Arrow asChild>
            <svg
              width={12}
              height={6}
              viewBox="0 0 12 6"
              className={cn(
                'z-50 block shrink-0',
                useLightArrow ? 'fill-popover' : arrowClassName
              )}
              style={{ marginTop: '-1px' }}
            >
              <polygon points="0,0 6,6 12,0" fill="inherit" stroke="none" />
              <path
                d="M 0 0 L 6 6 L 12 0"
                fill="none"
                stroke="var(--border)"
                strokeWidth={1}
              />
            </svg>
          </TooltipPrimitive.Arrow>
        ) : (
          <TooltipPrimitive.Arrow
            className={cn(
              'bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] border-none'
            )}
          />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
