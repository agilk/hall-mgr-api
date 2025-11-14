import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource, QueryRunner } from 'typeorm';
import { of, throwError } from 'rxjs';
import { TransactionInterceptor } from './transaction.interceptor';
import { TRANSACTIONAL_KEY } from '../decorators/transactional.decorator';

describe('TransactionInterceptor', () => {
  let interceptor: TransactionInterceptor;
  let dataSource: DataSource;
  let reflector: Reflector;
  let queryRunner: QueryRunner;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {},
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionInterceptor,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    interceptor = module.get<TransactionInterceptor>(TransactionInterceptor);
    dataSource = module.get<DataSource>(DataSource);
    reflector = module.get<Reflector>(Reflector);

    mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    const mockRequest = { queryRunner: undefined };
    const mockExecutionContext = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: jest.fn(),
    };

    beforeEach(() => {
      mockRequest.queryRunner = undefined;
      jest.clearAllMocks();
    });

    it('should pass through when not transactional', async () => {
      mockReflector.get.mockReturnValue(false);
      mockCallHandler.handle = jest.fn().mockReturnValue(of('result'));

      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(result).toBe(mockCallHandler.handle());
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
      expect(reflector.get).toHaveBeenCalledWith(
        TRANSACTIONAL_KEY,
        mockExecutionContext.getHandler(),
      );
    });

    it('should pass through when transactional is undefined', async () => {
      mockReflector.get.mockReturnValue(undefined);
      mockCallHandler.handle = jest.fn().mockReturnValue(of('result'));

      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(result).toBe(mockCallHandler.handle());
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('should create transaction and commit on success', async () => {
      mockReflector.get.mockReturnValue(true);
      mockCallHandler.handle = jest.fn().mockReturnValue(of('success'));

      const observable = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Subscribe to execute the observable
      await new Promise((resolve) => {
        observable.subscribe({
          next: (data) => {
            expect(data).toBe('success');
            resolve(data);
          },
        });
      });

      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(mockRequest.queryRunner).toBe(mockQueryRunner);
    });

    it('should rollback transaction on error', async () => {
      mockReflector.get.mockReturnValue(true);
      const testError = new Error('Test error');
      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => testError));

      const observable = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Subscribe to execute the observable
      await new Promise((resolve, reject) => {
        observable.subscribe({
          error: (error) => {
            expect(error).toBe(testError);
            resolve(error);
          },
        });
      });

      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should release query runner even on commit error', async () => {
      mockReflector.get.mockReturnValue(true);
      mockCallHandler.handle = jest.fn().mockReturnValue(of('success'));
      mockQueryRunner.commitTransaction.mockRejectedValueOnce(new Error('Commit failed'));

      const observable = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Subscribe to execute the observable
      await new Promise((resolve) => {
        observable.subscribe({
          error: (error) => {
            expect(error.message).toBe('Commit failed');
            resolve(error);
          },
        });
      });

      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should release query runner even on rollback error', async () => {
      mockReflector.get.mockReturnValue(true);
      const testError = new Error('Handler error');
      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => testError));
      mockQueryRunner.rollbackTransaction.mockRejectedValueOnce(new Error('Rollback failed'));

      const observable = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Subscribe to execute the observable
      await new Promise((resolve) => {
        observable.subscribe({
          error: (error) => {
            // Should get rollback error, not handler error
            expect(error.message).toBe('Rollback failed');
            resolve(error);
          },
        });
      });

      // Release should be called even if rollback fails
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should attach query runner to request', async () => {
      mockReflector.get.mockReturnValue(true);
      mockCallHandler.handle = jest.fn().mockReturnValue(of('success'));

      const observable = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      await new Promise((resolve) => {
        observable.subscribe({
          next: (data) => resolve(data),
        });
      });

      expect(mockRequest.queryRunner).toBe(mockQueryRunner);
    });

    it('should handle multiple sequential calls', async () => {
      // Reset mocks for clean state
      jest.clearAllMocks();
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
      mockQueryRunner.commitTransaction.mockResolvedValue(undefined);

      mockReflector.get.mockReturnValue(true);
      mockCallHandler.handle = jest.fn().mockReturnValue(of('result'));

      // First call
      const observable1 = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      await new Promise((resolve, reject) => {
        observable1.subscribe({
          next: (data) => resolve(data),
          error: (err) => reject(err),
        });
      });

      // Second call
      jest.clearAllMocks();
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
      mockQueryRunner.commitTransaction.mockResolvedValue(undefined);

      const observable2 = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      await new Promise((resolve, reject) => {
        observable2.subscribe({
          next: (data) => resolve(data),
          error: (err) => reject(err),
        });
      });

      expect(mockDataSource.createQueryRunner).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    });

    it('should handle async data correctly', async () => {
      // Reset mocks to ensure clean state
      jest.clearAllMocks();
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
      mockQueryRunner.commitTransaction.mockResolvedValue(undefined);

      mockReflector.get.mockReturnValue(true);
      const asyncData = { id: 1, name: 'Test' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(asyncData));

      const observable = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      const result = await new Promise((resolve, reject) => {
        observable.subscribe({
          next: (data) => resolve(data),
          error: (err) => reject(err),
        });
      });

      expect(result).toEqual(asyncData);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should preserve error details during rollback', async () => {
      // Reset mocks to ensure clean state
      jest.clearAllMocks();
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
      mockQueryRunner.rollbackTransaction.mockResolvedValue(undefined);

      mockReflector.get.mockReturnValue(true);
      const detailedError = new Error('Detailed error message');
      (detailedError as any).statusCode = 400;
      (detailedError as any).details = { field: 'email' };

      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => detailedError));

      const observable = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      const caughtError = await new Promise((resolve) => {
        observable.subscribe({
          error: (error) => {
            resolve(error);
          },
        });
      });

      expect(caughtError).toBe(detailedError);
      expect((caughtError as any).statusCode).toBe(400);
      expect((caughtError as any).details).toEqual({ field: 'email' });
    });
  });
});
