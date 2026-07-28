import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';

import { applicationSettings } from '@corpcal/database/schema';
import {
  ACTIVITY_COMPLETION_BUFFER_KEY,
  ACTIVITY_COMPLETION_SCHEDULE_KEY,
  ACTIVITY_INFO_ICON_SETTINGS_KEY,
  ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_KEY_SET,
  ACTIVITY_REVIEW_EXEMPT_FIELD_KEYS_SETTING,
  activityInfoIconSettingsSchema,
  COMPLETION_BUFFER_OPTIONS,
  COMPLETION_SCHEDULES,
  DEFAULT_ACTIVITY_INFO_ICON_SETTINGS,
  DEFAULT_COMPLETION_BUFFER_MINUTES,
  DEFAULT_COMPLETION_SCHEDULE,
  DEFAULT_CONFIGURABLE_REVIEW_EXEMPT_FIELD_KEYS,
  deriveLookAheadResetCronMode,
  invalidStoredLookAheadResetWindowDays,
  LOOK_AHEAD_RESET_CRON_ENABLED_KEY,
  LOOK_AHEAD_RESET_CRON_PAUSED_FOR_DATE_KEY,
  LOOK_AHEAD_RESET_WINDOW_DAYS_KEY,
  MAX_LOOK_AHEAD_RESET_WINDOW_DAYS,
  MIN_LOOK_AHEAD_RESET_WINDOW_DAYS,
  normalizeLookAheadResetWindowDays,
  pacificCalendarDateFromUtcMs,
  parseLookAheadResetCronEnabled,
  REPORT_LOOK_AHEAD_COVER_CONTACT_EMAIL_KEY,
  REPORT_LOOK_AHEAD_COVER_CONTACT_PHONE_KEY,
  type ActivityInfoIconSettings,
  type CompletionBufferMinutes,
  type CompletionSchedule,
  type LookAheadResetCronMode,
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

  async getCompletionSettings(
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<{
    schedule: CompletionSchedule;
    bufferMinutes: CompletionBufferMinutes;
  }> {
    const rows = await executor
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

  // --------------------------------------------------------------------------
  // Look Ahead reset window (days after today for inclusive end date)
  // --------------------------------------------------------------------------

  async getLookAheadResetWindowDays(
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<number> {
    const [row] = await executor
      .select()
      .from(applicationSettings)
      .where(eq(applicationSettings.key, LOOK_AHEAD_RESET_WINDOW_DAYS_KEY))
      .limit(1);
    const raw = row?.value;
    if (invalidStoredLookAheadResetWindowDays(raw)) {
      this.logger.warn(
        `Invalid ${LOOK_AHEAD_RESET_WINDOW_DAYS_KEY}=${raw}, using default`
      );
    }
    return normalizeLookAheadResetWindowDays(raw);
  }

  async setLookAheadResetWindowDays(
    windowDaysAfterToday: number
  ): Promise<void> {
    if (
      !Number.isFinite(windowDaysAfterToday) ||
      windowDaysAfterToday < MIN_LOOK_AHEAD_RESET_WINDOW_DAYS ||
      windowDaysAfterToday > MAX_LOOK_AHEAD_RESET_WINDOW_DAYS
    ) {
      throw new BadRequestException(
        `windowDaysAfterToday must be between ${MIN_LOOK_AHEAD_RESET_WINDOW_DAYS} and ${MAX_LOOK_AHEAD_RESET_WINDOW_DAYS}`
      );
    }
    const now = new Date();
    await this.databaseService.db
      .insert(applicationSettings)
      .values({
        key: LOOK_AHEAD_RESET_WINDOW_DAYS_KEY,
        value: String(windowDaysAfterToday),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: applicationSettings.key,
        set: {
          value: String(windowDaysAfterToday),
          updatedAt: now,
        },
      });
  }

  async getLookAheadResetCronSettings(
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<{ cronEnabled: boolean; pausedForDate: string | null }> {
    const rows = await executor
      .select()
      .from(applicationSettings)
      .where(
        inArray(applicationSettings.key, [
          LOOK_AHEAD_RESET_CRON_ENABLED_KEY,
          LOOK_AHEAD_RESET_CRON_PAUSED_FOR_DATE_KEY,
        ])
      );
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const pausedRaw = map.get(LOOK_AHEAD_RESET_CRON_PAUSED_FOR_DATE_KEY);
    const pausedForDate =
      pausedRaw != null && pausedRaw.trim() !== '' ? pausedRaw.trim() : null;
    return {
      cronEnabled: parseLookAheadResetCronEnabled(
        map.get(LOOK_AHEAD_RESET_CRON_ENABLED_KEY)
      ),
      pausedForDate,
    };
  }

  async getLookAheadResetCronMode(
    executor: DrizzleDbExecutor = this.databaseService.db,
    utcMs: number = Date.now()
  ): Promise<LookAheadResetCronMode> {
    const settings = await this.getLookAheadResetCronSettings(executor);
    return deriveLookAheadResetCronMode(settings, utcMs);
  }

  async setLookAheadResetCronMode(
    cronMode: LookAheadResetCronMode,
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<void> {
    const now = new Date();
    const upsert = (key: string, value: string) =>
      executor
        .insert(applicationSettings)
        .values({ key, value, updatedAt: now })
        .onConflictDoUpdate({
          target: applicationSettings.key,
          set: { value, updatedAt: now },
        });

    if (cronMode === 'stopped') {
      await Promise.all([
        upsert(LOOK_AHEAD_RESET_CRON_ENABLED_KEY, 'false'),
        upsert(LOOK_AHEAD_RESET_CRON_PAUSED_FOR_DATE_KEY, ''),
      ]);
      return;
    }

    if (cronMode === 'paused_today') {
      // One-night skip; set only via manual reset (not admin settings UI).
      const today = pacificCalendarDateFromUtcMs(Date.now());
      await Promise.all([
        upsert(LOOK_AHEAD_RESET_CRON_ENABLED_KEY, 'true'),
        upsert(LOOK_AHEAD_RESET_CRON_PAUSED_FOR_DATE_KEY, today),
      ]);
      return;
    }

    await Promise.all([
      upsert(LOOK_AHEAD_RESET_CRON_ENABLED_KEY, 'true'),
      upsert(LOOK_AHEAD_RESET_CRON_PAUSED_FOR_DATE_KEY, ''),
    ]);
  }

  async clearLookAheadResetPausedForDate(
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<void> {
    const now = new Date();
    await executor
      .insert(applicationSettings)
      .values({
        key: LOOK_AHEAD_RESET_CRON_PAUSED_FOR_DATE_KEY,
        value: '',
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: applicationSettings.key,
        set: { value: '', updatedAt: now },
      });
  }

  // --------------------------------------------------------------------------
  // Look-ahead PDF cover contact (phone / email on exported cover page)
  // --------------------------------------------------------------------------

  async getLookAheadReportCoverContact(
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<{ contactPhone: string; contactEmail: string }> {
    const rows = await executor
      .select()
      .from(applicationSettings)
      .where(
        inArray(applicationSettings.key, [
          REPORT_LOOK_AHEAD_COVER_CONTACT_PHONE_KEY,
          REPORT_LOOK_AHEAD_COVER_CONTACT_EMAIL_KEY,
        ])
      );
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      contactPhone: (
        map.get(REPORT_LOOK_AHEAD_COVER_CONTACT_PHONE_KEY) ?? ''
      ).trim(),
      contactEmail: (
        map.get(REPORT_LOOK_AHEAD_COVER_CONTACT_EMAIL_KEY) ?? ''
      ).trim(),
    };
  }

  async setLookAheadReportCoverContact(
    contactPhone: string,
    contactEmail: string
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
      upsert(REPORT_LOOK_AHEAD_COVER_CONTACT_PHONE_KEY, contactPhone),
      upsert(REPORT_LOOK_AHEAD_COVER_CONTACT_EMAIL_KEY, contactEmail),
    ]);
  }

  // --------------------------------------------------------------------------
  // Review-exempt form fields (admin-configurable, JSON array in value)
  // --------------------------------------------------------------------------

  async getReviewExemptFieldKeys(
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<string[]> {
    const [row] = await executor
      .select()
      .from(applicationSettings)
      .where(
        eq(applicationSettings.key, ACTIVITY_REVIEW_EXEMPT_FIELD_KEYS_SETTING)
      )
      .limit(1);

    if (!row?.value) {
      return [...DEFAULT_CONFIGURABLE_REVIEW_EXEMPT_FIELD_KEYS];
    }

    try {
      const parsed: unknown = JSON.parse(row.value);
      if (!Array.isArray(parsed)) {
        this.logger.warn(
          `Invalid ${ACTIVITY_REVIEW_EXEMPT_FIELD_KEYS_SETTING} (not array), using default`
        );
        return [...DEFAULT_CONFIGURABLE_REVIEW_EXEMPT_FIELD_KEYS];
      }
      const out: string[] = [];
      for (const item of parsed) {
        if (
          typeof item === 'string' &&
          ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_KEY_SET.has(item)
        ) {
          out.push(item);
        }
      }
      return out.length > 0
        ? out
        : [...DEFAULT_CONFIGURABLE_REVIEW_EXEMPT_FIELD_KEYS];
    } catch {
      this.logger.warn(
        `Invalid JSON for ${ACTIVITY_REVIEW_EXEMPT_FIELD_KEYS_SETTING}, using default`
      );
      return [...DEFAULT_CONFIGURABLE_REVIEW_EXEMPT_FIELD_KEYS];
    }
  }

  async setReviewExemptFieldKeys(fieldKeys: string[]): Promise<void> {
    const filtered = fieldKeys.filter((k) =>
      ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_KEY_SET.has(k)
    );
    const unique = [...new Set(filtered)];
    const now = new Date();
    await this.databaseService.db
      .insert(applicationSettings)
      .values({
        key: ACTIVITY_REVIEW_EXEMPT_FIELD_KEYS_SETTING,
        value: JSON.stringify(unique),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: applicationSettings.key,
        set: {
          value: JSON.stringify(unique),
          updatedAt: now,
        },
      });
  }

  // --------------------------------------------------------------------------
  // Activity form info icons (admin-configurable, JSON object in value)
  // --------------------------------------------------------------------------

  async getActivityInfoIconSettings(
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<ActivityInfoIconSettings> {
    const [row] = await executor
      .select()
      .from(applicationSettings)
      .where(eq(applicationSettings.key, ACTIVITY_INFO_ICON_SETTINGS_KEY))
      .limit(1);

    if (!row?.value) {
      return {
        items: [...DEFAULT_ACTIVITY_INFO_ICON_SETTINGS.items],
      };
    }

    try {
      const parsed: unknown = JSON.parse(row.value);
      const result = activityInfoIconSettingsSchema.safeParse(parsed);
      if (!result.success || result.data.items.length === 0) {
        this.logger.warn(
          `Invalid ${ACTIVITY_INFO_ICON_SETTINGS_KEY}, using default`
        );
        return {
          items: [...DEFAULT_ACTIVITY_INFO_ICON_SETTINGS.items],
        };
      }
      return result.data;
    } catch {
      this.logger.warn(
        `Invalid JSON for ${ACTIVITY_INFO_ICON_SETTINGS_KEY}, using default`
      );
      return {
        items: [...DEFAULT_ACTIVITY_INFO_ICON_SETTINGS.items],
      };
    }
  }

  async setActivityInfoIconSettings(
    settings: ActivityInfoIconSettings
  ): Promise<void> {
    const normalized = activityInfoIconSettingsSchema.parse(settings);
    const now = new Date();
    await this.databaseService.db
      .insert(applicationSettings)
      .values({
        key: ACTIVITY_INFO_ICON_SETTINGS_KEY,
        value: JSON.stringify(normalized),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: applicationSettings.key,
        set: {
          value: JSON.stringify(normalized),
          updatedAt: now,
        },
      });
  }
}
