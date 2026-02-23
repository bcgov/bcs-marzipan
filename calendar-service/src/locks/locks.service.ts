import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { and, eq, gt, lt } from 'drizzle-orm';

import { editLocks } from '@corpcal/database/schema';

import { DatabaseService } from '../database/database.service';

type EditLockRow = typeof editLocks.$inferSelect;

/** Explicit lock row shape for return types to avoid schema inference issues in consumers */
export interface LockForEntity {
  id: number;
  entityType: string;
  entityId: number;
  userId: number;
  username: string;
  sessionId: string | null;
  acquiredAt: Date;
  expiresAt: Date;
  lastRenewedAt: Date;
}

const LOCK_TTL_MINUTES = 5;

@Injectable()
export class LocksService {
  private readonly logger = new Logger(LocksService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Try to acquire a lock for the given entity. Returns the lock on success.
   * Throws ConflictException (423) if already locked by another user.
   */
  async tryAcquireLock(
    entityType: string,
    entityId: number,
    userId: number,
    username: string,
    sessionId?: string
  ): Promise<EditLockRow> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_TTL_MINUTES * 60 * 1000);

    let existing: EditLockRow | undefined;
    try {
      existing = await this.databaseService.db.query.editLocks.findFirst({
        where: and(
          eq(editLocks.entityType, entityType),
          eq(editLocks.entityId, entityId)
        ),
      });
    } catch (err: unknown) {
      throw err;
    }

    if (existing) {
      const expiresAtDate =
        existing.expiresAt instanceof Date
          ? existing.expiresAt
          : new Date(existing.expiresAt as string | number);
      const expired = expiresAtDate < now;
      if (expired) {
        await this.databaseService.db
          .delete(editLocks)
          .where(eq(editLocks.id, existing.id));
      } else if (existing.userId !== userId) {
        throw new HttpException(
          {
            statusCode: HttpStatus.LOCKED,
            message: 'This activity is being edited by another user.',
            locked: true,
            lockedBy: {
              userId: existing.userId,
              username: existing.username,
              acquiredAt: existing.acquiredAt,
              expiresAt: existing.expiresAt,
            },
          },
          HttpStatus.LOCKED
        );
      } else {
        const [updated] = await this.databaseService.db
          .update(editLocks)
          .set({
            expiresAt,
            lastRenewedAt: now,
            sessionId: sessionId ?? existing.sessionId,
          })
          .where(eq(editLocks.id, existing.id))
          .returning();
        return updated;
      }
    }

    const [inserted] = await this.databaseService.db
      .insert(editLocks)
      .values({
        entityType,
        entityId,
        userId,
        username,
        sessionId: sessionId ?? null,
        acquiredAt: now,
        expiresAt,
        lastRenewedAt: now,
      })
      .returning();

    if (!inserted) {
      this.logger.error(
        `Lock insert returned no row for ${entityType} id=${entityId} userId=${userId}`
      );
      throw new HttpException(
        `Failed to insert lock for ${entityType} ${entityId}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
    return inserted;
  }

  async getLockForEntity(
    entityType: string,
    entityId: number
  ): Promise<LockForEntity | null> {
    const now = new Date();
    let row: EditLockRow | undefined;
    try {
      row = await this.databaseService.db.query.editLocks.findFirst({
        where: and(
          eq(editLocks.entityType, entityType),
          eq(editLocks.entityId, entityId),
          gt(editLocks.expiresAt, now)
        ),
      });
    } catch (err: unknown) {
      throw err;
    }
    return (row ?? null) as LockForEntity | null;
  }

  async releaseLock(lockId: number, userId: number): Promise<boolean> {
    const result = await this.databaseService.db
      .delete(editLocks)
      .where(and(eq(editLocks.id, lockId), eq(editLocks.userId, userId)))
      .returning({ id: editLocks.id });
    return result.length > 0;
  }

  async cleanupExpiredLocks(): Promise<number> {
    const now = new Date();
    const result = await this.databaseService.db
      .delete(editLocks)
      .where(lt(editLocks.expiresAt, now))
      .returning({ id: editLocks.id });
    this.logger.debug(`Cleaned up ${result.length} expired lock(s)`);
    return result.length;
  }
}
