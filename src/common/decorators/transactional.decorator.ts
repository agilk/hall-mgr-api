import { SetMetadata } from '@nestjs/common';

/**
 * Marks a method to be wrapped in a database transaction
 * Use with TransactionInterceptor
 */
export const TRANSACTIONAL_KEY = 'transactional';
export const Transactional = () => SetMetadata(TRANSACTIONAL_KEY, true);
