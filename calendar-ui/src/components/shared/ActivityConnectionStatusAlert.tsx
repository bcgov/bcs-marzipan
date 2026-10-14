import { CloudCheck, CloudOff, CloudSync } from 'lucide-react';
import type { ReactElement } from 'react';

import { Alert, AlertTitle } from '@/components/ui/alert';
import type { ActivityConnectionAlertPhase } from '@/hooks/useActivityEditConnectionUi';
import { cn } from '@/lib/utils';

type ActivityConnectionStatusAlertProps = {
  phase: ActivityConnectionAlertPhase;
  message: string;
};

export function ActivityConnectionStatusAlert({
  phase,
  message,
}: ActivityConnectionStatusAlertProps): ReactElement {
  const Icon =
    phase === 'browser-offline' || phase === 'disconnected'
      ? CloudOff
      : phase === 'restored'
        ? CloudCheck
        : CloudSync;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4"
      aria-live="polite"
    >
      <Alert
        className={cn(
          'bg-muted border-border text-foreground pointer-events-auto w-fit max-w-md shadow-md',
          phase === 'restored' && 'border-green-600/40 dark:border-green-500/40'
        )}
      >
        <Icon aria-hidden />
        <AlertTitle className="line-clamp-none font-normal">
          {message}
        </AlertTitle>
      </Alert>
    </div>
  );
}
