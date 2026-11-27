import { inArray } from 'drizzle-orm';

import { userSettings } from '@corpcal/database/schema';
import { coerceUserColourKey, type UserColourKey } from '@corpcal/shared';

import type { DatabaseService } from '../database/database.service';

export async function loadUserColourKeysByIds(
  db: DatabaseService['db'],
  userIds: number[]
): Promise<Map<number, UserColourKey>> {
  const unique = [...new Set(userIds.filter((id) => id > 0))];
  const map = new Map<number, UserColourKey>();
  if (unique.length === 0) {
    return map;
  }

  const rows = await db
    .select({
      userId: userSettings.userId,
      userColourKey: userSettings.userColourKey,
    })
    .from(userSettings)
    .where(inArray(userSettings.userId, unique));

  const byUserId = new Map(rows.map((r) => [r.userId, r.userColourKey]));

  for (const id of unique) {
    map.set(id, coerceUserColourKey(byUserId.get(id), id));
  }

  return map;
}
