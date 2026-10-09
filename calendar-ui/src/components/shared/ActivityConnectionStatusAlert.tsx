import { Cloud, CloudOff, CloudSync, Loader2 } from 'lucide-react';
import type { ReactElement } from 'react';

import { Alert, AlertTitle } from '@/components/ui/alert';
import type { ActivityConnectionAlertPhase } from '@/hooks/useActivityConnectionFeedback';
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
    phase === 'offline'
      ? CloudOff
      : phase === 'reconnecting'
        ? CloudSync
        : phase === 'verifying'
          ? Loader2
          : Cloud;

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
        <Icon
          aria-hidden
          className={cn(phase === 'verifying' && 'animate-spin')}
        />
        <AlertTitle className="line-clamp-none font-normal">
          {message}
        </AlertTitle>
      </Alert>
    </div>
  );
}
