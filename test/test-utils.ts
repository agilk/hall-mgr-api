import { Repository, DataSource, QueryRunner } from 'typeorm';
import { MockType } from './types';

/**
 * Creates a mock TypeORM repository with jest mock functions
 */
export const createMockRepository = <T = any>(): MockType<Repository<T>> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findBy: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    getCount: jest.fn(),
    execute: jest.fn(),
  })),
});

/**
 * Creates a mock DataSource with transaction support
 */
export const createMockDataSource = (): MockType<DataSource> => {
  const mockQueryRunner = createMockQueryRunner();

  return {
    createQueryRunner: jest.fn(() => mockQueryRunner),
    transaction: jest.fn((callback) => callback(mockQueryRunner.manager)),
    getRepository: jest.fn(),
    manager: {
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      getRepository: jest.fn(),
    },
  } as any;
};

/**
 * Creates a mock QueryRunner for transaction testing
 */
export const createMockQueryRunner = (): MockType<QueryRunner> => {
  const mockManager = {
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    getRepository: jest.fn((entity) => createMockRepository()),
  };

  return {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: mockManager,
  } as any;
};

/**
 * Creates a mock logger for testing
 */
export const createMockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  setContext: jest.fn(),
});

/**
 * Creates a mock audit log service
 */
export const createMockAuditLogService = () => ({
  log: jest.fn(),
});

/**
 * Helper to create test entities with default values
 */
export const createTestEntity = <T>(
  EntityClass: new () => T,
  overrides: Partial<T> = {},
): T => {
  const entity = new EntityClass();
  return Object.assign(entity, {
    id: 1,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });
};

/**
 * Helper to create paginated response
 */
export const createPaginatedResponse = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
) => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

/**
 * Helper to wait for async operations in tests
 */
export const flushPromises = () => new Promise((resolve) => setImmediate(resolve));
