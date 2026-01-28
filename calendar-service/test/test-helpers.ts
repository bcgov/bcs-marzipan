/**
 * Test Helpers
 * Re-exports test utilities from src/common/test-utils for use in e2e tests
 * This allows both src/ and test/ directories to use the same factory functions
 */
export {
  createMockActivityRequest,
  createMockUpdateRequest,
  createMockActivityResponse,
} from '../src/common/test-utils';

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
    select: vi.fn()().mockReturnThis(),
    from: vi.fn()().mockReturnThis(),
    where: vi.fn()().mockReturnThis(),
    leftJoin: vi.fn()().mockReturnThis(),
    innerJoin: vi.fn()().mockReturnThis(),
    insert: vi.fn()().mockReturnThis(),
    values: vi.fn()().mockReturnThis(),
    returning: vi.fn()().mockReturnThis(),
    update: vi.fn()().mockReturnThis(),
    set: vi.fn()().mockReturnThis(),
    delete: vi.fn()().mockReturnThis(),
    groupBy: vi.fn()().mockReturnThis(),
    orderBy: vi.fn()().mockReturnThis(),
    limit: vi.fn()().mockReturnThis(),
    offset: vi.fn()().mockReturnThis(),
  },
});

/**
 * Mock ActivitiesGateway for unit tests
 * Provides mocks for WebSocket notification methods
 */
export const createMockActivitiesGateway = () => ({
  notifyActivityUpdate: vi.fn()(),
  server: {
    to: vi.fn()().mockReturnThis(),
    emit: vi.fn()(),
  },
});
