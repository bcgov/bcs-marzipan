import { CloudOff, CloudSync } from 'lucide-react';
import type { ReactElement } from 'react';

import { Alert, AlertTitle } from '@/components/ui/alert';
import {
  ACTIVITY_EDIT_CONNECTION_OFFLINE_ALERT,
  ACTIVITY_EDIT_CONNECTION_RECONNECTING_ALERT,
} from '@/lib/activity-edit-session-messages';

type ActivityConnectionStatusAlertProps = {
  state: 'reconnecting' | 'offline';
};

export function ActivityConnectionStatusAlert({
  state,
}: ActivityConnectionStatusAlertProps): ReactElement {
  const message =
    state === 'offline'
      ? ACTIVITY_EDIT_CONNECTION_OFFLINE_ALERT
      : ACTIVITY_EDIT_CONNECTION_RECONNECTING_ALERT;
  const Icon = state === 'offline' ? CloudOff : CloudSync;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4"
      aria-live="polite"
    >
      <Alert className="bg-muted border-border text-foreground pointer-events-auto w-full max-w-lg shadow-md">
        <Icon aria-hidden />
        <AlertTitle className="line-clamp-none font-normal">
          {message}
        </AlertTitle>
      </Alert>
    </div>
  );
}
