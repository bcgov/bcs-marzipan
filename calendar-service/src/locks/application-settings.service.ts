import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { applicationSettings } from '@corpcal/database/schema';

import { DatabaseService } from '../database/database.service';

export const EDIT_LOCK_IDLE_TIMEOUT_KEY = 'edit_lock_idle_timeout_minutes';
export const DEFAULT_EDIT_LOCK_IDLE_TIMEOUT_MINUTES = 30;

@Injectable()
export class ApplicationSettingsService {
  private readonly logger = new Logger(ApplicationSettingsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getEditLockIdleTimeoutMinutes(): Promise<number> {
    const [row] = await this.databaseService.db
      .select()
      .from(applicationSettings)
      .where(eq(applicationSettings.key, EDIT_LOCK_IDLE_TIMEOUT_KEY))
      .limit(1);
    if (!row?.value) return DEFAULT_EDIT_LOCK_IDLE_TIMEOUT_MINUTES;
    const n = Number.parseInt(row.value, 10);
    if (!Number.isFinite(n) || n < 1 || n > 24 * 60) {
      this.logger.warn(
        `Invalid ${EDIT_LOCK_IDLE_TIMEOUT_KEY}=${row.value}, using default`
      );
      return DEFAULT_EDIT_LOCK_IDLE_TIMEOUT_MINUTES;
    }
    return n;
  }

  async setEditLockIdleTimeoutMinutes(minutes: number): Promise<void> {
    await this.databaseService.db
      .insert(applicationSettings)
      .values({
        key: EDIT_LOCK_IDLE_TIMEOUT_KEY,
        value: String(minutes),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: applicationSettings.key,
        set: {
          value: String(minutes),
          updatedAt: new Date(),
        },
      });
  }
}
