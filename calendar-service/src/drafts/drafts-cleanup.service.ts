import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { DraftsService } from './drafts.service';

/** Daily cleanup of expired form drafts (replaces former POST /drafts/cleanup). */
@Injectable()
export class DraftsCleanupService {
  private readonly logger = new Logger(DraftsCleanupService.name);
  private inFlight = false;

  constructor(private readonly draftsService: DraftsService) {}

  @Cron('0 0 2 * * *')
  async cleanupExpiredDrafts(): Promise<void> {
    if (this.inFlight) {
      return;
    }

    this.inFlight = true;
    try {
      const deletedCount = await this.draftsService.cleanupExpiredDrafts();
      this.logger.log(
        `Draft cleanup: removed ${deletedCount} expired draft(s)`
      );
    } catch (error) {
      this.logger.error('Draft cleanup failed', error);
    } finally {
      this.inFlight = false;
    }
  }
}
