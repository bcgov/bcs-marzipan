const DEFAULT_ATTEMPTS = 3;
const DEFAULT_DELAY_MS = 300;

export type ReleaseLockWithRetryOptions = {
  attempts?: number;
  delayMs?: number;
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Best-effort lock release with short retries (e.g. lockout boundary revert).
 * Returns true when the server acknowledged release.
 */
export async function releaseLockWithRetry(
  releaseLock: (lockId: number) => Promise<void>,
  lockId: number,
  options?: ReleaseLockWithRetryOptions
): Promise<boolean> {
  const attempts = options?.attempts ?? DEFAULT_ATTEMPTS;
  const delayMs = options?.delayMs ?? DEFAULT_DELAY_MS;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await releaseLock(lockId);
      return true;
    } catch {
      if (attempt < attempts - 1) {
        await wait(delayMs);
      }
    }
  }

  return false;
}
