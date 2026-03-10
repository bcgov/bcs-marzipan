import { and, eq, sql } from 'drizzle-orm';

import { users } from '@corpcal/database/schema';

import type { Database } from '../../database/database.provider';

export interface AuthDbUser {
  id: number;
  roleId: number;
  adUsername: string | null;
  adDisplayName: string | null;
  adEmail: string | null;
}

const authUserSelection = {
  id: users.id,
  roleId: users.roleId,
  adUsername: users.adUsername,
  adDisplayName: users.adDisplayName,
  adEmail: users.adEmail,
};

export async function findUserByExternalId(
  db: Database,
  externalId: string
): Promise<AuthDbUser | null> {
  const [row] = await db
    .select(authUserSelection)
    .from(users)
    .where(and(eq(users.externalId, externalId), eq(users.isActive, true)))
    .limit(1);

  return row ?? null;
}

export async function findUserByEmail(
  db: Database,
  email: string
): Promise<AuthDbUser | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const [row] = await db
    .select(authUserSelection)
    .from(users)
    .where(
      and(
        sql`lower(${users.adEmail}) = ${normalizedEmail}`,
        eq(users.isActive, true)
      )
    )
    .limit(1);

  return row ?? null;
}

export async function syncAzureIdentity(
  db: Database,
  userId: number,
  identity: {
    externalId: string;
    username?: string;
    displayName?: string;
    email?: string;
  }
): Promise<void> {
  await db
    .update(users)
    .set({
      externalId: identity.externalId,
      adUsername: identity.username?.trim() || null,
      adDisplayName: identity.displayName?.trim() || null,
      adEmail: identity.email?.trim().toLowerCase() || null,
      lastLoginDateTime: new Date(),
      lastUpdatedDateTime: new Date(),
    })
    .where(eq(users.id, userId));
}
