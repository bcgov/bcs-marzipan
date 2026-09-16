import { toast } from 'sonner';

/** Formats remaining time: minutes only when >= 1 minute, seconds when under. */
export function formatCountdownRemaining(secondsLeft: number): string {
  if (secondsLeft >= 60) {
    const minutes = Math.ceil(secondsLeft / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }
  return `${secondsLeft} ${secondsLeft === 1 ? 'second' : 'seconds'}`;
}

export type CountdownLoadingToastContent = {
  title: string;
  description?: string;
};

export type CountdownLoadingToastHandle = {
  dispose: () => void;
};

export type CountdownLoadingToastVariant = 'loading' | 'warning';

export function startCountdownLoadingToast(options: {
  toastId: string;
  endMs: number;
  getContent: (secondsLeft: number) => CountdownLoadingToastContent;
  /** Toast icon style; defaults to loading spinner. */
  variant?: CountdownLoadingToastVariant;
  /** Called once when secondsLeft reaches 0. Return false to stop ticking without dismissing. */
  onExpired?: () => boolean | void;
}): CountdownLoadingToastHandle {
  let intervalId: number | null = null;
  let disposed = false;
  let expired = false;

  const clearTick = (): void => {
    if (intervalId != null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  };

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    clearTick();
    toast.dismiss(options.toastId);
  };

  const run = (): void => {
    if (disposed) return;
    const secondsLeft = Math.max(
      0,
      Math.ceil((options.endMs - Date.now()) / 1000)
    );
    const content = options.getContent(secondsLeft);
    const toastOptions = {
      id: options.toastId,
      description: content.description,
      duration: Infinity,
    };
    if (options.variant === 'warning') {
      toast.warning(content.title, toastOptions);
    } else {
      toast.loading(content.title, toastOptions);
    }
    if (secondsLeft <= 0 && !expired) {
      expired = true;
      const keepTicking = options.onExpired?.();
      if (keepTicking === false) {
        clearTick();
        return;
      }
      clearTick();
      toast.dismiss(options.toastId);
    }
  };

  run();
  intervalId = window.setInterval(run, 1000);

  return { dispose };
}
