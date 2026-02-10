# Database Mocking Strategy for Unit Tests

This document describes the approach used for mocking database operations in the Calendar Service unit tests, enabling isolated testing without requiring a real database connection.

## Overview

The Calendar Service uses **Drizzle ORM** for database operations. To enable unit testing without database dependencies, we mock the `DatabaseService` and its underlying Drizzle query builder methods using Jest.

## Architecture

### DatabaseService Mock Structure

The mock database service replicates the Drizzle ORM's fluent query builder API, where methods return `this` to enable method chaining:

```typescript
const mockDatabaseService = {
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
    transaction: vi.fn()(),
  },
};
```

### Key Concepts

1. **Method Chaining**: Most methods return `this` (`mockReturnThis()`) to simulate Drizzle's query builder pattern
2. **Query Termination**: The final method in a chain returns mock data instead of `this`
3. **Test Isolation**: Each test configures specific mock return values for the query being tested

## Usage Patterns

### Basic Query Mocking

For a simple SELECT query:

```typescript
it('should find an activity by ID', async () => {
  const mockActivity = createMockActivity({ id: 1 });

  // Mock the query chain
  const mockDbQuery = {
    leftJoin: vi.fn()().mockReturnThis(),
    where: vi.fn()().mockResolvedValue([mockActivity]),
  };

  mockDatabaseService.db.select = vi.fn()().mockReturnValue(mockDbQuery);

  const result = await service.findOne(1);

  expect(result).toEqual(mockActivity);
});
```

### Complex Query with Multiple Joins

For queries with multiple joins and conditions:

```typescript
it('should retrieve activities with filters', async () => {
  const mockActivities = [
    createMockActivity({ id: 1, title: 'Activity 1' }),
    createMockActivity({ id: 2, title: 'Activity 2' }),
  ];

  const mockDbQuery = {
    leftJoin: vi.fn()().mockReturnThis(),
    innerJoin: vi.fn()().mockReturnThis(),
    where: vi.fn()().mockReturnThis(),
    groupBy: vi.fn()().mockReturnThis(),
    orderBy: vi.fn()().mockReturnThis(),
    limit: vi.fn()().mockReturnThis(),
    offset: vi.fn()().mockResolvedValue(mockActivities),
  };

  mockDatabaseService.db.select = vi.fn()().mockReturnValue(mockDbQuery);

  const result = await service.findAll({ limit: 10, offset: 0 });

  expect(result).toEqual(mockActivities);
});
```

### INSERT Operations

Mocking insert operations with returned values:

```typescript
it('should create a new activity', async () => {
  const createRequest: CreateActivityRequest = {
    title: 'New Activity',
    startDate: '2025-01-15',
    // ... other fields
  };

  const mockInsertedActivity = createMockActivity({
    id: 1,
    title: 'New Activity',
  });

  const mockDbQuery = {
    values: vi.fn()().mockReturnThis(),
    returning: vi.fn()().mockResolvedValue([mockInsertedActivity]),
  };

  mockDatabaseService.db.insert = vi.fn()().mockReturnValue(mockDbQuery);

  const result = await service.create(createRequest);

  expect(result).toEqual(mockInsertedActivity);
});
```

### UPDATE Operations

Mocking update operations:

```typescript
it('should update an activity', async () => {
  const mockUpdated = createMockActivity({ id: 1, title: 'Updated Title' });

  const mockUpdate = {
    set: vi.fn()().mockReturnThis(),
    where: vi.fn()().mockReturnThis(),
    returning: vi.fn()().mockResolvedValue([mockUpdated]),
  };

  mockDatabaseService.db.update = vi.fn()().mockReturnValue(mockUpdate);

  const result = await service.update(1, { title: 'Updated Title' });

  expect(result).toEqual(mockUpdated);
});
```

### DELETE Operations

Mocking delete operations:

```typescript
it('should delete an activity', async () => {
  const mockDeleted = createMockActivity({ id: 1 });

  const mockDelete = {
    where: vi.fn()().mockReturnThis(),
    returning: vi.fn()().mockResolvedValue([mockDeleted]),
  };

  mockDatabaseService.db.delete = vi.fn()().mockReturnValue(mockDelete);

  await service.remove(1);

  expect(mockDatabaseService.db.delete).toHaveBeenCalled();
});
```

### Transaction Mocking

For operations wrapped in database transactions:

```typescript
it('should handle transaction operations', async () => {
  const mockResult = { id: 1 };

  mockDatabaseService.db.transaction = jest
    .fn()
    .mockImplementation(async (callback) => {
      // Execute the callback with a mock transaction object
      return await callback(mockDatabaseService.db);
    });

  const result = await service.performTransactionalOperation();

  expect(mockDatabaseService.db.transaction).toHaveBeenCalled();
});
```

## Helper Functions

### `createMockDatabaseService()`

Located in [test/test-helpers.ts](../test/test-helpers.ts), this helper creates a standardized mock database service:

```typescript
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
```

**Usage:**

```typescript
const mockDatabaseService = createMockDatabaseService();

const module: TestingModule = await Test.createTestingModule({
  providers: [
    ActivitiesService,
    {
      provide: DatabaseService,
      useValue: mockDatabaseService,
    },
  ],
}).compile();
```

### `createMockActivity()`

Helper function to generate mock activity objects with sensible defaults:

```typescript
const createMockActivity = (overrides?: Partial<Activity>): Activity => {
  const now = new Date();
  return {
    id: 1,
    displayId: 'MIN-000001',
    activityStatusId: 1,
    title: 'Test Activity',
    summary: 'Test summary',
    isIssue: false,
    oicRelated: false,
    isActive: true,
    startDate: new Date('2024-01-15'),
    startTime: '10:00',
    endDate: new Date('2024-01-15'),
    endTime: '12:00',
    createdDateTime: now,
    createdBy: 1,
    lastUpdatedDateTime: now,
    lastUpdatedBy: 1,
    // ... other default fields
    ...overrides,
  } as Activity;
};
```

**Usage:**

```typescript
const mockActivity = createMockActivity({
  id: 5,
  title: 'Custom Activity',
});
```

## Test Setup Pattern

### Complete Test Suite Setup

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service';
import { DatabaseService } from '../database/database.service';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let databaseService: DatabaseService;

  const mockDatabaseService = createMockDatabaseService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test cases...
});
```

## Mocking Related Data Fetches

The `ActivitiesService` fetches related data (categories, tags, organizations, etc.) for activities. To isolate tests, these methods are spied on and mocked:

```typescript
const setupRelatedDataMocks = () => {
  jest
    .spyOn(service as any, 'fetchCategoriesForActivities')
    .mockResolvedValue(new Map());
  jest
    .spyOn(service as any, 'fetchTagsForActivities')
    .mockResolvedValue(new Map());
  jest
    .spyOn(service as any, 'fetchPitchStatusesForActivities')
    .mockResolvedValue(new Map([[1, 'Not Started']]));
  jest
    .spyOn(service as any, 'fetchSchedulingStatusesForActivities')
    .mockResolvedValue(new Map([[1, 'Tentative']]));
  // ... other related data fetches
};
```

This approach:

- Prevents cascading database queries during tests
- Allows testing service logic in isolation
- Makes tests faster by avoiding unnecessary data fetching
- Provides control over related data in test scenarios

## Best Practices

### 1. Mock Only What You Need

Don't mock entire query chains if your test only uses part of it. Keep mocks minimal and focused.

```typescript
// ✅ Good - minimal mock
const mockDbQuery = {
  where: vi.fn()().mockResolvedValue([mockActivity]),
};

// ❌ Unnecessary - mocking unused methods
const mockDbQuery = {
  leftJoin: vi.fn()().mockReturnThis(),
  innerJoin: vi.fn()().mockReturnThis(),
  groupBy: vi.fn()().mockReturnThis(),
  where: vi.fn()().mockResolvedValue([mockActivity]),
};
```

### 2. Clear Mocks Between Tests

Always clear mock state to prevent test pollution:

```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

### 3. Use Helper Functions

Leverage helper functions for consistent test data:

```typescript
const mockActivity = createMockActivity({ title: 'Test' });
```

### 4. Test Error Paths

Mock error scenarios to test error handling:

```typescript
it('should handle database errors', async () => {
  const mockDbQuery = {
    where: vi.fn()().mockRejectedValue(new Error('Database error')),
  };

  mockDatabaseService.db.select = vi.fn()().mockReturnValue(mockDbQuery);

  await expect(service.findOne(1)).rejects.toThrow('Database error');
});
```

### 5. Verify Mock Calls

Ensure your service calls the database correctly:

```typescript
expect(mockDatabaseService.db.select).toHaveBeenCalled();
expect(mockDbQuery.where).toHaveBeenCalledWith(expect.any(Object));
```

## Common Pitfalls

### Pitfall 1: Forgetting `mockReturnThis()`

**Problem:** Methods in the chain don't return properly.

```typescript
// ❌ Wrong
select: vi.fn()(),

// ✅ Correct
select: vi.fn()().mockReturnThis(),
```

### Pitfall 2: Not Mocking the Final Method's Return Value

**Problem:** The last method in the chain must return actual data, not `this`.

```typescript
// ❌ Wrong
where: vi.fn()().mockReturnThis(),

// ✅ Correct (for final method)
where: vi.fn()().mockResolvedValue([mockActivity]),
```

### Pitfall 3: Reusing Mock Objects

**Problem:** Mock objects maintain state across tests.
**Solution:** Create fresh mock objects for each test or clear them in `afterEach()`.

### Pitfall 4: Over-Mocking

**Problem:** Mocking implementation details makes tests brittle.
**Solution:** Focus on mocking database boundaries, not internal service logic.

## Testing Strategy

### Unit Tests (with Database Mocks)

- **Purpose:** Test business logic in isolation
- **Scope:** Individual service methods
- **Speed:** Fast (no database I/O)
- **When to use:** Testing complex logic, error handling, data transformations

### Integration/E2E Tests (with Real Database)

- **Purpose:** Test full request/response cycles
- **Scope:** API endpoints with real database
- **Speed:** Slower (actual database operations)
- **When to use:** Validating end-to-end functionality, query correctness

## Files Reference

- [activities.service.spec.ts](../src/activities/activities.service.spec.ts) - Service unit tests with database mocks
- [activities.controller.spec.ts](../src/activities/activities.controller.spec.ts) - Controller tests with service mocks
- [test/test-helpers.ts](../test/test-helpers.ts) - Mock helper functions and test data factories
- [lookups.controller.spec.ts](../src/lookups/lookups.controller.spec.ts) - Lookups controller tests

## Related Documentation

- [TESTING_SETUP.md](../TESTING_SETUP.md) - Overall testing suite configuration
- [TEST_FIX_SUMMARY.md](../TEST_FIX_SUMMARY.md) - Test suite fixes and status
- [database/README.md](../src/database/README.md) - Database service documentation
