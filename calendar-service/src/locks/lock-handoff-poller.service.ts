import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { LocksService } from './locks.service';

/**
 * Processes due lock handoffs and idle lock expiry every 10 seconds (Postgres-backed, no Redis).
 */
@Injectable()
export class LockHandoffPoller {
  private readonly logger = new Logger(LockHandoffPoller.name);

  constructor(private readonly locksService: LocksService) {}

  @Cron('*/10 * * * * *')
  async runLockMaintenance(): Promise<void> {
    try {
      const handoffs = await this.locksService.processDueHandoffsOnce();
      const cleaned = await this.locksService.cleanupExpiredLocks();
      if (handoffs > 0 || cleaned > 0) {
        this.logger.debug(
          `Lock maintenance: handoffs=${handoffs}, idleCleaned=${cleaned}`
        );
      }
    } catch (err) {
      this.logger.error(
        'Lock maintenance failed',
        err instanceof Error ? err.stack : String(err)
      );
    }
  }
}
