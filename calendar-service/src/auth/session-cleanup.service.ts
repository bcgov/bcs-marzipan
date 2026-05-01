import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { lt, passwordResetTokens, sessions } from '@corpcal/database';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);
  private inFlight = false;

  constructor(private readonly databaseService: DatabaseService) {}

  @Cron('0 0 * * * *') // every hour, on the hour
  async deleteExpiredSessions(): Promise<void> {
    if (this.inFlight) {
      return;
    }

    this.inFlight = true;

    try {
      await this.databaseService.db
        .delete(sessions)
        .where(lt(sessions.expiresAt, new Date()));

      this.logger.debug('Session cleanup: removed expired sessions');
    } catch (error) {
      this.logger.error('Session cleanup failed', error);
    } finally {
      this.inFlight = false;
    }
  }

  @Cron('0 30 3 * * *') // daily at 03:30
  async deleteExpiredPasswordResetTokens(): Promise<void> {
    try {
      await this.databaseService.db
        .delete(passwordResetTokens)
        .where(lt(passwordResetTokens.expiresAt, new Date()));

      this.logger.debug('Password reset token cleanup: removed expired tokens');
    } catch (error) {
      this.logger.error('Password reset token cleanup failed', error);
    }
  }
}
