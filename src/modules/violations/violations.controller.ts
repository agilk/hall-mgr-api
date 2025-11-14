import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ViolationsService } from './violations.service';
import { CreateViolationDto } from './dto/create-violation.dto';
import { UpdateViolationDto } from './dto/update-violation.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Violations')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/violations')
export class ViolationsController {
  constructor(private readonly violationsService: ViolationsService) {}

  @Post()
  @Roles(UserRole.SUPERVISOR, UserRole.VOLUNTEER, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Create violation report',
    description: 'Report an exam rule violation. Supervisors report violations during exam monitoring.',
  })
  @ApiResponse({
    status: 201,
    description: 'Violation reported successfully',
    schema: {
      example: {
        id: 'VIO-001',
        assignment_id: 'ASG-001',
        violation_type: 'cheating',
        description: 'Student was caught with unauthorized materials',
        severity: 'high',
        resolved: false,
        created_at: '2025-11-20T10:30:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  create(@Body() createViolationDto: CreateViolationDto) {
    return this.violationsService.create(createViolationDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all violations',
    description: 'Retrieve a list of violation reports with optional filtering by assignment or resolution status.',
  })
  @ApiQuery({ name: 'assignmentId', required: false, description: 'Filter by assignment ID' })
  @ApiQuery({ name: 'resolved', required: false, description: 'Filter by resolution status (true/false)' })
  @ApiResponse({
    status: 200,
    description: 'Violations retrieved successfully',
    schema: {
      example: [
        {
          id: 'VIO-001',
          assignment_id: 'ASG-001',
          supervisor_name: 'Jane Doe',
          exam_title: 'Mathematics Final Exam',
          violation_type: 'cheating',
          description: 'Student was caught with unauthorized materials',
          severity: 'high',
          resolved: false,
          created_at: '2025-11-20T10:30:00Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query('assignmentId') assignmentId?: string, @Query('resolved') resolved?: string) {
    return this.violationsService.findAll(assignmentId, resolved === 'true');
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get violation by ID',
    description: 'Retrieve detailed information about a specific violation report.',
  })
  @ApiParam({ name: 'id', description: 'Violation ID', example: 'VIO-001' })
  @ApiResponse({
    status: 200,
    description: 'Violation retrieved successfully',
    schema: {
      example: {
        id: 'VIO-001',
        assignment_id: 'ASG-001',
        assignment: {
          id: 'ASG-001',
          supervisor: {
            full_name: 'Jane Doe',
          },
          exam: {
            title: 'Mathematics Final Exam',
          },
        },
        violation_type: 'cheating',
        description: 'Student was caught with unauthorized materials',
        severity: 'high',
        resolved: false,
        resolution: null,
        resolved_at: null,
        resolved_by: null,
        created_at: '2025-11-20T10:30:00Z',
        updated_at: '2025-11-20T10:30:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Violation not found' })
  findOne(@Param('id') id: string) {
    return this.violationsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Update violation',
    description: 'Update violation details. Only EXAM_DIRECTOR or BUILDING_MANAGER can update violations.',
  })
  @ApiParam({ name: 'id', description: 'Violation ID', example: 'VIO-001' })
  @ApiResponse({
    status: 200,
    description: 'Violation updated successfully',
    schema: {
      example: {
        id: 'VIO-001',
        violation_type: 'cheating',
        description: 'Updated description with additional details',
        severity: 'critical',
        updated_at: '2025-11-20T11:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Violation not found' })
  update(@Param('id') id: string, @Body() updateViolationDto: UpdateViolationDto) {
    return this.violationsService.update(id, updateViolationDto);
  }

  @Delete(':id')
  @Roles(UserRole.EXAM_DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete violation',
    description: 'Delete a violation report. Only EXAM_DIRECTOR can perform this action.',
  })
  @ApiParam({ name: 'id', description: 'Violation ID', example: 'VIO-001' })
  @ApiResponse({ status: 204, description: 'Violation deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Violation not found' })
  remove(@Param('id') id: string) {
    return this.violationsService.remove(id);
  }

  @Patch(':id/resolve')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Resolve violation',
    description: 'Mark violation as resolved with a resolution note. Only EXAM_DIRECTOR or BUILDING_MANAGER can resolve violations.',
  })
  @ApiParam({ name: 'id', description: 'Violation ID', example: 'VIO-001' })
  @ApiResponse({
    status: 200,
    description: 'Violation resolved successfully',
    schema: {
      example: {
        id: 'VIO-001',
        resolved: true,
        resolution: 'Student was given a warning and exam was invalidated',
        resolved_at: '2025-11-20T14:00:00Z',
        updated_at: '2025-11-20T14:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Violation not found' })
  resolve(@Param('id') id: string, @Body('resolution') resolution: string) {
    return this.violationsService.resolve(id, resolution);
  }
}
