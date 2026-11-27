import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ActiveInactiveBadgeProps = {
  isActive: boolean;
  size?: NonNullable<BadgeProps['size']>;
  className?: string;
};

/** Pill badge for user / team / lookup `isActive` (muted green active, muted grey inactive). */
export function ActiveInactiveBadge({
  isActive,
  size = 'default',
  className,
}: ActiveInactiveBadgeProps) {
  return (
    <Badge
      variant={isActive ? 'entity-active' : 'entity-inactive'}
      size={size}
      className={cn('font-normal', className)}
    >
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}
