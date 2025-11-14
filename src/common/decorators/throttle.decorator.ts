import { SetMetadata } from '@nestjs/common';

export const THROTTLE_LIMIT_KEY = 'throttle:limit';
export const THROTTLE_TTL_KEY = 'throttle:ttl';

/**
 * Decorator to set custom rate limits for specific endpoints
 *
 * @param limit - Maximum number of requests
 * @param ttl - Time window in seconds
 *
 * @example
 * // Allow 5 login attempts per minute
 * @CustomThrottle(5, 60)
 * @Post('login')
 * login() {
 *   // ...
 * }
 */
export const CustomThrottle = (limit: number, ttl: number) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    SetMetadata(THROTTLE_LIMIT_KEY, limit)(target, propertyKey, descriptor);
    SetMetadata(THROTTLE_TTL_KEY, ttl)(target, propertyKey, descriptor);
  };
};
