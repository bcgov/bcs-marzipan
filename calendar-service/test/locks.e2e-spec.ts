/**
 * Locks API integration tests (Nest in-process + real DB).
 * See activities.e2e-spec.ts for environment (AUTH_STRATEGY=mock, seeded DB).
 */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { and, eq } from 'drizzle-orm';

import { editLockPendingHandoffs, editLocks } from '@corpcal/database/schema';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DatabaseService } from '../src/database/database.service';
import { LocksService } from '../src/locks/locks.service';
import {
  createAuthRequest,
  createMockUpdateRequest,
  e2eLogin,
} from './test-helpers';

/** Editor — can create/edit activities (seed: wei.zhang, id 2). */
const HOLDER_LOGIN = 'wei.zhang';
/** Admin — force handoff permission (seed: thomas.garcia, id 18). */
const REQUESTER_LOGIN = 'thomas.garcia';
/** Second admin for duplicate handoff conflict (seed: xiaoling.wang, id 19). */
const SECOND_ADMIN_LOGIN = 'xiaoling.wang';

describe('LocksController (API integration)', () => {
  let app: INestApplication;
  let db: DatabaseService['db'];
  let locksService: LocksService;
  let adminToken: string;
  let holderToken: string;
  let secondAdminToken: string;
  /** Shared activity from seeded DB (POST /activities may fail validation in some envs). */
  let activityId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    db = app.get(DatabaseService).db;
    locksService = app.get(LocksService);

    adminToken = await e2eLogin(app, REQUESTER_LOGIN);
    holderToken = await e2eLogin(app, HOLDER_LOGIN);
    secondAdminToken = await e2eLogin(app, SECOND_ADMIN_LOGIN);

    const listRes = await createAuthRequest(app, adminToken)
      .get('/activities')
      .expect(200);
    const data = listRes.body?.data as
      | Array<{ id: number; activityStatus?: string }>
      | undefined;
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(
        'locks e2e: need at least one activity (seed DB / GET /activities)'
      );
    }
    const patchable = data.find(
      (a) =>
        a.activityStatus !== 'Delete requested' &&
        a.activityStatus !== 'Deleted'
    );
    if (patchable?.id == null) {
      throw new Error(
        'locks e2e: need an activity not in delete_requested/deleted status'
      );
    }
    activityId = patchable.id;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanupLockState(activityId);
  });

  afterEach(async () => {
    await cleanupLockState(activityId);
  });

  async function cleanupLockState(activityId: number): Promise<void> {
    await db
      .delete(editLockPendingHandoffs)
      .where(eq(editLockPendingHandoffs.activityId, activityId));
    await db
      .delete(editLocks)
      .where(
        and(
          eq(editLocks.entityType, 'activity'),
          eq(editLocks.entityId, activityId)
        )
      );
  }

  describe('POST /locks acquire + conflict', () => {
    it('returns 423 when another user holds the lock', async () => {
      await createAuthRequest(app, holderToken)
        .post('/locks')
        .send({ entityType: 'activity', entityId: activityId })
        .expect(201);

      const conflict = await createAuthRequest(app, adminToken)
        .post('/locks')
        .send({ entityType: 'activity', entityId: activityId })
        .expect(423);

      expect(conflict.body).toMatchObject({ status: 423 });
      expect(conflict.body.detail).toContain('another user');
    });
  });

  describe('PATCH /activities/:id requires edit lock', () => {
    it('returns 423 when patching without holding a lock', async () => {
      const updateDto = createMockUpdateRequest({
        title: `No lock patch ${Date.now()}`,
      });
      // Use admin user to avoid team-scope permission 403 masking lock checks.
      const res = await createAuthRequest(app, adminToken)
        .patch(`/activities/${activityId}`)
        .send(updateDto)
        .expect(423);
      expect(String(res.body.detail ?? '')).toMatch(/edit lock/i);
    });
  });

  describe('DELETE /locks/:lockId', () => {
    it('returns 204 when lock does not exist or is not owned (idempotent)', async () => {
      await createAuthRequest(app, holderToken)
        .delete('/locks/999999999')
        .expect(204);
    });

    it('returns 204 when deleting a lock already auto-released by PATCH', async () => {
      // Use admin user to guarantee patch permission in all seeded datasets.
      const acquireRes = await createAuthRequest(app, adminToken)
        .post('/locks')
        .send({ entityType: 'activity', entityId: activityId })
        .expect(201);
      const lockId = acquireRes.body.id as number;

      const updateDto = createMockUpdateRequest({
        title: `Auto release then delete ${Date.now()}`,
      });
      await createAuthRequest(app, adminToken)
        .patch(`/activities/${activityId}`)
        .send(updateDto)
        .expect(200);

      await createAuthRequest(app, adminToken)
        .delete(`/locks/${lockId}`)
        .expect(204);
    });
  });

  describe('POST /locks/activity/:id/force-handoff', () => {
    it('transfers lock to requester when grace elapses (processAllDueHandoffs)', async () => {
      await createAuthRequest(app, holderToken)
        .post('/locks')
        .send({ entityType: 'activity', entityId: activityId })
        .expect(201);

      await createAuthRequest(app, adminToken)
        .post(`/locks/activity/${activityId}/force-handoff`)
        .expect(201);

      await db
        .update(editLockPendingHandoffs)
        .set({ graceEndsAt: new Date(Date.now() - 60_000) })
        .where(
          and(
            eq(editLockPendingHandoffs.activityId, activityId),
            eq(editLockPendingHandoffs.status, 'pending')
          )
        );

      const processed = await locksService.processAllDueHandoffs();
      expect(processed).toBeGreaterThanOrEqual(1);

      const holderStatus = await createAuthRequest(app, holderToken)
        .get(`/locks/activity/${activityId}`)
        .expect(200);
      expect(holderStatus.body.locked).toBe(true);
      expect(holderStatus.body.isOwnLock).toBe(false);

      const requesterStatus = await createAuthRequest(app, adminToken)
        .get(`/locks/activity/${activityId}`)
        .expect(200);
      expect(requesterStatus.body.isOwnLock).toBe(true);
      expect(requesterStatus.body.lockedBy?.userId).toBeDefined();

      const pending = await db
        .select()
        .from(editLockPendingHandoffs)
        .where(eq(editLockPendingHandoffs.activityId, activityId));
      expect(pending).toHaveLength(0);
    });

    it('early PATCH by holder transfers lock to requester (pending handoff)', async () => {
      // Admin as holder so PATCH is not forbidden for team-scoped activities.
      await createAuthRequest(app, adminToken)
        .post('/locks')
        .send({ entityType: 'activity', entityId: activityId })
        .expect(201);

      await createAuthRequest(app, secondAdminToken)
        .post(`/locks/activity/${activityId}/force-handoff`)
        .expect(201);

      const updateDto = createMockUpdateRequest({
        title: `Early save handoff ${Date.now()}`,
      });
      await createAuthRequest(app, adminToken)
        .patch(`/activities/${activityId}`)
        .send(updateDto)
        .expect(200);

      const requesterStatus = await createAuthRequest(app, secondAdminToken)
        .get(`/locks/activity/${activityId}`)
        .expect(200);
      expect(requesterStatus.body.isOwnLock).toBe(true);

      const pending = await db
        .select()
        .from(editLockPendingHandoffs)
        .where(eq(editLockPendingHandoffs.activityId, activityId));
      expect(pending).toHaveLength(0);
    });

    it('DELETE force-handoff cancels and holder keeps lock', async () => {
      const acquireRes = await createAuthRequest(app, holderToken)
        .post('/locks')
        .send({ entityType: 'activity', entityId: activityId })
        .expect(201);
      const lockId = acquireRes.body.id as number;

      await createAuthRequest(app, adminToken)
        .post(`/locks/activity/${activityId}/force-handoff`)
        .expect(201);

      await createAuthRequest(app, adminToken)
        .delete(`/locks/activity/${activityId}/force-handoff`)
        .expect(204);

      const holderStatus = await createAuthRequest(app, holderToken)
        .get(`/locks/activity/${activityId}`)
        .expect(200);
      expect(holderStatus.body.isOwnLock).toBe(true);
      expect(holderStatus.body.lockId).toBe(lockId);

      const pending = await db
        .select()
        .from(editLockPendingHandoffs)
        .where(eq(editLockPendingHandoffs.activityId, activityId));
      expect(pending).toHaveLength(0);
    });

    it('returns 409 when a second force-handoff is requested while one is pending', async () => {
      await createAuthRequest(app, holderToken)
        .post('/locks')
        .send({ entityType: 'activity', entityId: activityId })
        .expect(201);

      await createAuthRequest(app, adminToken)
        .post(`/locks/activity/${activityId}/force-handoff`)
        .expect(201);

      const dup = await createAuthRequest(app, secondAdminToken)
        .post(`/locks/activity/${activityId}/force-handoff`)
        .expect(409);

      expect(dup.body).toMatchObject({ status: 409 });
      expect(dup.body.detail).toMatch(/pending|transfer/i);
    });
  });

  describe('LocksService.cleanupExpiredLocks', () => {
    it('removes locks past lease or idle deadline', async () => {
      const acquireRes = await createAuthRequest(app, holderToken)
        .post('/locks')
        .send({ entityType: 'activity', entityId: activityId })
        .expect(201);
      const lockId = acquireRes.body.id as number;

      const past = new Date(Date.now() - 120_000);
      await db
        .update(editLocks)
        .set({
          expiresAt: past,
          idleExpiresAt: past,
        })
        .where(eq(editLocks.id, lockId));

      const removed = await locksService.cleanupExpiredLocks();
      expect(removed).toBeGreaterThanOrEqual(1);

      const status = await createAuthRequest(app, holderToken)
        .get(`/locks/activity/${activityId}`)
        .expect(200);
      expect(status.body.locked).toBe(false);
    });
  });
});
