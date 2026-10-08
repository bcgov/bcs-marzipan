import type { ReactElement } from 'react';

type ActivityConfirmSubmitBlockedNoticeProps = {
  message: string;
};

export function ActivityConfirmSubmitBlockedNotice({
  message,
}: ActivityConfirmSubmitBlockedNoticeProps): ReactElement {
  return (
    <p
      className="text-sm font-medium text-amber-700 dark:text-amber-500"
      role="status"
    >
      {message}
    </p>
  );
}
