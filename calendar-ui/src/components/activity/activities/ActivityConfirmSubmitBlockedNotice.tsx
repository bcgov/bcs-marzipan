import type { ReactElement, ReactNode } from 'react';

import type { ActivityConfirmBlockedNoticeState } from '@/lib/activity-edit-session-messages';
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
  headerBlockedMessage,
}: Pick<
  ActivityConfirmBlockedNoticeState,
  'headerBlockedMessage'
>): ReactElement | null {
  if (headerBlockedMessage == null || headerBlockedMessage.length === 0) {
    return null;
  }

  return <ActivityConfirmSubmitBlockedNotice message={headerBlockedMessage} />;
}

export function ActivityConfirmPrimaryActionGroup({
  connectionFooterMessage,
  children,
}: Pick<ActivityConfirmBlockedNoticeState, 'connectionFooterMessage'> & {
  children: ReactNode;
}): ReactElement {
  return (
    <div className="flex flex-col items-end gap-1">
      {children}
      {connectionFooterMessage != null ? (
        <ActivityConfirmSubmitBlockedNotice
          message={connectionFooterMessage}
          className="max-w-xs text-right sm:max-w-sm"
        />
      ) : null}
    </div>
  );
}
