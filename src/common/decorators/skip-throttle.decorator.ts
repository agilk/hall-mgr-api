import { SetMetadata } from '@nestjs/common';

export const SKIP_THROTTLE_KEY = 'skipThrottle';

/**
 * Decorator to skip rate limiting for specific endpoints
 * Use this for health checks, webhooks, or other endpoints that should not be rate limited
 *
 * @example
 * @SkipThrottle()
 * @Get('health')
 * checkHealth() {
 *   return { status: 'ok' };
 * }
 */
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);
