import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';

import { bannerSettings } from '@corpcal/database';
import type {
  BannerSettings,
  UpsertBannerSettingsBody,
} from '@corpcal/shared/schemas';

import { DatabaseService } from '../database/database.service';

type BannerSettingsRow = typeof bannerSettings.$inferSelect;

@Injectable()
export class BannerService {
  constructor(private readonly databaseService: DatabaseService) {}

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
      isDismissible: body.isDismissible,
      startDateTime: body.startDateTime ? new Date(body.startDateTime) : null,
      endDateTime: body.endDateTime ? new Date(body.endDateTime) : null,
      lastUpdatedDateTime: now,
      lastUpdatedBy: userId,
    };

    const existing = await this.getLatestBannerRow();

    if (existing) {
      const [updated] = await this.databaseService.db
        .update(bannerSettings)
        .set(payload)
        .where(eq(bannerSettings.id, existing.id))
        .returning();

      return this.mapRow(updated);
    }

    const [created] = await this.databaseService.db
      .insert(bannerSettings)
      .values({
        ...payload,
        createdDateTime: now,
        createdBy: userId,
      })
      .returning();

    return this.mapRow(created);
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

  private mapRow(row: BannerSettingsRow): BannerSettings {
    return {
      id: row.id,
      isActive: row.isActive,
      content: row.content,
      backgroundColor: row.backgroundColor,
      textColor: row.textColor,
      isDismissible: row.isDismissible,
      startDateTime: row.startDateTime?.toISOString() ?? null,
      endDateTime: row.endDateTime?.toISOString() ?? null,
      createdDateTime: row.createdDateTime.toISOString(),
      lastUpdatedDateTime: row.lastUpdatedDateTime.toISOString(),
    };
  }
}
