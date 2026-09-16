import {
  ConflictException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, gt, lt, lte, or, sql } from 'drizzle-orm';

import {
  editLockPendingHandoffs,
  editLocks,
  users,
} from '@corpcal/database/schema';

import { ActivitiesGateway } from '../activities/activities.gateway';
import type {
  Database,
  DrizzleDbExecutor,
} from '../database/database.provider';
import { DatabaseService } from '../database/database.service';
import { ApplicationSettingsService } from './application-settings.service';
import { LockHandoffDeadlineKickService } from './lock-handoff-deadline-kick.service';

type DbTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];

type EditLockRow = typeof editLocks.$inferSelect;

function isPostgresUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  let depth = 0;
  while (current != null && depth < 5) {
    const code = (current as { code?: string }).code;
    if (code === '23505') return true;
    current = (current as { cause?: unknown }).cause;
    depth += 1;
  }
  return false;
}

const LOCK_TTL_MINUTES = 5;
const HANDOFF_GRACE_SECONDS = 30;
/** Minimum interval between heartbeat DB updates (per lock). */
const HEARTBEAT_MIN_INTERVAL_MS = 30_000;
/** Max handoffs finalized in one `processAllDueHandoffs` run (safety cap). */
const DUE_HANDOFF_MAX_PER_RUN = 100;

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

/** Result of releasing a lock or completing an in-flight force handoff during release. */
export type ReleaseLockOrHandoffResult =
  | { kind: 'released'; lock: LockForEntity }
  | { kind: 'handoffFinalized' }
  | { kind: 'notFound' };

@Injectable()
export class LocksService {
  private readonly logger = new Logger(LocksService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly applicationSettings: ApplicationSettingsService,
    @Inject(forwardRef(() => ActivitiesGateway))
    private readonly activitiesGateway: ActivitiesGateway,
    @Inject(forwardRef(() => LockHandoffDeadlineKickService))
    private readonly handoffDeadlineKick: LockHandoffDeadlineKickService
  ) {}

  private async idleDeadlineFrom(
    now: Date,
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<Date> {
    const minutes =
      await this.applicationSettings.getEditLockIdleTimeoutMinutes(executor);
    return new Date(now.getTime() + minutes * 60 * 1000);
  }

  private async getLockUsernameForUserId(
    userId: number,
    executor: DrizzleDbExecutor = this.databaseService.db
  ): Promise<string> {
    const [row] = await executor
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
    const advisoryKey = `${entityType}:${entityId}`;

    return await this.databaseService.db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(abs(hashtext(${advisoryKey})))`
      );

      const idleExpiresAt = await this.idleDeadlineFrom(now, tx);

      const existing = await tx.query.editLocks.findFirst({
        where: and(
          eq(editLocks.entityType, entityType),
          eq(editLocks.entityId, entityId)
        ),
      });

      if (existing) {
        const expiresAtDate =
          existing.expiresAt instanceof Date
            ? existing.expiresAt
            : new Date(existing.expiresAt);
        const idleExpiresAtDate =
          existing.idleExpiresAt instanceof Date
            ? existing.idleExpiresAt
            : new Date(existing.idleExpiresAt);
        const expiredLease = expiresAtDate < now;
        const expiredIdle = idleExpiresAtDate < now;
        if (expiredLease || expiredIdle) {
          await tx.delete(editLocks).where(eq(editLocks.id, existing.id));
        } else if (existing.userId !== userId) {
          throw new HttpException(
            {
              statusCode: HttpStatus.LOCKED,
              message: 'This activity is being edited by another user.',
              reason: 'locked_by_other',
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
          const [updated] = await tx
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
          if (!updated) {
            this.logger.error(
              `Lock renew returned no row for ${entityType} id=${entityId} userId=${userId}`
            );
            throw new HttpException(
              `Failed to renew lock for ${entityType} ${entityId}`,
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          }
          return updated;
        }
      }

      const [inserted] = await tx
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
    });
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
    return row ? this.rowToLockForEntity(row) : null;
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
    return row ? this.rowToLockForEntity(row) : null;
  }

  /**
   * All non-expired edit locks held by the user (any entity type).
   */
  private async listActiveLocksForUser(
    userId: number
  ): Promise<LockForEntity[]> {
    const now = new Date();
    const rows = await this.databaseService.db
      .select()
      .from(editLocks)
      .where(
        and(
          eq(editLocks.userId, userId),
          gt(editLocks.expiresAt, now),
          gt(editLocks.idleExpiresAt, now)
        )
      );
    return rows.map((row) => this.rowToLockForEntity(row));
  }

  private async cancelAllPendingForceHandoffsForRequester(
    requesterUserId: number
  ): Promise<void> {
    const cancelled = await this.databaseService.db
      .delete(editLockPendingHandoffs)
      .where(
        and(
          eq(editLockPendingHandoffs.status, 'pending'),
          eq(editLockPendingHandoffs.toUserId, requesterUserId)
        )
      )
      .returning({
        activityId: editLockPendingHandoffs.activityId,
        fromUserId: editLockPendingHandoffs.fromUserId,
        toUserId: editLockPendingHandoffs.toUserId,
      });

    for (const row of cancelled) {
      this.handoffDeadlineKick.clearScheduledKick(row.activityId);
      this.activitiesGateway.notifyLockHandoffCancelled(
        row.activityId,
        row.fromUserId,
        row.toUserId
      );
      await this.emitLockHandoffResolvedCancelled(
        row.activityId,
        row.fromUserId,
        row.toUserId
      );
    }
  }

  /**
   * When the user's last calendar WebSocket has been gone for the debounce window,
   * withdraw any pending force handoffs they requested and release edit locks they hold
   * (same semantics as HTTP DELETE lock / cancel handoff).
   */
  async releaseLocksAndCancelHandoffsAfterLastWsDisconnect(
    userId: number
  ): Promise<void> {
    try {
      await this.cancelAllPendingForceHandoffsForRequester(userId);
      const locks = await this.listActiveLocksForUser(userId);
      for (const lock of locks) {
        const result = await this.releaseLockOrFinalizePendingHandoff(
          lock.id,
          userId
        );
        if (
          result.kind === 'released' &&
          result.lock.entityType === 'activity'
        ) {
          this.activitiesGateway.notifyLockReleased(result.lock.entityId);
        }
      }
    } catch (err) {
      this.logger.error(
        `releaseLocksAndCancelHandoffsAfterLastWsDisconnect failed userId=${userId}`,
        err instanceof Error ? err.stack : String(err)
      );
    }
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

  /**
   * Release a lock held by the user. For activity locks, if a force handoff is
   * pending from this holder, finalizes the transfer to the requester first
   * (same as after a successful save). Otherwise deletes the lock row.
   * When a handoff completes, the holder's lock row is removed inside finalization
   * and this returns `{ kind: 'handoffFinalized' }` (WebSocket notifications are sent there).
   */
  async releaseLockOrFinalizePendingHandoff(
    lockId: number,
    userId: number
  ): Promise<ReleaseLockOrHandoffResult> {
    const lock = await this.getLockById(lockId);
    if (!lock || lock.userId !== userId) {
      return { kind: 'notFound' };
    }

    const didFinalizeHandoff =
      lock.entityType === 'activity'
        ? await this.completeHandoffAfterHolderSaveIfPending(
            lock.entityId,
            userId
          )
        : false;

    const stillHeld = await this.getLockById(lockId);
    if (!stillHeld || stillHeld.userId !== userId) {
      return didFinalizeHandoff
        ? { kind: 'handoffFinalized' }
        : { kind: 'notFound' };
    }

    const released = await this.releaseLock(lockId, userId);
    if (!released) {
      return { kind: 'notFound' };
    }
    return { kind: 'released', lock: released };
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
      row.expiresAt instanceof Date ? row.expiresAt : new Date(row.expiresAt);
    const idleExpiresAtDate =
      row.idleExpiresAt instanceof Date
        ? row.idleExpiresAt
        : new Date(row.idleExpiresAt);
    if (expiresAtDate < now || idleExpiresAtDate < now) {
      throw new HttpException('Lock expired', HttpStatus.GONE);
    }

    const lastRenewed =
      row.lastRenewedAt instanceof Date
        ? row.lastRenewedAt
        : new Date(row.lastRenewedAt);
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

    let inserted: typeof editLockPendingHandoffs.$inferSelect | undefined;
    try {
      const [row] = await this.databaseService.db
        .insert(editLockPendingHandoffs)
        .values({
          activityId,
          fromUserId: lock.userId,
          toUserId: requesterUserId,
          graceEndsAt,
          status: 'pending',
        })
        .returning();
      inserted = row;
    } catch (err) {
      if (isPostgresUniqueViolation(err)) {
        throw new ConflictException(
          'A lock transfer is already pending for this activity.'
        );
      }
      throw err;
    }

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

    this.handoffDeadlineKick.scheduleHandoffKick(activityId, graceEndsAt);

    return {
      graceEndsAt: iso,
      pendingHandoffId: inserted.id,
    };
  }

  /**
   * Requester withdraws a pending force handoff. Only `toUserId` may cancel.
   */
  async cancelForceHandoff(
    activityId: number,
    requesterUserId: number
  ): Promise<void> {
    const cancelled = await this.databaseService.db.transaction(async (tx) => {
      const [row] = await tx
        .delete(editLockPendingHandoffs)
        .where(
          and(
            eq(editLockPendingHandoffs.activityId, activityId),
            eq(editLockPendingHandoffs.status, 'pending'),
            eq(editLockPendingHandoffs.toUserId, requesterUserId)
          )
        )
        .returning({
          fromUserId: editLockPendingHandoffs.fromUserId,
          toUserId: editLockPendingHandoffs.toUserId,
        });
      return row ?? null;
    });

    if (!cancelled) {
      throw new NotFoundException(
        'No pending lock transfer to cancel for this activity.'
      );
    }

    this.handoffDeadlineKick.clearScheduledKick(activityId);

    this.activitiesGateway.notifyLockHandoffCancelled(
      activityId,
      cancelled.fromUserId,
      cancelled.toUserId
    );
    await this.emitLockHandoffResolvedCancelled(
      activityId,
      cancelled.fromUserId,
      cancelled.toUserId
    );
  }

  /** Emits terminal `lockHandoffResolved` with counterpart display names (post-DB work). */
  private async emitLockHandoffResolvedCancelled(
    activityId: number,
    fromUserId: number,
    toUserId: number
  ): Promise<void> {
    const holderName = await this.getLockUsernameForUserId(fromUserId);
    const requesterName = await this.getLockUsernameForUserId(toUserId);
    this.activitiesGateway.notifyLockHandoffResolved(fromUserId, {
      activityId,
      outcome: 'cancelled',
      role: 'holder',
      counterpartUsername: requesterName,
    });
    this.activitiesGateway.notifyLockHandoffResolved(toUserId, {
      activityId,
      outcome: 'cancelled',
      role: 'requester',
      counterpartUsername: holderName,
    });
  }

  /**
   * After a successful PATCH by the holder, transfer lock to admin if a handoff was pending.
   */
  async completeHandoffAfterHolderSaveIfPending(
    activityId: number,
    holderUserId: number
  ): Promise<boolean> {
    let finalized = false;
    await this.databaseService.db.transaction(async (tx) => {
      const [claimed] = await tx
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

      finalized = true;
      await this.finalizeHandoffTransferInTransaction(tx, claimed.id);
    });

    if (finalized) {
      this.handoffDeadlineKick.clearScheduledKick(activityId);
    }
    return finalized;
  }

  /**
   * Finalize every due pending handoff (grace ended), up to {@link DUE_HANDOFF_MAX_PER_RUN}.
   * Used by the grace deadline kick, backup poller, and process restarts.
   */
  async processAllDueHandoffs(): Promise<number> {
    let total = 0;
    for (let i = 0; i < DUE_HANDOFF_MAX_PER_RUN; i++) {
      const n = await this.processNextDueHandoffOnce();
      if (n === 0) break;
      total += n;
    }
    return total;
  }

  /** One due handoff (SKIP LOCKED inside transaction). */
  private async processNextDueHandoffOnce(): Promise<number> {
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
        'processNextDueHandoffOnce failed',
        err instanceof Error ? err.stack : String(err)
      );
      return 0;
    }
  }

  private async finalizeHandoffTransferInTransaction(
    tx: DbTransaction,
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
        )
      )
      .limit(1);

    if (!lock || lock.userId !== fromUserId) {
      await tx
        .delete(editLockPendingHandoffs)
        .where(eq(editLockPendingHandoffs.id, pendingHandoffId));

      const holderName = await this.getLockUsernameForUserId(fromUserId, tx);
      const requesterName = await this.getLockUsernameForUserId(toUserId, tx);

      this.logger.warn(
        `Handoff aborted (no holder lock) activityId=${activityId} fromUserId=${fromUserId} toUserId=${toUserId}`
      );

      setImmediate(() => {
        try {
          this.activitiesGateway.notifyLockHandoffResolved(fromUserId, {
            activityId,
            outcome: 'aborted_no_holder_lock',
            role: 'holder',
            counterpartUsername: requesterName,
          });
          this.activitiesGateway.notifyLockHandoffResolved(toUserId, {
            activityId,
            outcome: 'aborted_no_holder_lock',
            role: 'requester',
            counterpartUsername: holderName,
          });
        } catch (e) {
          this.logger.error(
            'notify handoff aborted failed',
            e instanceof Error ? e.stack : String(e)
          );
        }
      });
      return;
    }

    const toUsername = await this.getLockUsernameForUserId(toUserId, tx);
    const tNow = new Date();
    const idleExpiresAt = await this.idleDeadlineFrom(tNow, tx);
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
      .delete(editLockPendingHandoffs)
      .where(eq(editLockPendingHandoffs.id, pendingHandoffId));

    const holderUsername = lock.username;

    setImmediate(() => {
      try {
        this.activitiesGateway.notifyLockReleased(activityId);
        this.activitiesGateway.notifyLockAcquired(activityId, {
          userId: toUserId,
          username: toUsername,
        });
        this.activitiesGateway.notifyLockHandoffResolved(fromUserId, {
          activityId,
          outcome: 'completed',
          role: 'holder',
          counterpartUsername: toUsername,
        });
        this.activitiesGateway.notifyLockHandoffResolved(toUserId, {
          activityId,
          outcome: 'completed',
          role: 'requester',
          counterpartUsername: holderUsername,
          newLockHolder: { userId: toUserId, username: toUsername },
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
