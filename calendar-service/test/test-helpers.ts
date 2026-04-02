/**
 * Test Helpers
 * Re-exports test utilities from src/common/test-utils for use in e2e tests
 * This allows both src/ and test/ directories to use the same factory functions
 */
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { vi } from 'vitest';

const request =
  typeof supertest === 'function'
    ? supertest
    : (supertest as { default: (app: unknown) => ReturnType<typeof supertest> })
        .default;

export {
  createMockActivityRequest,
  createMockUpdateRequest,
  createMockActivityResponse,
} from '../src/common/test-utils';

/**
 * Log in via the auth API and return the JWT access token.
 * Uses a seeded user with Admin role (activities.create/edit/delete); requires AUTH_STRATEGY=mock and DB seeded.
 */
export async function e2eLogin(
  app: INestApplication,
  username = 'thomas.garcia'
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ username })
    .expect(200);
  if (typeof res.body?.accessToken !== 'string') {
    throw new Error(
      'e2eLogin: expected accessToken in response. Ensure DB is seeded and AUTH_STRATEGY=mock.'
    );
  }
  return res.body.accessToken as string;
}

/**
 * Returns a supertest-like object that sends Authorization: Bearer <token> on every request.
 * In supertest v7, request(server) only has .get/.post/.put/etc.; .set() is on the result of those.
 */
export function createAuthRequest(app: INestApplication, accessToken: string) {
  const server = app.getHttpServer();
  const authHeader = { Authorization: `Bearer ${accessToken}` };
  return {
    get: (path: string) => request(server).get(path).set(authHeader),
    post: (path: string) => request(server).post(path).set(authHeader),
    put: (path: string) => request(server).put(path).set(authHeader),
    patch: (path: string) => request(server).patch(path).set(authHeader),
    delete: (path: string) => request(server).delete(path).set(authHeader),
  };
}

/**
 * Wait for a specified duration (useful for async tests)
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Mock database service for unit tests
 * Provides a complete mock of the Drizzle ORM query builder
 */
export const createMockDatabaseService = () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
  },
});

/**
 * Mock ActivitiesGateway for unit tests
 * Provides mocks for WebSocket notification methods
 */
export const createMockActivitiesGateway = () => ({
  notifyActivityUpdate: vi.fn(),
  server: {
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
  },
});
