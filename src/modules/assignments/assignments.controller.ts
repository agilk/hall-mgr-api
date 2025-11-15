import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { QueryAssignmentDto } from './dto/query-assignment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Assignments')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Create a new assignment',
    description: 'Assign a supervisor or volunteer to an exam room. The assignment starts in pending status.',
  })
  @ApiResponse({
    status: 201,
    description: 'Assignment created successfully',
    schema: {
      example: {
        id: 'ASG-001',
        supervisor_id: 1,
        exam_id: 'EXM-001',
        room_id: 'RM-001',
        role: 'primary',
        status: 'pending',
        created_at: '2025-11-14T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  create(@Body() createAssignmentDto: CreateAssignmentDto) {
    return this.assignmentsService.create(createAssignmentDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all assignments',
    description: 'Retrieve a paginated list of assignments with optional filtering by supervisor, exam, room, or status.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'supervisor_id', required: false, description: 'Filter by supervisor ID' })
  @ApiQuery({ name: 'exam_id', required: false, description: 'Filter by exam ID' })
  @ApiQuery({ name: 'room_id', required: false, description: 'Filter by room ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by assignment status' })
  @ApiResponse({
    status: 200,
    description: 'Assignments retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'ASG-001',
            supervisor_id: 1,
            supervisor_name: 'Jane Doe',
            exam_id: 'EXM-001',
            exam_title: 'Mathematics Final Exam',
            room_id: 'RM-001',
            room_name: 'Room 101',
            role: 'primary',
            status: 'confirmed',
          },
        ],
        meta: {
          total: 40,
          page: 1,
          limit: 10,
          totalPages: 4,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() query: QueryAssignmentDto) {
    return this.assignmentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get assignment by ID',
    description: 'Retrieve detailed information about a specific assignment including supervisor, exam, and room details.',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID', example: 'ASG-001' })
  @ApiResponse({
    status: 200,
    description: 'Assignment retrieved successfully',
    schema: {
      example: {
        id: 'ASG-001',
        supervisor_id: 1,
        supervisor: {
          id: 1,
          full_name: 'Jane Doe',
          email: 'jane@example.com',
        },
        exam_id: 'EXM-001',
        exam: {
          id: 'EXM-001',
          title: 'Mathematics Final Exam',
          exam_date: '2025-11-20',
          start_time: '09:00',
        },
        room_id: 'RM-001',
        room: {
          id: 'RM-001',
          name: 'Room 101',
        },
        role: 'primary',
        status: 'confirmed',
        arrival_time: null,
        departure_time: null,
        created_at: '2025-11-14T10:00:00Z',
        updated_at: '2025-11-14T12:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Update assignment',
    description: 'Update assignment information including role and notes.',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID', example: 'ASG-001' })
  @ApiResponse({
    status: 200,
    description: 'Assignment updated successfully',
    schema: {
      example: {
        id: 'ASG-001',
        role: 'secondary',
        notes: 'Updated assignment notes',
        updated_at: '2025-11-14T13:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  update(
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(id, updateAssignmentDto);
  }

  @Delete(':id')
  @Roles(UserRole.EXAM_DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete assignment',
    description: 'Delete an assignment. Only EXAM_DIRECTOR can perform this action.',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID', example: 'ASG-001' })
  @ApiResponse({ status: 204, description: 'Assignment deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  remove(@Param('id') id: string) {
    return this.assignmentsService.remove(id);
  }

  @Patch(':id/accept')
  @Roles(UserRole.SUPERVISOR, UserRole.VOLUNTEER)
  @ApiOperation({
    summary: 'Accept assignment',
    description: 'Supervisor accepts the assignment. Changes status from pending to accepted.',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID', example: 'ASG-001' })
  @ApiResponse({
    status: 200,
    description: 'Assignment accepted successfully',
    schema: {
      example: {
        id: 'ASG-001',
        status: 'accepted',
        updated_at: '2025-11-14T14:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 400, description: 'Assignment cannot be accepted (invalid status)' })
  acceptAssignment(@Param('id') id: string) {
    return this.assignmentsService.acceptAssignment(id);
  }

  @Patch(':id/reject')
  @Roles(UserRole.SUPERVISOR, UserRole.VOLUNTEER)
  @ApiOperation({
    summary: 'Reject assignment',
    description: 'Supervisor rejects the assignment. Changes status from pending to rejected.',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID', example: 'ASG-001' })
  @ApiResponse({
    status: 200,
    description: 'Assignment rejected successfully',
    schema: {
      example: {
        id: 'ASG-001',
        status: 'rejected',
        updated_at: '2025-11-14T14:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 400, description: 'Assignment cannot be rejected (invalid status)' })
  rejectAssignment(@Param('id') id: string) {
    return this.assignmentsService.rejectAssignment(id);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Confirm assignment',
    description: 'Building manager confirms the assignment. Changes status from accepted to confirmed.',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID', example: 'ASG-001' })
  @ApiResponse({
    status: 200,
    description: 'Assignment confirmed successfully',
    schema: {
      example: {
        id: 'ASG-001',
        status: 'confirmed',
        updated_at: '2025-11-14T15:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 400, description: 'Assignment cannot be confirmed (invalid status)' })
  confirmAssignment(@Param('id') id: string) {
    return this.assignmentsService.confirmAssignment(id);
  }

  @Patch(':id/complete')
  @Roles(UserRole.SUPERVISOR, UserRole.VOLUNTEER, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Complete assignment',
    description: 'Mark assignment as completed after the exam is finished.',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID', example: 'ASG-001' })
  @ApiResponse({
    status: 200,
    description: 'Assignment completed successfully',
    schema: {
      example: {
        id: 'ASG-001',
        status: 'completed',
        updated_at: '2025-11-20T11:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 400, description: 'Assignment cannot be completed (invalid status)' })
  completeAssignment(@Param('id') id: string) {
    return this.assignmentsService.completeAssignment(id);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Cancel assignment',
    description: 'Cancel an assignment. Only EXAM_DIRECTOR or BUILDING_MANAGER can perform this action.',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID', example: 'ASG-001' })
  @ApiResponse({
    status: 200,
    description: 'Assignment cancelled successfully',
    schema: {
      example: {
        id: 'ASG-001',
        status: 'cancelled',
        updated_at: '2025-11-19T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  cancelAssignment(@Param('id') id: string) {
    return this.assignmentsService.cancelAssignment(id);
  }

  @Patch(':id/arrival')
  @Roles(UserRole.SUPERVISOR, UserRole.VOLUNTEER)
  @ApiOperation({
    summary: 'Record arrival time',
    description: 'Record when the supervisor arrives at the exam room.',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID', example: 'ASG-001' })
  @ApiResponse({
    status: 200,
    description: 'Arrival time recorded successfully',
    schema: {
      example: {
        id: 'ASG-001',
        arrival_time: '2025-11-20T08:45:00Z',
        updated_at: '2025-11-20T08:45:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  recordArrival(@Param('id') id: string) {
    return this.assignmentsService.recordArrival(id);
  }

  @Patch(':id/departure')
  @Roles(UserRole.SUPERVISOR, UserRole.VOLUNTEER)
  @ApiOperation({
    summary: 'Record departure time',
    description: 'Record when the supervisor leaves the exam room.',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID', example: 'ASG-001' })
  @ApiResponse({
    status: 200,
    description: 'Departure time recorded successfully',
    schema: {
      example: {
        id: 'ASG-001',
        departure_time: '2025-11-20T11:15:00Z',
        updated_at: '2025-11-20T11:15:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  recordDeparture(@Param('id') id: string) {
    return this.assignmentsService.recordDeparture(id);
  }
}
