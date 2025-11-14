import { TransactionUtil } from './transaction.util';
import { DataSource, QueryRunner } from 'typeorm';

describe('TransactionUtil', () => {
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;

  beforeEach(() => {
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {} as any,
    } as any;

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('runInTransaction', () => {
    it('should execute work and commit transaction on success', async () => {
      const workFn = jest.fn().mockResolvedValue('success');

      const result = await TransactionUtil.runInTransaction(
        mockDataSource,
        workFn,
      );

      expect(result).toBe('success');
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(workFn).toHaveBeenCalledWith(mockQueryRunner.manager);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const error = new Error('Transaction failed');
      const workFn = jest.fn().mockRejectedValue(error);

      await expect(
        TransactionUtil.runInTransaction(mockDataSource, workFn),
      ).rejects.toThrow('Transaction failed');

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should release query runner even on error', async () => {
      const workFn = jest.fn().mockRejectedValue(new Error('Error'));

      await expect(
        TransactionUtil.runInTransaction(mockDataSource, workFn),
      ).rejects.toThrow();

      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('runWithQueryRunner', () => {
    it('should execute work with existing query runner without starting transaction', async () => {
      const workFn = jest.fn().mockResolvedValue('result');

      const result = await TransactionUtil.runWithQueryRunner(
        mockQueryRunner,
        workFn,
      );

      expect(result).toBe('result');
      expect(workFn).toHaveBeenCalledWith(mockQueryRunner.manager);
      expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('should propagate errors from work function', async () => {
      const error = new Error('Work failed');
      const workFn = jest.fn().mockRejectedValue(error);

      await expect(
        TransactionUtil.runWithQueryRunner(mockQueryRunner, workFn),
      ).rejects.toThrow('Work failed');

      expect(workFn).toHaveBeenCalledWith(mockQueryRunner.manager);
    });
  });

  describe('savepoint', () => {
    it('should create savepoint and commit on success', async () => {
      const savepointName = 'test_savepoint';
      const workFn = jest.fn().mockResolvedValue('saved');
      mockQueryRunner.query = jest.fn();

      const result = await TransactionUtil.savepoint(
        mockQueryRunner,
        savepointName,
        workFn,
      );

      expect(result).toBe('saved');
      expect(mockQueryRunner.query).toHaveBeenCalledWith(
        `SAVEPOINT ${savepointName}`,
      );
      expect(workFn).toHaveBeenCalledWith(mockQueryRunner.manager);
      expect(mockQueryRunner.query).toHaveBeenCalledWith(
        `RELEASE SAVEPOINT ${savepointName}`,
      );
    });

    it('should rollback to savepoint on error', async () => {
      const savepointName = 'test_savepoint';
      const error = new Error('Savepoint failed');
      const workFn = jest.fn().mockRejectedValue(error);
      mockQueryRunner.query = jest.fn();

      await expect(
        TransactionUtil.savepoint(mockQueryRunner, savepointName, workFn),
      ).rejects.toThrow('Savepoint failed');

      expect(mockQueryRunner.query).toHaveBeenCalledWith(
        `SAVEPOINT ${savepointName}`,
      );
      expect(mockQueryRunner.query).toHaveBeenCalledWith(
        `ROLLBACK TO SAVEPOINT ${savepointName}`,
      );
      expect(mockQueryRunner.query).not.toHaveBeenCalledWith(
        `RELEASE SAVEPOINT ${savepointName}`,
      );
    });
  });
});
