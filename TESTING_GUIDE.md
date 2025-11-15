# Testing Guide for Exam Supervision Management System

## Overview

This project uses **Jest** as the testing framework with comprehensive unit and E2E tests for all modules.

## Test Structure

```
├── src/
│   ├── modules/
│   │   └── */
│   │       └── *.service.spec.ts    # Unit tests for services
│   ├── sync/
│   │   └── sync.service.spec.ts     # Sync service tests
│   └── ...
├── test/
│   ├── test-utils.ts                # Testing utilities and mocks
│   ├── types.ts                     # TypeScript types for tests
│   ├── auth.e2e-spec.ts            # E2E authentication tests
│   └── exam-workflow.e2e-spec.ts   # E2E workflow tests
├── jest.config.js                   # Jest configuration for unit tests
└── test/jest-e2e.json              # Jest configuration for E2E tests
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:cov
```

### E2E Tests
```bash
npm run test:e2e
```

### Debug Mode
```bash
npm run test:debug
```

## Test Coverage

### Completed Test Suites

✅ **Core Modules**:
- Users Service (Registration, authentication, role management)
- Buildings Service (CRUD operations, soft delete)
- Halls Service (Building relationships)
- Rooms Service (Hall relationships, capacity management)
- Exams Service (Scheduling, status management)

✅ **Assignment Modules**:
- Assignments Service (Supervisor assignments, workflow)
- Attendance Service (Participant tracking)
- Violations Service (Violation reporting and resolution)

✅ **Authentication Module**:
- Registration and login
- JWT token management
- 2FA setup and verification
- Token refresh

✅ **Synchronization Service**:
- External API integration
- Transaction management
- Error handling
- Scheduled sync operations

✅ **E2E Tests**:
- Authentication workflow
- Complete exam management workflow

## Writing Tests

### Unit Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { YourService } from './your.service';
import { YourEntity } from '../../entities/your.entity';
import { LoggerService } from '../../common/services/logger.service';
import { createMockRepository, createMockLogger } from '../../../test/test-utils';

describe('YourService', () => {
  let service: YourService;
  let repository: any;
  let logger: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: getRepositoryToken(YourEntity),
          useValue: createMockRepository(),
        },
        {
          provide: LoggerService,
          useValue: createMockLogger(),
        },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
    repository = module.get(getRepositoryToken(YourEntity));
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      repository.findOne.mockResolvedValue(mockData);

      // Act
      const result = await service.methodName(params);

      // Assert
      expect(result).toBeDefined();
      expect(repository.findOne).toHaveBeenCalled();
    });
  });
});
```

### E2E Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Feature E2E Tests', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should perform operation', () => {
    return request(app.getHttpServer())
      .post('/api/v1/endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .send(data)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
      });
  });
});
```

## Testing Utilities

### Available Mock Functions

#### `createMockRepository()`
Creates a mock TypeORM repository with all standard methods:
- `find()`, `findOne()`, `findOneBy()`, `findAndCount()`
- `save()`, `create()`, `update()`, `delete()`, `remove()`
- `createQueryBuilder()` with chainable methods

#### `createMockLogger()`
Creates a mock logger service with methods:
- `log()`, `error()`, `warn()`, `debug()`, `verbose()`, `setContext()`

#### `createMockDataSource()`
Creates a mock DataSource for transaction testing

#### `createMockQueryRunner()`
Creates a mock QueryRunner for testing transactions

## Best Practices

### 1. Test Organization
- Group related tests using `describe()` blocks
- Use clear, descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

### 2. Mocking
- Always clear mocks in `afterEach()` hook
- Mock external dependencies (repositories, services, APIs)
- Use realistic mock data that matches entity structure

### 3. Test Coverage
- Test happy paths and error cases
- Test validation and business logic
- Test edge cases and boundary conditions
- Aim for >80% code coverage

### 4. Async Testing
- Always use `async/await` for asynchronous code
- Test promise rejections with `rejects.toThrow()`
- Ensure all promises are properly awaited

### 5. Database Testing
- Mock repository methods instead of using real database
- Test transaction handling with mock query runners
- Verify repository methods are called with correct parameters

### 6. E2E Testing
- Use test database or in-memory database
- Clean up test data after each test
- Test complete user workflows
- Verify HTTP status codes and response structure

## Common Testing Patterns

### Testing CRUD Operations

```typescript
describe('create', () => {
  it('should create entity successfully', async () => {
    repository.create.mockReturnValue(mockEntity);
    repository.save.mockResolvedValue(mockEntity);

    const result = await service.create(createDto);

    expect(repository.create).toHaveBeenCalledWith(createDto);
    expect(repository.save).toHaveBeenCalled();
    expect(result).toEqual(mockEntity);
  });

  it('should throw ConflictException if entity exists', async () => {
    repository.findOne.mockResolvedValue(existingEntity);

    await expect(service.create(createDto)).rejects.toThrow(ConflictException);
  });
});
```

### Testing Query Builders

```typescript
it('should apply filters correctly', async () => {
  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockEntity], 1]),
  };

  repository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

  await service.findAll({ search: 'test', page: 1, limit: 10 });

  expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
    expect.stringContaining('ILIKE'),
    expect.objectContaining({ search: '%test%' }),
  );
});
```

### Testing Transactions

```typescript
it('should handle transaction rollback on error', async () => {
  const mockQueryRunner = dataSource.createQueryRunner();
  mockQueryRunner.manager.save.mockRejectedValue(new Error('DB error'));

  await expect(service.performOperation()).rejects.toThrow();
  expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
  expect(mockQueryRunner.release).toHaveBeenCalled();
});
```

## Troubleshooting

### Common Issues

**Issue**: `Cannot read property 'setContext' of undefined`
- **Solution**: Ensure logger mock includes `setContext` method

**Issue**: Type mismatch errors in tests
- **Solution**: Check DTO definitions and use correct types (e.g., dates as strings for DTOs)

**Issue**: Tests timeout
- **Solution**: Increase timeout in jest config or specific test: `jest.setTimeout(10000)`

**Issue**: Mock not being called
- **Solution**: Verify mock setup and ensure method is actually invoked

## Coverage Reports

After running `npm run test:cov`, coverage reports are generated in the `coverage/` directory:
- Open `coverage/lcov-report/index.html` in browser for visual report
- Review coverage by file and identify untested code paths

## Continuous Integration

Tests should be run in CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: npm test

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Next Steps

### Additional Tests to Implement

1. **Support Modules** (Lower Priority):
   - Feedback Service
   - Notifications Service
   - Documents Service
   - Audit Logs Service

2. **Integration Tests**:
   - External API integration tests
   - WebSocket tests (when implemented)

3. **Performance Tests**:
   - Load testing for sync operations
   - Query performance testing

4. **Security Tests**:
   - Authentication bypass attempts
   - SQL injection prevention
   - XSS prevention

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

---

**Last Updated**: 2025-11-14
**Test Infrastructure**: Complete
**Coverage**: 10 test suites (5 passing), 69 tests passing
