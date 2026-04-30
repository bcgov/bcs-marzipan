import { and, eq, sql } from 'drizzle-orm';

import { users } from '@corpcal/database/schema';

import type { Database } from '../../database/database.provider';
import type { AuthDbUser } from './ad.strategy';

export interface LocalAuthDbUser extends AuthDbUser {
  passwordHash: string | null;
  status: string;
  isActive: boolean;
}

/**
 * Local auth strategy: find user by email (case-insensitive).
 * Returns password hash and status along with standard auth fields.
 */
export async function findUserByEmailLocal(
  db: Database,
  email: string
): Promise<LocalAuthDbUser | null> {
  const normalized = email.trim().toLowerCase();

  const [row] = await db
    .select({
      id: users.id,
      roleId: users.roleId,
      adUsername: users.adUsername,
      adDisplayName: users.adDisplayName,
      adEmail: users.adEmail,
      passwordHash: users.passwordHash,
      status: users.status,
      isActive: users.isActive,
    })
    .from(users)
    .where(sql`lower(${users.adEmail}) = ${normalized}`)
    .limit(1);

  return row ?? null;
}

/**
 * Find a user by ID for auth purposes (used in change-password forced-reset path).
 */
export async function findUserByIdLocal(
  db: Database,
  userId: number
): Promise<LocalAuthDbUser | null> {
  const [row] = await db
    .select({
      id: users.id,
      roleId: users.roleId,
      adUsername: users.adUsername,
      adDisplayName: users.adDisplayName,
      adEmail: users.adEmail,
      passwordHash: users.passwordHash,
      status: users.status,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row ?? null;
}

/**
 * Update a user's password hash and status in-place.
 */
export async function updateUserPassword(
  db: Database,
  userId: number,
  passwordHash: string,
  newStatus: string = 'active'
): Promise<void> {
  await db
    .update(users)
    .set({
      passwordHash,
      status: newStatus,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
      lastUpdatedDateTime: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * Update only the status of a user (e.g. when admin triggers a reset).
 */
export async function updateUserStatus(
  db: Database,
  userId: number,
  status: string
): Promise<void> {
  await db
    .update(users)
    .set({ status, lastUpdatedDateTime: new Date() })
    .where(and(eq(users.id, userId)));
}
