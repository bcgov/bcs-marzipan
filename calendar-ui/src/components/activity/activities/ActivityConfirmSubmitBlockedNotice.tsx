import type { ReactElement, ReactNode } from 'react';

import type { ActivityConfirmBlockedNotice } from '@/lib/activity-edit-session-messages';
import { cn } from '@/lib/utils';

type ActivityConfirmSubmitBlockedNoticeProps = {
  message: string;
  className?: string;
};

export function ActivityConfirmSubmitBlockedNotice({
  message,
  className,
}: ActivityConfirmSubmitBlockedNoticeProps): ReactElement {
  return (
    <p
      className={cn(
        'text-sm font-medium text-amber-700 dark:text-amber-500',
        className
      )}
      role="status"
    >
      {message}
    </p>
  );
}

export function ActivityConfirmHeaderBlockedNotice({
  notice,
}: {
  notice?: ActivityConfirmBlockedNotice | null;
}): ReactElement | null {
  if (notice?.variant !== 'recovery' || notice.message.length === 0) {
    return null;
  }

  return <ActivityConfirmSubmitBlockedNotice message={notice.message} />;
}

export function ActivityConfirmPrimaryActionGroup({
  notice,
  children,
}: {
  notice?: ActivityConfirmBlockedNotice | null;
  children: ReactNode;
}): ReactElement {
  return (
    <div className="flex flex-col items-end gap-1">
      {children}
      {notice?.variant === 'connection' ? (
        <ActivityConfirmSubmitBlockedNotice
          message={notice.message}
          className="max-w-xs text-right sm:max-w-sm"
        />
      ) : null}
    </div>
  );
}
