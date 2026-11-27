import { and, eq, sql } from 'drizzle-orm';

import { users } from '@corpcal/database/schema';

import type {
  Database,
  DrizzleDbExecutor,
} from '../../database/database.provider';

export interface AuthDbUser {
  id: number;
  roleId: number;
  displayName: string | null;
  adUsername: string | null;
  adDisplayName: string | null;
  adEmail: string | null;
  status: string;
}

export interface AuthDbUserWithActive extends AuthDbUser {
  isActive: boolean;
}

const authUserSelection = {
  id: users.id,
  roleId: users.roleId,
  displayName: users.displayName,
  adUsername: users.adUsername,
  adDisplayName: users.adDisplayName,
  adEmail: users.adEmail,
  status: users.status,
};

const authUserWithActiveSelection = {
  ...authUserSelection,
  isActive: users.isActive,
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

export async function findUserByExternalIdAnyStatus(
  db: Database,
  externalId: string
): Promise<AuthDbUserWithActive | null> {
  const [row] = await db
    .select(authUserWithActiveSelection)
    .from(users)
    .where(eq(users.externalId, externalId))
    .limit(1);

  return row ?? null;
}

export async function findAuthUserById(
  db: Database,
  userId: number
): Promise<AuthDbUser | null> {
  const [row] = await db
    .select(authUserSelection)
    .from(users)
    .where(eq(users.id, userId))
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

export async function findUserByEmailAnyStatus(
  db: Database,
  email: string
): Promise<AuthDbUserWithActive | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const [row] = await db
    .select(authUserWithActiveSelection)
    .from(users)
    .where(sql`lower(${users.adEmail}) = ${normalizedEmail}`)
    .limit(1);

  return row ?? null;
}

export async function syncAzureIdentity(
  db: DrizzleDbExecutor,
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
