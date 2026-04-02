import {
  ConflictException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { and, asc, eq, gt, lt, lte, or } from 'drizzle-orm';

import {
  editLockPendingHandoffs,
  editLocks,
  users,
} from '@corpcal/database/schema';

import { ActivitiesGateway } from '../activities/activities.gateway';
import { DatabaseService } from '../database/database.service';
import { ApplicationSettingsService } from './application-settings.service';

type EditLockRow = typeof editLocks.$inferSelect;

const LOCK_TTL_MINUTES = 5;
const HANDOFF_GRACE_SECONDS = 30;
/** Minimum interval between heartbeat DB updates (per lock). */
const HEARTBEAT_MIN_INTERVAL_MS = 30_000;

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
  lastActivityAt: Date;
  idleExpiresAt: Date;
}

@Injectable()
export class LocksService {
  private readonly logger = new Logger(LocksService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly applicationSettings: ApplicationSettingsService,
    @Inject(forwardRef(() => ActivitiesGateway))
    private readonly activitiesGateway: ActivitiesGateway
  ) {}

  private async idleDeadlineFrom(now: Date): Promise<Date> {
    const minutes =
      await this.applicationSettings.getEditLockIdleTimeoutMinutes();
    return new Date(now.getTime() + minutes * 60 * 1000);
  }

  private async getLockUsernameForUserId(userId: number): Promise<string> {
    const [row] = await this.databaseService.db
      .select({
        adDisplayName: users.adDisplayName,
        adUsername: users.adUsername,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!row) return `User ${userId}`;
    return (
      row.adDisplayName?.trim() || row.adUsername?.trim() || `User ${userId}`
    );
  }

  private rowToLockForEntity(row: EditLockRow): LockForEntity {
    return {
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      userId: row.userId,
      username: row.username,
      sessionId: row.sessionId,
      acquiredAt: row.acquiredAt,
      expiresAt: row.expiresAt,
      lastRenewedAt: row.lastRenewedAt,
      lastActivityAt: row.lastActivityAt,
      idleExpiresAt: row.idleExpiresAt,
    };
  }

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
    const idleExpiresAt = await this.idleDeadlineFrom(now);

    const existing = await this.databaseService.db.query.editLocks.findFirst({
      where: and(
        eq(editLocks.entityType, entityType),
        eq(editLocks.entityId, entityId)
      ),
    });

    if (existing) {
      const expiresAtDate =
        existing.expiresAt instanceof Date
          ? existing.expiresAt
          : new Date(existing.expiresAt as string | number);
      const idleExpiresAtDate =
        existing.idleExpiresAt instanceof Date
          ? existing.idleExpiresAt
          : new Date(existing.idleExpiresAt as string | number);
      const expiredLease = expiresAtDate < now;
      const expiredIdle = idleExpiresAtDate < now;
      if (expiredLease || expiredIdle) {
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
            lastActivityAt: now,
            idleExpiresAt,
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
        lastActivityAt: now,
        idleExpiresAt,
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
    const row = await this.databaseService.db.query.editLocks.findFirst({
      where: and(
        eq(editLocks.entityType, entityType),
        eq(editLocks.entityId, entityId),
        gt(editLocks.expiresAt, now),
        gt(editLocks.idleExpiresAt, now)
      ),
    });
    return row ? this.rowToLockForEntity(row as EditLockRow) : null;
  }

  async getLockById(lockId: number): Promise<LockForEntity | null> {
    const now = new Date();
    const row = await this.databaseService.db.query.editLocks.findFirst({
      where: and(
        eq(editLocks.id, lockId),
        gt(editLocks.expiresAt, now),
        gt(editLocks.idleExpiresAt, now)
      ),
    });
    return row ? this.rowToLockForEntity(row as EditLockRow) : null;
  }

  /**
   * Deletes the lock if it exists and belongs to the user.
   * Returns the removed row (for notifications) or null if nothing was deleted.
   */
  async releaseLock(
    lockId: number,
    userId: number
  ): Promise<LockForEntity | null> {
    const result = await this.databaseService.db
      .delete(editLocks)
      .where(and(eq(editLocks.id, lockId), eq(editLocks.userId, userId)))
      .returning();
    if (result.length === 0) return null;
    return this.rowToLockForEntity(result[0]);
  }

  async cleanupExpiredLocks(): Promise<number> {
    const now = new Date();
    const result = await this.databaseService.db
      .delete(editLocks)
      .where(or(lt(editLocks.expiresAt, now), lt(editLocks.idleExpiresAt, now)))
      .returning({ id: editLocks.id, entityId: editLocks.entityId });
    for (const row of result) {
      if (row.entityId != null) {
        this.activitiesGateway.notifyLockReleased(row.entityId);
      }
    }
    this.logger.debug(`Cleaned up ${result.length} expired lock(s)`);
    return result.length;
  }

  /**
   * Heartbeat: extends idle deadline. Throttled server-side.
   */
  async heartbeatLock(
    lockId: number,
    userId: number
  ): Promise<{
    serverTime: string;
    idleExpiresAt: string;
    throttled: boolean;
  }> {
    const now = new Date();
    const row = await this.databaseService.db.query.editLocks.findFirst({
      where: and(eq(editLocks.id, lockId), eq(editLocks.userId, userId)),
    });
    if (!row) {
      throw new HttpException('Lock not found', HttpStatus.NOT_FOUND);
    }
    const expiresAtDate =
      row.expiresAt instanceof Date
        ? row.expiresAt
        : new Date(row.expiresAt as string | number);
    const idleExpiresAtDate =
      row.idleExpiresAt instanceof Date
        ? row.idleExpiresAt
        : new Date(row.idleExpiresAt as string | number);
    if (expiresAtDate < now || idleExpiresAtDate < now) {
      throw new HttpException('Lock expired', HttpStatus.GONE);
    }

    const lastRenewed =
      row.lastRenewedAt instanceof Date
        ? row.lastRenewedAt
        : new Date(row.lastRenewedAt as string | number);
    const elapsed = now.getTime() - lastRenewed.getTime();
    if (elapsed < HEARTBEAT_MIN_INTERVAL_MS) {
      return {
        serverTime: now.toISOString(),
        idleExpiresAt: idleExpiresAtDate.toISOString(),
        throttled: true,
      };
    }

    const newIdleExpires = await this.idleDeadlineFrom(now);
    const newExpiresAt = new Date(now.getTime() + LOCK_TTL_MINUTES * 60 * 1000);

    const [updated] = await this.databaseService.db
      .update(editLocks)
      .set({
        lastActivityAt: now,
        idleExpiresAt: newIdleExpires,
        lastRenewedAt: now,
        expiresAt: newExpiresAt,
      })
      .where(eq(editLocks.id, lockId))
      .returning();

    const idle = updated?.idleExpiresAt
      ? new Date(updated.idleExpiresAt)
      : newIdleExpires;
    return {
      serverTime: now.toISOString(),
      idleExpiresAt: idle.toISOString(),
      throttled: false,
    };
  }

  /**
   * Admin requests taking the lock from the current holder.
   */
  async requestForceHandoff(
    activityId: number,
    requesterUserId: number,
    requesterDisplayName: string
  ): Promise<{
    graceEndsAt: string;
    pendingHandoffId: number;
  }> {
    const lock = await this.getLockForEntity('activity', activityId);
    if (!lock) {
      throw new ConflictException('No active lock on this activity.');
    }
    if (lock.userId === requesterUserId) {
      throw new ConflictException('You already hold this lock.');
    }

    const [dup] = await this.databaseService.db
      .select({ id: editLockPendingHandoffs.id })
      .from(editLockPendingHandoffs)
      .where(
        and(
          eq(editLockPendingHandoffs.activityId, activityId),
          eq(editLockPendingHandoffs.status, 'pending')
        )
      )
      .limit(1);
    if (dup) {
      throw new ConflictException(
        'A lock transfer is already pending for this activity.'
      );
    }

    const graceEndsAt = new Date(Date.now() + HANDOFF_GRACE_SECONDS * 1000);

    const [inserted] = await this.databaseService.db
      .insert(editLockPendingHandoffs)
      .values({
        activityId,
        fromUserId: lock.userId,
        toUserId: requesterUserId,
        graceEndsAt,
        status: 'pending',
      })
      .returning();

    if (!inserted) {
      throw new HttpException(
        'Failed to create handoff request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    const holderName = lock.username;
    const iso = graceEndsAt.toISOString();

    this.activitiesGateway.notifyLockHandoffPending(lock.userId, {
      activityId,
      graceEndsAt: iso,
      counterpartUsername: requesterDisplayName,
      role: 'holder',
    });
    this.activitiesGateway.notifyLockHandoffPending(requesterUserId, {
      activityId,
      graceEndsAt: iso,
      counterpartUsername: holderName,
      role: 'requester',
    });

    return {
      graceEndsAt: iso,
      pendingHandoffId: inserted.id,
    };
  }

  /**
   * After a successful PATCH by the holder, transfer lock to admin if a handoff was pending.
   */
  async completeHandoffAfterHolderSaveIfPending(
    activityId: number,
    holderUserId: number
  ): Promise<void> {
    const [claimed] = await this.databaseService.db
      .update(editLockPendingHandoffs)
      .set({ status: 'processing' })
      .where(
        and(
          eq(editLockPendingHandoffs.activityId, activityId),
          eq(editLockPendingHandoffs.fromUserId, holderUserId),
          eq(editLockPendingHandoffs.status, 'pending')
        )
      )
      .returning();
    if (!claimed) return;

    await this.finalizeHandoffTransfer(claimed.id);
  }

  /**
   * Poller: process one due pending handoff (SKIP LOCKED inside transaction).
   */
  async processDueHandoffsOnce(): Promise<number> {
    const now = new Date();
    try {
      return await this.databaseService.db.transaction(async (tx) => {
        const due = await tx
          .select()
          .from(editLockPendingHandoffs)
          .where(
            and(
              eq(editLockPendingHandoffs.status, 'pending'),
              lte(editLockPendingHandoffs.graceEndsAt, now)
            )
          )
          .orderBy(asc(editLockPendingHandoffs.id))
          .limit(1)
          .for('update', { skipLocked: true });

        const row = due[0];
        if (!row) return 0;

        await tx
          .update(editLockPendingHandoffs)
          .set({ status: 'processing' })
          .where(eq(editLockPendingHandoffs.id, row.id));

        await this.finalizeHandoffTransferInTransaction(tx, row.id);
        return 1;
      });
    } catch (err) {
      this.logger.error(
        'processDueHandoffsOnce failed',
        err instanceof Error ? err.stack : String(err)
      );
      return 0;
    }
  }

  /**
   * Runs transfer + WS after claim (pending row is already `processing`).
   */
  private async finalizeHandoffTransfer(
    pendingHandoffId: number
  ): Promise<void> {
    await this.databaseService.db.transaction(async (tx) => {
      await this.finalizeHandoffTransferInTransaction(tx, pendingHandoffId);
    });
  }

  private async finalizeHandoffTransferInTransaction(
    tx: any,
    pendingHandoffId: number
  ): Promise<void> {
    const [pending] = await tx
      .select()
      .from(editLockPendingHandoffs)
      .where(eq(editLockPendingHandoffs.id, pendingHandoffId))
      .limit(1);
    if (!pending || pending.status !== 'processing') {
      return;
    }

    const activityId = pending.activityId;
    const fromUserId = pending.fromUserId;
    const toUserId = pending.toUserId;

    const [lock] = await tx
      .select()
      .from(editLocks)
      .where(
        and(
          eq(editLocks.entityType, 'activity'),
          eq(editLocks.entityId, activityId)
        )!
      )
      .limit(1);

    if (!lock || lock.userId !== fromUserId) {
      await tx
        .update(editLockPendingHandoffs)
        .set({ status: 'cancelled' })
        .where(eq(editLockPendingHandoffs.id, pendingHandoffId));
      return;
    }

    const toUsername = await this.getLockUsernameForUserId(toUserId);
    const tNow = new Date();
    const idleExpiresAt = await this.idleDeadlineFrom(tNow);
    const expiresAt = new Date(tNow.getTime() + LOCK_TTL_MINUTES * 60 * 1000);

    await tx.delete(editLocks).where(eq(editLocks.id, lock.id));
    await tx.insert(editLocks).values({
      entityType: 'activity',
      entityId: activityId,
      userId: toUserId,
      username: toUsername,
      sessionId: lock.sessionId,
      acquiredAt: tNow,
      expiresAt,
      lastRenewedAt: tNow,
      lastActivityAt: tNow,
      idleExpiresAt,
    });
    await tx
      .update(editLockPendingHandoffs)
      .set({ status: 'completed' })
      .where(eq(editLockPendingHandoffs.id, pendingHandoffId));

    setImmediate(() => {
      try {
        this.activitiesGateway.notifyLockReleased(activityId);
        this.activitiesGateway.notifyLockAcquired(activityId, {
          userId: toUserId,
          username: toUsername,
        });
      } catch (e) {
        this.logger.error(
          'notify after handoff failed',
          e instanceof Error ? e.stack : String(e)
        );
      }
    });

    this.logger.log(
      `Handoff completed activityId=${activityId} toUserId=${toUserId}`
    );
  }
}
