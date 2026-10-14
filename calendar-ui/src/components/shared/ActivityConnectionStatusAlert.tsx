import { CloudCheck, CloudOff, CloudSync } from 'lucide-react';
import { useEffect, useRef, useState, type ReactElement } from 'react';

import { Alert, AlertTitle } from '@/components/ui/alert';
import type {
  ActivityConnectionAlertDisplay,
  ActivityConnectionAlertPhase,
} from '@/hooks/useActivityEditConnectionUi';
import { cn } from '@/lib/utils';

/** Shell fade/scale duration when the alert appears or dismisses. */
export const ACTIVITY_CONNECTION_ALERT_TRANSITION_MS = 250;

type ActivityConnectionStatusAlertProps = {
  display: ActivityConnectionAlertDisplay | null;
  /** True while the alert is mounted, including exit animation. */
  onPresentChange?: (present: boolean) => void;
};

function isInProgressPhase(phase: ActivityConnectionAlertPhase): boolean {
  return phase === 'reconnecting' || phase === 'verifying';
}

function connectionAlertIcon(phase: ActivityConnectionAlertPhase) {
  if (phase === 'browser-offline' || phase === 'disconnected') {
    return CloudOff;
  }
  if (phase === 'restored') {
    return CloudCheck;
  }
  return CloudSync;
}

function displayEffectKey(
  display: ActivityConnectionAlertDisplay | null
): string {
  if (display == null) {
    return 'closed';
  }
  return `${display.phase}\0${display.message}`;
}

export function ActivityConnectionStatusAlert({
  display,
  onPresentChange,
}: ActivityConnectionStatusAlertProps): ReactElement | null {
  const [rendered, setRendered] =
    useState<ActivityConnectionAlertDisplay | null>(null);
  const [shellVisible, setShellVisible] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef = useRef(false);
  const enterFrameRef = useRef<number | null>(null);

  useEffect(() => {
    onPresentChange?.(rendered != null);
  }, [onPresentChange, rendered]);

  useEffect(() => {
    const clearEnterFrame = () => {
      if (enterFrameRef.current != null) {
        cancelAnimationFrame(enterFrameRef.current);
        enterFrameRef.current = null;
      }
    };

    if (exitTimerRef.current != null) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    if (display != null) {
      setRendered(display);

      if (!openRef.current) {
        openRef.current = true;
        setShellVisible(false);
        clearEnterFrame();
        enterFrameRef.current = requestAnimationFrame(() => {
          enterFrameRef.current = requestAnimationFrame(() => {
            enterFrameRef.current = null;
            setShellVisible(true);
          });
        });
      }

      return clearEnterFrame;
    }

    if (openRef.current) {
      openRef.current = false;
      clearEnterFrame();
      setShellVisible(false);
      exitTimerRef.current = setTimeout(() => {
        exitTimerRef.current = null;
        setRendered(null);
      }, ACTIVITY_CONNECTION_ALERT_TRANSITION_MS);
    }

    return () => {
      clearEnterFrame();
      if (exitTimerRef.current != null) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [displayEffectKey(display)]);

  if (rendered == null) {
    return null;
  }

  const Icon = connectionAlertIcon(rendered.phase);
  const iconSpin = isInProgressPhase(rendered.phase);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4"
      aria-live="polite"
    >
      <Alert
        className={cn(
          'bg-muted border-border text-foreground pointer-events-auto w-full max-w-md shadow-md sm:w-[24rem]',
          'transform-gpu transition-[opacity,transform,border-color] duration-[250ms] ease-in-out motion-reduce:transition-none',
          shellVisible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-0.5 scale-[0.98] opacity-0',
          rendered.phase === 'restored' &&
            'border-green-600/40 dark:border-green-500/40'
        )}
      >
        <Icon
          aria-hidden
          className={cn(
            'shrink-0 transition-transform duration-[250ms] ease-in-out motion-reduce:transition-none',
            iconSpin && 'animate-spin'
          )}
        />
        <AlertTitle className="line-clamp-none font-normal">
          {rendered.message}
        </AlertTitle>
      </Alert>
    </div>
  );
}
