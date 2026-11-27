import {
  resolveUserColourPresentation,
  type UserColourKey,
} from '@corpcal/shared';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export type UserColouredAvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<UserColouredAvatarSize, string> = {
  xs: 'size-[18px]',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const FALLBACK_TEXT_CLASS: Record<UserColouredAvatarSize, string> = {
  xs: 'text-[10px] font-medium leading-none',
  sm: 'text-xs font-medium',
  md: 'text-xs font-medium',
  lg: 'text-sm font-medium',
};

/** Radix/shadcn `size` when it matches `SIZE_CLASS`; custom sizes use className only. */
const AVATAR_SIZE_PROP: Record<
  UserColouredAvatarSize,
  'default' | 'lg' | undefined
> = {
  xs: undefined,
  sm: 'default',
  md: 'lg',
  lg: undefined,
};

type UserColouredAvatarProps = {
  userColourKey: UserColourKey;
  initials: string;
  size?: UserColouredAvatarSize;
  title?: string;
  className?: string;
  /** When true, hide from assistive tech (name is exposed elsewhere). */
  decorative?: boolean;
};

export function UserColouredAvatar({
  userColourKey,
  initials,
  size = 'sm',
  title,
  className,
  decorative = false,
}: UserColouredAvatarProps) {
  const colours = resolveUserColourPresentation(userColourKey);
  const visibleInitials = initials.trim();

  const radixSize = AVATAR_SIZE_PROP[size];

  return (
    <Avatar
      className={cn(SIZE_CLASS[size], className)}
      size={radixSize}
      title={title}
      aria-hidden={decorative || undefined}
      aria-label={!decorative && title ? title : undefined}
    >
      <AvatarFallback
        className={cn(
          FALLBACK_TEXT_CLASS[size],
          !visibleInitials && 'text-transparent'
        )}
        style={{
          backgroundColor: colours.avatarBgHex,
          color: colours.avatarFgHex,
        }}
      >
        {visibleInitials || '\u00a0'}
      </AvatarFallback>
    </Avatar>
  );
}
