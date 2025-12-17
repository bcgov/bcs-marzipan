# Calendar Service Testing Suite

This directory contains the testing suite for the Calendar Service API endpoints.

## Test Structure

```
test/
├── jest-e2e.json           # E2E test configuration
├── test-helpers.ts         # Test utilities and mock data factories
├── activities.e2e-spec.ts  # End-to-end integration tests
└── README.md              # This file

src/
├── activities/
│   ├── activities.controller.spec.ts  # Controller unit tests
│   └── activities.service.spec.ts     # Service unit tests (existing)
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test -- --testPathIgnorePatterns=e2e
```

### E2E Tests Only
```bash
npm run test:e2e
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:cov
```

## Test Types

### 1. Unit Tests (*.spec.ts)
Located in `src/` alongside the source files.

- **Controller Tests** (`activities.controller.spec.ts`): Test HTTP endpoints with mocked services
- **Service Tests** (`activities.service.spec.ts`): Test business logic with mocked database

### 2. E2E Tests (*.e2e-spec.ts)
Located in `test/` directory.

- **Integration Tests** (`activities.e2e-spec.ts`): Test complete request/response cycle
- Tests run against the full application stack
- Use actual database (configured in test environment)

## Test Coverage

### Activities API Endpoints

#### POST /activities
- ✅ Create new activity with valid data
- ✅ Reject invalid activity data (400)
- ✅ Validate required fields
- ✅ Return created activity with ID

#### GET /activities
- ✅ Return all activities
- ✅ Filter by title
- ✅ Filter by date range
- ✅ Return empty array when no matches

#### GET /activities/categories
- ✅ Return all activity categories
- ✅ Return array of category objects

#### GET /activities/:id
- ✅ Return specific activity by ID
- ✅ Return 404 for non-existent activity
- ✅ Return 400 for invalid ID format

#### PATCH /activities/:id
- ✅ Update activity with valid data
- ✅ Return 404 for non-existent activity
- ✅ Reject invalid update data (400)
- ✅ Return updated activity

#### DELETE /activities/:id
- ✅ Delete activity by ID
- ✅ Return 404 for non-existent activity
- ✅ Confirm deletion with success message

## Test Helpers

The `test-helpers.ts` file provides utility functions:

### Mock Data Factories
```typescript
// Create mock request data
const createRequest = createMockActivityRequest({ title: 'Custom Title' });

// Create mock response data
const response = createMockActivityResponse({ id: 123 });

// Create mock update request
const updateRequest = createMockUpdateRequest({ summary: 'Updated' });
```

### Mock Database Service
```typescript
const mockDb = createMockDatabaseService();
```

## Writing New Tests

### Unit Test Example
```typescript
describe('NewController', () => {
  let controller: NewController;
  let service: NewService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [NewController],
      providers: [
        {
          provide: NewService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<NewController>(NewController);
    service = module.get<NewService>(NewService);
  });

  it('should do something', async () => {
    // Arrange
    mockService.method.mockResolvedValue(expectedValue);

    // Act
    const result = await controller.method();

    // Assert
    expect(result).toEqual(expectedValue);
    expect(service.method).toHaveBeenCalled();
  });
});
```

### E2E Test Example
```typescript
describe('/new-endpoint (GET)', () => {
  it('should return data', () => {
    return request(app.getHttpServer())
      .get('/new-endpoint')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toBeDefined();
      });
  });
});
```

## Best Practices

1. **Arrange-Act-Assert Pattern**: Structure tests clearly
2. **Mock External Dependencies**: Isolate units under test
3. **Clean Up**: Use `afterEach` to reset mocks
4. **Descriptive Names**: Use clear test descriptions
5. **Test Edge Cases**: Include error scenarios
6. **Independent Tests**: Each test should run independently
7. **Fast Tests**: Keep unit tests fast by mocking I/O

## CI/CD Integration

Tests should be run in CI pipeline:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload coverage
  run: npm run test:cov
```

## Environment Variables

For E2E tests, ensure these environment variables are set:

```bash
DATABASE_URL=postgresql://user:pass@localhost:5433/test_db
NODE_ENV=test
API_KEY=test-api-key
```

## Debugging Tests

### Run specific test file
```bash
npm test -- activities.controller.spec.ts
```

### Run specific test case
```bash
npm test -- -t "should create a new activity"
```

### Debug mode
```bash
npm run test:debug
```

Then attach your debugger to the Node process.

## Troubleshooting

### Tests failing with timeout errors
Increase Jest timeout in the test file:
```typescript
jest.setTimeout(10000); // 10 seconds
```

### Database connection issues
Ensure database is running and accessible:
```bash
npm run test:db
```

### Module not found errors
Check `moduleNameMapper` in `jest-e2e.json` for correct path mappings.

## Contributing

When adding new endpoints:
1. Add controller unit tests in `src/`
2. Add E2E tests in `test/`
3. Update this README with coverage information
4. Ensure all tests pass before committing

## Resources

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
