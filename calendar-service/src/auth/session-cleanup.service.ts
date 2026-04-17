import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { lt, sessions } from '@corpcal/database';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  @Cron('0 0 * * * *') // every hour, on the hour
  async deleteExpiredSessions(): Promise<void> {
    await this.databaseService.db
      .delete(sessions)
      .where(lt(sessions.expiresAt, new Date()));
    this.logger.debug('Session cleanup: removed expired sessions');
  }
}
