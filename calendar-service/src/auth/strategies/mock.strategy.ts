import { and, eq } from 'drizzle-orm';

import { users } from '@corpcal/database/schema';

import type { Database } from '../../database/database.provider';
import type { AuthDbUser } from './ad.strategy';

/**
 * Mock auth strategy: find user by ad_username
 * Used when AUTH_STRATEGY=mock for development without AD
 */
export async function findUserByUsername(
  db: Database,
  username: string
): Promise<AuthDbUser | null> {
  const [row] = await db
    .select({
      id: users.id,
      roleId: users.roleId,
      displayName: users.displayName,
      adUsername: users.adUsername,
      adDisplayName: users.adDisplayName,
      adEmail: users.adEmail,
      status: users.status,
    })
    .from(users)
    .where(and(eq(users.adUsername, username), eq(users.isActive, true)))
    .limit(1);

  return row ?? null;
}
