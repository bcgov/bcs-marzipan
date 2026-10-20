import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';

import { userNotificationPreferences, users } from '@corpcal/database/schema';
import {
  getNotificationPreferenceCategory,
  NOTIFICATION_PREFERENCE_CATEGORY_OPTIONS,
} from '@corpcal/shared';
import type {
  NotificationPreferences,
  NotificationPreferencesUpdate,
} from '@corpcal/shared/schemas';

import type { DrizzleDbExecutor } from '../database/database.provider';
import { DatabaseService } from '../database/database.service';

export interface NotificationChannelOptOuts {
  inApp: Set<number>;
  email: Set<number>;
}

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getForUser(userId: number): Promise<NotificationPreferences> {
    const db = this.databaseService.db;
    const [[userRow], rows] = await Promise.all([
      db
        .select({ enableEmailNotification: users.enableEmailNotification })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
      db
        .select({
          category: userNotificationPreferences.category,
          inAppEnabled: userNotificationPreferences.inAppEnabled,
          emailEnabled: userNotificationPreferences.emailEnabled,
        })
        .from(userNotificationPreferences)
        .where(eq(userNotificationPreferences.userId, userId)),
    ]);

    if (!userRow) {
      throw new NotFoundException('User not found');
    }

    const byCategory = new Map(rows.map((row) => [row.category, row]));
    return {
      emailEnabled: userRow.enableEmailNotification,
      categories: NOTIFICATION_PREFERENCE_CATEGORY_OPTIONS.map(
        ({ category }) => {
          const row = byCategory.get(category);
          return {
            category,
            inApp: row?.inAppEnabled ?? true,
            email: row?.emailEnabled ?? true,
          };
        }
      ),
    };
  }

  async updateForUser(
    userId: number,
    input: NotificationPreferencesUpdate
  ): Promise<NotificationPreferences> {
    await this.databaseService.db.transaction(async (tx) => {
      if (input.emailEnabled !== undefined) {
        const updated = await tx
          .update(users)
          .set({ enableEmailNotification: input.emailEnabled })
          .where(eq(users.id, userId))
          .returning({ id: users.id });
        if (updated.length === 0) {
          throw new NotFoundException('User not found');
        }
      }

      if (input.categories && input.categories.length > 0) {
        const now = new Date();
        await tx
          .insert(userNotificationPreferences)
          .values(
            input.categories.map((pref) => ({
              userId,
              category: pref.category,
              inAppEnabled: pref.inApp,
              emailEnabled: pref.email,
              updatedAt: now,
            }))
          )
          .onConflictDoUpdate({
            target: [
              userNotificationPreferences.userId,
              userNotificationPreferences.category,
            ],
            set: {
              inAppEnabled: sql`excluded.in_app_enabled`,
              emailEnabled: sql`excluded.email_enabled`,
              updatedAt: sql`excluded.updated_at`,
            },
          });
      }
    });

    return this.getForUser(userId);
  }

  /**
   * Returns the subset of `userIds` who opted out of the event's category,
   * per channel. Unmapped event types are never filtered.
   */
  async resolveOptOuts(
    eventType: string,
    userIds: number[],
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<NotificationChannelOptOuts> {
    const optOuts: NotificationChannelOptOuts = {
      inApp: new Set(),
      email: new Set(),
    };
    const category = getNotificationPreferenceCategory(eventType);
    if (!category || userIds.length === 0) {
      return optOuts;
    }

    const rows = await executor
      .select({
        userId: userNotificationPreferences.userId,
        inAppEnabled: userNotificationPreferences.inAppEnabled,
        emailEnabled: userNotificationPreferences.emailEnabled,
      })
      .from(userNotificationPreferences)
      .where(
        and(
          eq(userNotificationPreferences.category, category),
          inArray(userNotificationPreferences.userId, userIds)
        )
      );

    for (const row of rows) {
      if (!row.inAppEnabled) optOuts.inApp.add(row.userId);
      if (!row.emailEnabled) optOuts.email.add(row.userId);
    }
    return optOuts;
  }
}
