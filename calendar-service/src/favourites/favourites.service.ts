import { Injectable } from '@nestjs/common';

import { and, eq, schema } from '@corpcal/database';

import { AppLogger } from '../common/logger/logger.service';
import { DatabaseService } from '../database/database.service';

const { userActivityFavourites } = schema;

@Injectable()
export class FavouritesService {
  private readonly logger = new AppLogger(FavouritesService.name);

  constructor(private readonly db: DatabaseService) {}

  async list(userId: number): Promise<number[]> {
    const rows = await this.db.db
      .select({ activityId: userActivityFavourites.activityId })
      .from(userActivityFavourites)
      .where(eq(userActivityFavourites.userId, userId));

    return rows.map((r) => r.activityId);
  }

  async add(userId: number, activityId: number): Promise<void> {
    await this.db.db
      .insert(userActivityFavourites)
      .values({ userId, activityId })
      .onConflictDoNothing();
  }

  async remove(userId: number, activityId: number): Promise<void> {
    await this.db.db
      .delete(userActivityFavourites)
      .where(
        and(
          eq(userActivityFavourites.userId, userId),
          eq(userActivityFavourites.activityId, activityId)
        )
      );
  }
}
