import { toast } from 'sonner';

export type CountdownLoadingToastHandle = {
  dispose: () => void;
};

export function startCountdownLoadingToast(options: {
  toastId: string;
  endMs: number;
  getMessage: (secondsLeft: number) => string;
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
    toast.loading(options.getMessage(secondsLeft), {
      id: options.toastId,
      duration: Infinity,
    });
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
