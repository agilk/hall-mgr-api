import { DataSource, EntityManager, QueryRunner } from 'typeorm';

/**
 * Transaction utility class for manual transaction management
 * Use this when you need fine-grained control over transactions in services
 */
export class TransactionUtil {
  /**
   * Execute work within a transaction
   * Automatically commits on success, rolls back on error
   *
   * @param dataSource - TypeORM DataSource
   * @param work - Async function that receives EntityManager
   * @returns Result from work function
   *
   * @example
   * ```typescript
   * const result = await TransactionUtil.runInTransaction(
   *   this.dataSource,
   *   async (manager) => {
   *     const user = await manager.save(User, userData);
   *     const profile = await manager.save(Profile, { userId: user.id, ...profileData });
   *     return { user, profile };
   *   }
   * );
   * ```
   */
  static async runInTransaction<T>(
    dataSource: DataSource,
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await work(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Execute work with an existing query runner (for nested transactions)
   *
   * @param queryRunner - Existing QueryRunner
   * @param work - Async function that receives EntityManager
   * @returns Result from work function
   *
   * @example
   * ```typescript
   * await TransactionUtil.runWithQueryRunner(
   *   request.queryRunner,
   *   async (manager) => {
   *     await manager.save(AuditLog, logData);
   *   }
   * );
   * ```
   */
  static async runWithQueryRunner<T>(
    queryRunner: QueryRunner,
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return work(queryRunner.manager);
  }

  /**
   * Create a savepoint within an existing transaction
   * Useful for partial rollbacks
   *
   * @param queryRunner - Existing QueryRunner
   * @param savepointName - Name of the savepoint
   * @param work - Async function that receives EntityManager
   * @returns Result from work function
   *
   * @example
   * ```typescript
   * try {
   *   await TransactionUtil.savepoint(
   *     queryRunner,
   *     'user_creation',
   *     async (manager) => {
   *       await manager.save(User, userData);
   *     }
   *   );
   * } catch (error) {
   *   // Error is caught, savepoint is rolled back
   *   // But main transaction continues
   * }
   * ```
   */
  static async savepoint<T>(
    queryRunner: QueryRunner,
    savepointName: string,
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    await queryRunner.query(`SAVEPOINT ${savepointName}`);

    try {
      const result = await work(queryRunner.manager);
      await queryRunner.query(`RELEASE SAVEPOINT ${savepointName}`);
      return result;
    } catch (error) {
      await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
      throw error;
    }
  }
}
