import { cn } from '@/lib/utils';

export const popoverListSectionHeadingClassName =
  'text-muted-foreground px-3 pt-2 pb-1 text-xs tracking-wide uppercase';

type PopoverListSectionHeadingProps = {
  children: string;
  className?: string;
};

export function PopoverListSectionHeading({
  children,
  className,
}: PopoverListSectionHeadingProps) {
  return (
    <div className={cn(popoverListSectionHeadingClassName, className)}>
      {children}
    </div>
  );
}
