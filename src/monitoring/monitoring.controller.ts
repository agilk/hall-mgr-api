import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { MonitoringService } from './monitoring.service';

@ApiTags('Monitoring')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/monitoring')
@Roles(UserRole.EXAM_DIRECTOR)
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Get system statistics',
    description: 'Get comprehensive system statistics including counts, performance metrics, and recent activity. Only EXAM_DIRECTOR can access.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        users: {
          total: 150,
          active: 120,
          supervisors: 80,
          managers: 15,
          directors: 5,
        },
        exams: {
          total: 50,
          scheduled: 10,
          inProgress: 2,
          completed: 38,
        },
        assignments: {
          total: 200,
          pending: 15,
          accepted: 50,
          confirmed: 30,
          completed: 105,
        },
        violations: {
          total: 12,
          unresolved: 3,
          highSeverity: 1,
        },
        documents: {
          total: 85,
          totalSize: 524288000,
          totalSizeFormatted: '500 MB',
        },
        system: {
          uptime: 86400,
          uptimeFormatted: '1 day',
          memoryUsage: '150 MB',
          nodeVersion: 'v18.17.0',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getStats() {
    return this.monitoringService.getSystemStats();
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Get performance metrics',
    description: 'Get real-time performance metrics including response times, throughput, and error rates.',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics retrieved successfully',
    schema: {
      example: {
        uptime: 86400,
        requestsTotal: 15420,
        requestsPerMinute: 25,
        averageResponseTime: 120,
        errorRate: 0.02,
        database: {
          connections: 10,
          activeQueries: 2,
        },
        memory: {
          heapUsed: 157286400,
          heapTotal: 209715200,
          external: 2097152,
          rss: 314572800,
        },
      },
    },
  })
  async getMetrics() {
    return this.monitoringService.getPerformanceMetrics();
  }

  @Get('activity')
  @ApiOperation({
    summary: 'Get recent activity',
    description: 'Get recent system activity including logins, exam operations, and violations.',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent activity retrieved successfully',
    schema: {
      example: {
        recentLogins: [
          {
            userId: 1,
            username: 'john.doe',
            timestamp: '2025-11-14T09:30:00Z',
            ipAddress: '192.168.1.100',
          },
        ],
        recentExams: [
          {
            id: 'EXM-001',
            title: 'Mathematics Final',
            status: 'in_progress',
            startTime: '2025-11-14T09:00:00Z',
          },
        ],
        recentViolations: [
          {
            id: 'VIO-001',
            type: 'unauthorized_material',
            severity: 'high',
            timestamp: '2025-11-14T09:15:00Z',
          },
        ],
      },
    },
  })
  async getRecentActivity() {
    return this.monitoringService.getRecentActivity();
  }
}
