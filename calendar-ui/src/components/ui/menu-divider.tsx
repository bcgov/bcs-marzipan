import { cn } from '@/lib/utils';

type MenuDividerProps = {
  className?: string;
};

/**
 * Lightweight separator for compact UIs (menus/popovers/lists).
 * Defaults to a small vertical margin.
 */
export function MenuDivider({ className }: MenuDividerProps) {
  return (
    <div
      role="separator"
      aria-hidden="true"
      className={cn('my-1 w-full border-t', className)}
    />
  );
}
