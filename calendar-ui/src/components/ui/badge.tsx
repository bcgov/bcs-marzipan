import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        primary:
          'border-transparent bg-[var(--fluent-primary)] text-white hover:opacity-90',
        selected:
          'border-transparent bg-inverted-background text-inverted-foreground hover:bg-inverted-background/80',
        success:
          'border-transparent bg-green-500 text-white hover:bg-green-600',
        warning:
          'border-transparent bg-bc-gold text-slate-900 hover:bg-bc-gold-dark',
        info: 'border-transparent bg-bc-blue text-white hover:bg-bc-blue/90',
        /* Activity status badge variants (use getActivityStatusBadgeVariant for mapping) */
        'status-blue':
          'border-transparent bg-status-blue text-slate-900 hover:bg-status-blue/90',
        'status-yellow':
          'border-transparent bg-status-yellow text-slate-900 hover:bg-status-yellow/90',
        'status-green':
          'border-transparent bg-status-green text-slate-900 hover:bg-status-green/90',
        'status-red':
          'border-transparent bg-status-red text-slate-900 hover:bg-status-red/90',
        'status-grey':
          'border-transparent bg-status-grey text-slate-700 hover:bg-status-grey/90',
        'status-dark':
          'border-transparent bg-status-dark text-white hover:bg-status-dark/90',
        'status-purple':
          'border-transparent bg-status-purple text-slate-900 hover:bg-status-purple/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type ActivityStatusBadgeVariant =
  | 'status-blue'
  | 'status-yellow'
  | 'status-green'
  | 'status-red'
  | 'status-grey'
  | 'status-dark'
  | 'status-purple';

/**
 * Map activity status name (from API) to badge variant for consistent status badges.
 * Used in ActivityTable Status column, ActivityPageHeader, and anywhere status is shown.
 */
/**
 * Normalize activity status for variant lookup or comparison. Accepts either
 * lookup name (e.g. "delete_requested") or displayName (e.g. "Delete requested").
 */
export function normalizeActivityStatus(status: string): string {
  return status.toLowerCase().trim().replace(/\s+/g, '_');
}

export function getActivityStatusBadgeVariant(
  status: string | null | undefined
): ActivityStatusBadgeVariant {
  if (status == null || status === '') return 'status-purple';
  const normalized = normalizeActivityStatus(status);
  switch (normalized) {
    case 'new':
      return 'status-blue';
    case 'changed':
      return 'status-yellow';
    case 'reviewed':
      return 'status-green';
    case 'delete_requested':
    case 'deleted':
      return 'status-red';
    case 'on_hold':
      return 'status-grey';
    case 'completed':
      return 'status-dark';
    default:
      return 'status-purple';
  }
}

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
