import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';

import { loginModalSettings } from '@corpcal/database';
import type {
  LoginModalSettings,
  UpsertLoginModalSettingsBody,
} from '@corpcal/shared/schemas';

import { ActivitiesGateway } from '../activities/activities.gateway';
import { DatabaseService } from '../database/database.service';

type LoginModalSettingsRow = typeof loginModalSettings.$inferSelect;

@Injectable()
export class LoginModalService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly activitiesGateway: ActivitiesGateway
  ) {}

  async getCurrentSettings(): Promise<LoginModalSettings | null> {
    const row = await this.getLatestRow();
    return row ? this.mapRow(row) : null;
  }

  async getActive(): Promise<LoginModalSettings | null> {
    const row = await this.getLatestRow();

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

  async upsert(
    body: UpsertLoginModalSettingsBody,
    userId: number
  ): Promise<LoginModalSettings> {
    const now = new Date();
    const payload = {
      isActive: body.isActive,
      title: body.title.trim(),
      content: body.content.trim(),
      startDateTime: body.startDateTime ? new Date(body.startDateTime) : null,
      endDateTime: body.endDateTime ? new Date(body.endDateTime) : null,
      lastUpdatedDateTime: now,
      lastUpdatedBy: userId,
    };

    const existing = await this.getLatestRow();

    let result: LoginModalSettings;

    if (existing) {
      const [updated] = await this.databaseService.db
        .update(loginModalSettings)
        .set(payload)
        .where(eq(loginModalSettings.id, existing.id))
        .returning();

      result = this.mapRow(updated);
    } else {
      const [created] = await this.databaseService.db
        .insert(loginModalSettings)
        .values({
          ...payload,
          createdDateTime: now,
          createdBy: userId,
        })
        .returning();

      result = this.mapRow(created);
    }

    setImmediate(() => {
      this.activitiesGateway.broadcastLoginModalSettingsUpdated();
    });

    return result;
  }

  private async getLatestRow(): Promise<LoginModalSettingsRow | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(loginModalSettings)
      .orderBy(
        desc(loginModalSettings.lastUpdatedDateTime),
        desc(loginModalSettings.id)
      )
      .limit(1);

    return row ?? null;
  }

  private mapRow(row: LoginModalSettingsRow): LoginModalSettings {
    return {
      id: row.id,
      isActive: row.isActive,
      title: row.title,
      content: row.content,
      startDateTime: row.startDateTime?.toISOString() ?? null,
      endDateTime: row.endDateTime?.toISOString() ?? null,
      createdDateTime: row.createdDateTime.toISOString(),
      lastUpdatedDateTime: row.lastUpdatedDateTime.toISOString(),
    };
  }
}
