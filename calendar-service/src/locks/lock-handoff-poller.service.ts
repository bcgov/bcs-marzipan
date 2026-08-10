import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import { LocksService } from './locks.service';

/**
 * Backup handoff finalization every 180s and expired-lock cleanup every 5 minutes.
 * Primary completion at `graceEndsAt` is scheduled by {@link LockHandoffDeadlineKickService}.
 */
@Injectable()
export class LockHandoffPoller {
  private readonly logger = new Logger(LockHandoffPoller.name);
  private handoffBackupInFlight = false;
  private cleanupInFlight = false;

  constructor(private readonly locksService: LocksService) {}

  @Interval(180_000)
  async runHandoffBackup(): Promise<void> {
    if (this.handoffBackupInFlight) {
      return;
    }
    this.handoffBackupInFlight = true;
    try {
      const handoffs = await this.locksService.processAllDueHandoffs();
      if (handoffs > 0) {
        this.logger.debug(
          `Lock handoff backup: finalized ${handoffs} handoff(s)`
        );
      }
    } catch (err) {
      this.logger.error(
        'Lock handoff backup failed',
        err instanceof Error ? err.stack : String(err)
      );
    } finally {
      this.handoffBackupInFlight = false;
    }
  }

  @Interval(300_000)
  async runExpiredLockCleanup(): Promise<void> {
    if (this.cleanupInFlight) {
      return;
    }
    this.cleanupInFlight = true;
    try {
      const cleaned = await this.locksService.cleanupExpiredLocks();
      if (cleaned > 0) {
        this.logger.debug(`Expired lock cleanup: removed ${cleaned} row(s)`);
      }
    } catch (err) {
      this.logger.error(
        'Expired lock cleanup failed',
        err instanceof Error ? err.stack : String(err)
      );
    } finally {
      this.cleanupInFlight = false;
    }
  }
}
