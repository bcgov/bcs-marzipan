import { Injectable, Logger } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';

import { applicationSettings } from '@corpcal/database/schema';
import {
  ACTIVITY_COMPLETION_BUFFER_KEY,
  ACTIVITY_COMPLETION_SCHEDULE_KEY,
  COMPLETION_BUFFER_OPTIONS,
  COMPLETION_SCHEDULES,
  DEFAULT_COMPLETION_BUFFER_MINUTES,
  DEFAULT_COMPLETION_SCHEDULE,
  type CompletionBufferMinutes,
  type CompletionSchedule,
} from '@corpcal/shared';

import type { DrizzleDbExecutor } from '../database/database.provider';
import { DatabaseService } from '../database/database.service';

export const EDIT_LOCK_IDLE_TIMEOUT_KEY = 'edit_lock_idle_timeout_minutes';
export const DEFAULT_EDIT_LOCK_IDLE_TIMEOUT_MINUTES = 5;

@Injectable()
export class ApplicationSettingsService {
  private readonly logger = new Logger(ApplicationSettingsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  // --------------------------------------------------------------------------
  // Edit lock idle timeout
  // --------------------------------------------------------------------------

  async getEditLockIdleTimeoutMinutes(
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<number> {
    const [row] = await executor
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

  // --------------------------------------------------------------------------
  // Activity completion automation settings
  // --------------------------------------------------------------------------

  async getCompletionSettings(): Promise<{
    schedule: CompletionSchedule;
    bufferMinutes: CompletionBufferMinutes;
  }> {
    const rows = await this.databaseService.db
      .select()
      .from(applicationSettings)
      .where(
        inArray(applicationSettings.key, [
          ACTIVITY_COMPLETION_SCHEDULE_KEY,
          ACTIVITY_COMPLETION_BUFFER_KEY,
        ])
      );

    const map = new Map(rows.map((r) => [r.key, r.value]));

    const rawSchedule = map.get(ACTIVITY_COMPLETION_SCHEDULE_KEY);
    const schedule: CompletionSchedule =
      rawSchedule &&
      (COMPLETION_SCHEDULES as readonly string[]).includes(rawSchedule)
        ? (rawSchedule as CompletionSchedule)
        : DEFAULT_COMPLETION_SCHEDULE;

    const rawBuffer = map.get(ACTIVITY_COMPLETION_BUFFER_KEY);
    let bufferMinutes: CompletionBufferMinutes =
      DEFAULT_COMPLETION_BUFFER_MINUTES;
    if (rawBuffer != null) {
      const n = Number.parseInt(rawBuffer, 10);
      if ((COMPLETION_BUFFER_OPTIONS as readonly number[]).includes(n)) {
        bufferMinutes = n as CompletionBufferMinutes;
      } else {
        this.logger.warn(
          `Invalid ${ACTIVITY_COMPLETION_BUFFER_KEY}=${rawBuffer}, using default`
        );
      }
    }

    return { schedule, bufferMinutes };
  }

  async setCompletionSettings(
    schedule: CompletionSchedule,
    bufferMinutes: CompletionBufferMinutes
  ): Promise<void> {
    const now = new Date();
    const upsert = (key: string, value: string) =>
      this.databaseService.db
        .insert(applicationSettings)
        .values({ key, value, updatedAt: now })
        .onConflictDoUpdate({
          target: applicationSettings.key,
          set: { value, updatedAt: now },
        });

    await Promise.all([
      upsert(ACTIVITY_COMPLETION_SCHEDULE_KEY, schedule),
      upsert(ACTIVITY_COMPLETION_BUFFER_KEY, String(bufferMinutes)),
    ]);
  }
}
