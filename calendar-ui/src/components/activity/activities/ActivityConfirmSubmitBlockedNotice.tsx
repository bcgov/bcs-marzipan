import type { ReactElement, ReactNode } from 'react';

import { isActivityConfirmConnectionBlockedMessage } from '@/lib/activity-confirm-submit-blocked-message';
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
  confirmBlockedMessage,
}: {
  confirmBlockedMessage: string | null;
}): ReactElement | null {
  if (
    confirmBlockedMessage == null ||
    confirmBlockedMessage.length === 0 ||
    isActivityConfirmConnectionBlockedMessage(confirmBlockedMessage)
  ) {
    return null;
  }

  return <ActivityConfirmSubmitBlockedNotice message={confirmBlockedMessage} />;
}

export function ActivityConfirmPrimaryActionGroup({
  confirmBlockedMessage,
  children,
}: {
  confirmBlockedMessage: string | null;
  children: ReactNode;
}): ReactElement {
  const connectionMessage =
    confirmBlockedMessage != null &&
    isActivityConfirmConnectionBlockedMessage(confirmBlockedMessage)
      ? confirmBlockedMessage
      : null;

  return (
    <div className="flex flex-col items-end gap-1">
      {children}
      {connectionMessage != null ? (
        <ActivityConfirmSubmitBlockedNotice
          message={connectionMessage}
          className="max-w-xs text-right sm:max-w-sm"
        />
      ) : null}
    </div>
  );
}
