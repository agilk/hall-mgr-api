import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { SkipThrottle } from '../common/decorators/skip-throttle.decorator';

@ApiTags('Health')
@Controller('health')
@Public()
@SkipThrottle()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'General health check',
    description: 'Check overall application health including database, memory, and disk.',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: {
            status: 'up',
          },
          memory_heap: {
            status: 'up',
          },
          memory_rss: {
            status: 'up',
          },
          storage: {
            status: 'up',
          },
        },
        error: {},
        details: {
          database: {
            status: 'up',
          },
          memory_heap: {
            status: 'up',
          },
          memory_rss: {
            status: 'up',
          },
          storage: {
            status: 'up',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable',
  })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9, // 90%
        }),
    ]);
  }

  @Get('db')
  @HealthCheck()
  @ApiOperation({
    summary: 'Database health check',
    description: 'Check database connectivity and responsiveness.',
  })
  @ApiResponse({
    status: 200,
    description: 'Database is healthy',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: {
            status: 'up',
          },
        },
        error: {},
        details: {
          database: {
            status: 'up',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Database is down',
  })
  checkDatabase() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  @Get('memory')
  @HealthCheck()
  @ApiOperation({
    summary: 'Memory health check',
    description: 'Check memory usage (heap and RSS).',
  })
  @ApiResponse({
    status: 200,
    description: 'Memory usage is healthy',
    schema: {
      example: {
        status: 'ok',
        info: {
          memory_heap: {
            status: 'up',
          },
          memory_rss: {
            status: 'up',
          },
        },
        error: {},
        details: {
          memory_heap: {
            status: 'up',
          },
          memory_rss: {
            status: 'up',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Memory usage is critical',
  })
  checkMemory() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }

  @Get('disk')
  @HealthCheck()
  @ApiOperation({
    summary: 'Disk health check',
    description: 'Check disk space availability.',
  })
  @ApiResponse({
    status: 200,
    description: 'Disk space is healthy',
    schema: {
      example: {
        status: 'ok',
        info: {
          storage: {
            status: 'up',
          },
        },
        error: {},
        details: {
          storage: {
            status: 'up',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Disk space is critical',
  })
  checkDisk() {
    return this.health.check([
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness check',
    description: 'Check if the application is ready to accept requests (Kubernetes readiness probe).',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is ready',
    schema: {
      example: {
        status: 'ready',
        timestamp: '2025-11-14T10:00:00.000Z',
      },
    },
  })
  ready() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @ApiOperation({
    summary: 'Liveness check',
    description: 'Check if the application is alive (Kubernetes liveness probe).',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is alive',
    schema: {
      example: {
        status: 'alive',
        timestamp: '2025-11-14T10:00:00.000Z',
      },
    },
  })
  live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
