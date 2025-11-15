import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, catchError, concatMap, finalize } from 'rxjs';
import { DataSource } from 'typeorm';
import { TRANSACTIONAL_KEY } from '../decorators/transactional.decorator';

/**
 * Interceptor that wraps controller methods in database transactions
 * when decorated with @Transactional()
 */
@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(
    private dataSource: DataSource,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const isTransactional = this.reflector.get<boolean>(
      TRANSACTIONAL_KEY,
      context.getHandler(),
    );

    if (!isTransactional) {
      return next.handle();
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const request = context.switchToHttp().getRequest();
    request.queryRunner = queryRunner;

    return next.handle().pipe(
      concatMap(async (data) => {
        await queryRunner.commitTransaction();
        return data;
      }),
      catchError(async (error) => {
        await queryRunner.rollbackTransaction();
        throw error;
      }),
      finalize(async () => {
        await queryRunner.release();
      }),
    );
  }
}
