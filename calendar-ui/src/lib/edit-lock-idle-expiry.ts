/** Allowance for client/server clock estimate error and cleanup timing. */
export const EDIT_LOCK_IDLE_EXPIRY_TOLERANCE_MS = 5_000;

type IsEditLockIdleExpiredInput = {
  /** Last server-issued idle deadline for this user's lock (server clock, ms). */
  idleExpiresAtMs: number | null;
  /** Current server time estimate (ms). */
  serverNowMs: number;
  /**
   * Earliest user activity not yet acknowledged by the server (server clock, ms),
   * e.g. activity heartbeats that failed while offline.
   */
  unconfirmedActivityAtMs: number | null;
};

/**
 * True when a lost lock is explained by inactivity: the idle deadline has passed
 * and the user did nothing before it that the server failed to receive. Activity
 * before the deadline that never reached the server means a connection problem,
 * where automatic recovery is appropriate.
 */
export function isEditLockIdleExpired({
  idleExpiresAtMs,
  serverNowMs,
  unconfirmedActivityAtMs,
}: IsEditLockIdleExpiredInput): boolean {
  if (idleExpiresAtMs == null || !Number.isFinite(idleExpiresAtMs)) {
    return false;
  }
  if (serverNowMs + EDIT_LOCK_IDLE_EXPIRY_TOLERANCE_MS < idleExpiresAtMs) {
    return false;
  }
  if (
    unconfirmedActivityAtMs != null &&
    unconfirmedActivityAtMs < idleExpiresAtMs
  ) {
    return false;
  }
  return true;
}
