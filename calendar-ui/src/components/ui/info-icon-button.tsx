import { Info } from 'lucide-react';
import { type ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/utils';

const touchTargetClasses = {
  /** 24×24px tap area (WCAG 2.5.5 minimum); margin box stays ~16px so label rows align in grids. */
  minimum: 'p-1 -m-1',
  /** ~44×44px tap area; same layout trick, larger hit slop. */
  comfortable: 'p-[14px] -m-[14px]',
} as const;

export type InfoIconButtonProps = ComponentPropsWithRef<'button'> & {
  touchTarget?: keyof typeof touchTargetClasses;
};

/**
 * Icon-only control for popovers/tooltips next to labels. Uses padding + matching negative
 * margin so the accessible target size does not increase the flex row height vs. a plain label.
 * Renders Lucide `Info` by default; pass `children` to override the icon.
 */
export function InfoIconButton({
  className,
  touchTarget = 'minimum',
  type = 'button',
  ref,
  children,
  ...props
}: InfoIconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex shrink-0 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-[3px]',
        touchTargetClasses[touchTarget],
        className
      )}
      {...props}
    >
      {children ?? <Info className="size-4 shrink-0" aria-hidden />}
    </button>
  );
}
