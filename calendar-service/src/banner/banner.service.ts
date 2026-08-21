import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';

import {
  bannerSettings,
  recurringLockoutBannerSettings,
} from '@corpcal/database/schema';
import { toPacificHourMinute } from '@corpcal/shared';
import type {
  BannerSettings,
  RecurringLockoutBannerSettings,
  UpsertBannerSettingsBody,
  UpsertRecurringLockoutBannerSettingsBody,
} from '@corpcal/shared/api/types';
import {
  DEFAULT_RECURRING_EDIT_LOCKOUT_BANNER_LEAD_MINUTES,
  DEFAULT_RECURRING_EDIT_LOCKOUT_EXEMPT_ROLE_IDS,
} from '@corpcal/shared/schemas';

import { ActivitiesGateway } from '../activities/activities.gateway';
import { DatabaseService } from '../database/database.service';

type BannerSettingsRow = typeof bannerSettings.$inferSelect;
type RecurringLockoutBannerSettingsRow =
  typeof recurringLockoutBannerSettings.$inferSelect;

@Injectable()
export class BannerService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly activitiesGateway: ActivitiesGateway
  ) {}

  async getCurrentRecurringLockoutBannerSettings(): Promise<RecurringLockoutBannerSettings | null> {
    const row = await this.getLatestRecurringLockoutBannerRow();
    return row ? this.mapRecurringLockoutRow(row) : null;
  }

  async getActiveRecurringLockoutBanner(): Promise<RecurringLockoutBannerSettings | null> {
    const row = await this.getLatestRecurringLockoutBannerRow();

    if (!row || !row.isActive) {
      return null;
    }

    const { hour, minute } = toPacificHourMinute(Date.now());
    const currentMinutes = hour * 60 + minute;
    const startMinutes = this.timeToMinutes(row.startTimeOfDay);
    const endMinutes = this.timeToMinutes(row.endTimeOfDay);
    const leadMinutes = Number.isInteger(row.bannerLeadMinutes)
      ? Math.max(0, Number(row.bannerLeadMinutes))
      : DEFAULT_RECURRING_EDIT_LOCKOUT_BANNER_LEAD_MINUTES;
    const minutesPerDay = 24 * 60;
    const bannerStartMinutes =
      (startMinutes - leadMinutes + minutesPerDay) % minutesPerDay;
    const inWindow =
      bannerStartMinutes > endMinutes
        ? currentMinutes >= bannerStartMinutes || currentMinutes < endMinutes
        : currentMinutes >= bannerStartMinutes && currentMinutes < endMinutes;

    if (!inWindow) {
      return null;
    }

    return this.mapRecurringLockoutRow(row);
  }

  async getCurrentBannerSettings(): Promise<BannerSettings | null> {
    const row = await this.getLatestBannerRow();
    return row ? this.mapRow(row) : null;
  }

  async getActiveBanner(): Promise<BannerSettings | null> {
    const row = await this.getLatestBannerRow();

    if (!row || !row.isActive) {
      return null;
    }

    const now = new Date();

    if (row.startDateTime && row.startDateTime > now) {
      return null;
    }

    if (row.endDateTime && row.endDateTime <= now) {
      return null;
    }

    return this.mapRow(row);
  }

  async upsertBannerSettings(
    body: UpsertBannerSettingsBody,
    userId: number
  ): Promise<BannerSettings> {
    const now = new Date();
    const payload = {
      isActive: body.isActive,
      content: body.content.trim(),
      backgroundColor: body.backgroundColor,
      textColor: body.textColor,
      variant: body.variant,
      isDismissible: body.isDismissible,
      dismissScope: body.dismissScope,
      startDateTime: body.startDateTime ? new Date(body.startDateTime) : null,
      endDateTime: body.endDateTime ? new Date(body.endDateTime) : null,
      lastUpdatedDateTime: now,
      lastUpdatedBy: userId,
    };

    const existing = await this.getLatestBannerRow();

    let result: BannerSettings;

    if (existing) {
      const [updated] = await this.databaseService.db
        .update(bannerSettings)
        .set(payload)
        .where(eq(bannerSettings.id, existing.id))
        .returning();

      result = this.mapRow(updated);
    } else {
      const [created] = await this.databaseService.db
        .insert(bannerSettings)
        .values({
          ...payload,
          createdDateTime: now,
          createdBy: userId,
        })
        .returning();

      result = this.mapRow(created);
    }

    setImmediate(() => {
      this.activitiesGateway.broadcastSystemBannerSettingsUpdated();
    });

    return result;
  }

  async upsertRecurringLockoutBannerSettings(
    body: UpsertRecurringLockoutBannerSettingsBody,
    userId: number
  ): Promise<RecurringLockoutBannerSettings> {
    const now = new Date();
    const payload = {
      isActive: body.isActive,
      exemptRoleIds: [...new Set(body.exemptRoleIds)],
      content: body.content.trim(),
      backgroundColor: body.backgroundColor,
      textColor: body.textColor,
      variant: body.variant,
      startTimeOfDay: body.startTimeOfDay,
      endTimeOfDay: body.endTimeOfDay,
      bannerLeadMinutes: body.bannerLeadMinutes,
      lastUpdatedDateTime: now,
      lastUpdatedBy: userId,
    };

    const existing = await this.getLatestRecurringLockoutBannerRow();

    let result: RecurringLockoutBannerSettings;

    if (existing) {
      const [updated] = await this.databaseService.db
        .update(recurringLockoutBannerSettings)
        .set(payload)
        .where(eq(recurringLockoutBannerSettings.id, existing.id))
        .returning();

      result = this.mapRecurringLockoutRow(updated);
    } else {
      const [created] = await this.databaseService.db
        .insert(recurringLockoutBannerSettings)
        .values({
          ...payload,
          createdDateTime: now,
          createdBy: userId,
        })
        .returning();

      result = this.mapRecurringLockoutRow(created);
    }

    setImmediate(() => {
      this.activitiesGateway.broadcastRecurringLockoutBannerSettingsUpdated();
    });

    return result;
  }

  private async getLatestBannerRow(): Promise<BannerSettingsRow | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(bannerSettings)
      .orderBy(
        desc(bannerSettings.lastUpdatedDateTime),
        desc(bannerSettings.id)
      )
      .limit(1);

    return row ?? null;
  }

  private async getLatestRecurringLockoutBannerRow(): Promise<RecurringLockoutBannerSettingsRow | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(recurringLockoutBannerSettings)
      .orderBy(
        desc(recurringLockoutBannerSettings.lastUpdatedDateTime),
        desc(recurringLockoutBannerSettings.id)
      )
      .limit(1);

    return row ?? null;
  }

  private timeToMinutes(timeOfDay: string): number {
    const [hour, minute] = timeOfDay.split(':').map(Number);
    return hour * 60 + minute;
  }

  private mapRow(row: BannerSettingsRow): BannerSettings {
    const allowedVariants = ['info', 'warning', 'success'] as const;
    const allowedDismissScopes = ['persistent', 'session'] as const;

    const variant =
      typeof row.variant === 'string' &&
      (allowedVariants as readonly string[]).includes(row.variant)
        ? (row.variant as BannerSettings['variant'])
        : 'info';

    const dismissScope =
      typeof row.dismissScope === 'string' &&
      (allowedDismissScopes as readonly string[]).includes(row.dismissScope)
        ? (row.dismissScope as BannerSettings['dismissScope'])
        : 'persistent';

    return {
      id: row.id,
      isActive: row.isActive,
      content: row.content,
      backgroundColor: row.backgroundColor,
      variant,
      textColor: row.textColor,
      dismissScope,
      isDismissible: row.isDismissible,
      startDateTime: row.startDateTime?.toISOString() ?? null,
      endDateTime: row.endDateTime?.toISOString() ?? null,
      createdDateTime: row.createdDateTime.toISOString(),
      lastUpdatedDateTime: row.lastUpdatedDateTime.toISOString(),
    };
  }

  private mapRecurringLockoutRow(
    row: RecurringLockoutBannerSettingsRow
  ): RecurringLockoutBannerSettings {
    const allowedVariants = ['info', 'warning', 'success'] as const;

    const variant =
      typeof row.variant === 'string' &&
      (allowedVariants as readonly string[]).includes(row.variant)
        ? (row.variant as RecurringLockoutBannerSettings['variant'])
        : 'warning';

    return {
      id: row.id,
      isActive: row.isActive,
      exemptRoleIds: Array.isArray(row.exemptRoleIds)
        ? row.exemptRoleIds
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0)
        : [...DEFAULT_RECURRING_EDIT_LOCKOUT_EXEMPT_ROLE_IDS],
      content: row.content,
      backgroundColor: row.backgroundColor,
      textColor: row.textColor,
      variant,
      startTimeOfDay: row.startTimeOfDay,
      endTimeOfDay: row.endTimeOfDay,
      bannerLeadMinutes: Number.isInteger(row.bannerLeadMinutes)
        ? Math.max(0, Number(row.bannerLeadMinutes))
        : DEFAULT_RECURRING_EDIT_LOCKOUT_BANNER_LEAD_MINUTES,
      createdDateTime: row.createdDateTime.toISOString(),
      lastUpdatedDateTime: row.lastUpdatedDateTime.toISOString(),
    };
  }
}
