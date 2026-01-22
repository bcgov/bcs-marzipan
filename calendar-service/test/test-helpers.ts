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
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
  },
});

/**
 * Mock ActivitiesGateway for unit tests
 * Provides mocks for WebSocket notification methods
 */
export const createMockActivitiesGateway = () => ({
  notifyActivityUpdate: jest.fn(),
  server: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  },
});
