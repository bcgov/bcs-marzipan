import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { and, eq, gt, lt } from 'drizzle-orm';

import { recordLocks } from '@corpcal/database/schema';
import type { RecordLock } from '@corpcal/database/schema';

import { DatabaseService } from '../database/database.service';

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
  ): Promise<RecordLock> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_TTL_MINUTES * 60 * 1000);

    const existing = await this.databaseService.db.query.recordLocks.findFirst({
      where: and(
        eq(recordLocks.entityType, entityType),
        eq(recordLocks.entityId, entityId)
      ),
    });

    if (existing) {
      const expired = new Date(existing.expiresAt) < now;
      if (expired) {
        await this.databaseService.db
          .delete(recordLocks)
          .where(eq(recordLocks.id, existing.id));
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
          .update(recordLocks)
          .set({
            expiresAt,
            lastRenewedAt: now,
            sessionId: sessionId ?? existing.sessionId,
          })
          .where(eq(recordLocks.id, existing.id))
          .returning();
        return updated as RecordLock;
      }
    }

    const [inserted] = await this.databaseService.db
      .insert(recordLocks)
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
      throw new Error('Failed to insert lock');
    }
    return inserted as RecordLock;
  }

  async getLockForEntity(
    entityType: string,
    entityId: number
  ): Promise<RecordLock | null> {
    const now = new Date();
    const row = await this.databaseService.db.query.recordLocks.findFirst({
      where: and(
        eq(recordLocks.entityType, entityType),
        eq(recordLocks.entityId, entityId),
        gt(recordLocks.expiresAt, now)
      ),
    });
    return row as RecordLock | null;
  }

  async releaseLock(lockId: number, userId: number): Promise<boolean> {
    const result = await this.databaseService.db
      .delete(recordLocks)
      .where(and(eq(recordLocks.id, lockId), eq(recordLocks.userId, userId)))
      .returning({ id: recordLocks.id });
    return result.length > 0;
  }

  async cleanupExpiredLocks(): Promise<number> {
    const now = new Date();
    const result = await this.databaseService.db
      .delete(recordLocks)
      .where(lt(recordLocks.expiresAt, now))
      .returning({ id: recordLocks.id });
    this.logger.debug(`Cleaned up ${result.length} expired lock(s)`);
    return result.length;
  }
}
