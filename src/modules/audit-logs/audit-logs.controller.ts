import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/audit-logs')
@Roles(UserRole.EXAM_DIRECTOR)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create audit log entry',
    description: 'Manually create an audit log entry. Typically used by system for automatic logging. Only EXAM_DIRECTOR can manually create entries.',
  })
  @ApiResponse({
    status: 201,
    description: 'Audit log created successfully',
    schema: {
      example: {
        id: 'AUD-001',
        user_id: 1,
        action: 'UPDATE',
        entity_type: 'Assignment',
        entity_id: 'ASG-001',
        changes: {
          status: {
            old: 'pending',
            new: 'confirmed',
          },
        },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0...',
        created_at: '2025-11-14T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions - Only EXAM_DIRECTOR can access' })
  create(@Body() createAuditLogDto: CreateAuditLogDto) {
    return this.auditLogsService.create(createAuditLogDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all audit logs',
    description: 'Retrieve audit logs with optional filtering by user or action. Only EXAM_DIRECTOR can access audit logs.',
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID who performed the action' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action type (CREATE, UPDATE, DELETE, etc.)' })
  @ApiQuery({ name: 'entity_type', required: false, description: 'Filter by entity type (User, Assignment, Exam, etc.)' })
  @ApiQuery({ name: 'entity_id', required: false, description: 'Filter by specific entity ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results (default: 100)' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    schema: {
      example: [
        {
          id: 'AUD-001',
          user_id: 1,
          user_name: 'Jane Manager',
          action: 'UPDATE',
          entity_type: 'Assignment',
          entity_id: 'ASG-001',
          changes: {
            status: {
              old: 'pending',
              new: 'confirmed',
            },
          },
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0...',
          created_at: '2025-11-14T10:00:00Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions - Only EXAM_DIRECTOR can access' })
  findAll(@Query('userId') userId?: string, @Query('action') action?: string) {
    return this.auditLogsService.findAll(userId, action);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get audit log by ID',
    description: 'Retrieve detailed information about a specific audit log entry. Only EXAM_DIRECTOR can access.',
  })
  @ApiParam({ name: 'id', description: 'Audit log ID', example: 'AUD-001' })
  @ApiResponse({
    status: 200,
    description: 'Audit log retrieved successfully',
    schema: {
      example: {
        id: 'AUD-001',
        user_id: 1,
        user: {
          id: 1,
          full_name: 'Jane Manager',
          email: 'jane@example.com',
          role: 'building_manager',
        },
        action: 'UPDATE',
        entity_type: 'Assignment',
        entity_id: 'ASG-001',
        changes: {
          status: {
            old: 'pending',
            new: 'confirmed',
          },
          confirmed_by: {
            old: null,
            new: 1,
          },
        },
        description: 'Assignment status updated to confirmed',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: {
          assignment_details: {
            exam_title: 'Mathematics Final Exam',
            supervisor_name: 'John Supervisor',
          },
        },
        created_at: '2025-11-14T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions - Only EXAM_DIRECTOR can access' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  findOne(@Param('id') id: string) {
    return this.auditLogsService.findOne(id);
  }
}
