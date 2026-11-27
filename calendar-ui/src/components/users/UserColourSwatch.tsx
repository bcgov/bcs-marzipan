import {
  resolveUserColourPresentation,
  type UserColourKey,
} from '@corpcal/shared';
import { cn } from '@/lib/utils';

type UserColourSwatchProps = {
  userColourKey: UserColourKey;
  className?: string;
  title?: string;
};

/** Small filled circle for history / inline colour indication (not an avatar). */
export function UserColourSwatch({
  userColourKey,
  className,
  title,
}: UserColourSwatchProps) {
  const { flagHex, label } = resolveUserColourPresentation(userColourKey);

  return (
    <span
      className={cn(
        'inline-block size-3 shrink-0 rounded-full border border-black/10',
        className
      )}
      style={{ backgroundColor: flagHex }}
      title={title ?? label}
      aria-hidden
    />
  );
}
