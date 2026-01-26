import { eq, and } from 'drizzle-orm';
import { users } from '@corpcal/database/schema';
import type { Database } from '../../database/database.provider';

/**
 * Mock auth strategy: find user by ad_username
 * Used when AUTH_STRATEGY=mock for development without AD
 */
export async function findUserByUsername(
  db: Database,
  username: string
): Promise<{
  id: number;
  roleId: number;
  adUsername: string | null;
  adDisplayName: string | null;
  adEmail: string | null;
} | null> {
  const [row] = await db
    .select({
      id: users.id,
      roleId: users.roleId,
      adUsername: users.adUsername,
      adDisplayName: users.adDisplayName,
      adEmail: users.adEmail,
    })
    .from(users)
    .where(and(eq(users.adUsername, username), eq(users.isActive, true)))
    .limit(1);

  return row ?? null;
}
