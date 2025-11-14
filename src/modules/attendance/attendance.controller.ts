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
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { AttendanceStatus } from '../../entities/attendance.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Attendance')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(UserRole.SUPERVISOR, UserRole.VOLUNTEER, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Create attendance record',
    description: 'Create a new attendance record for an exam participant.',
  })
  @ApiResponse({
    status: 201,
    description: 'Attendance record created successfully',
    schema: {
      example: {
        id: 'ATT-001',
        exam_id: 'EXM-001',
        room_id: 'RM-001',
        participant_name: 'John Student',
        participant_id: 'STU-12345',
        status: 'present',
        check_in_time: '2025-11-20T08:50:00Z',
        created_at: '2025-11-20T08:50:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendanceService.create(createAttendanceDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all attendance records',
    description: 'Retrieve a paginated list of attendance records with optional filtering by exam, room, or status.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'exam_id', required: false, description: 'Filter by exam ID' })
  @ApiQuery({ name: 'room_id', required: false, description: 'Filter by room ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by attendance status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by participant name or ID' })
  @ApiResponse({
    status: 200,
    description: 'Attendance records retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'ATT-001',
            exam_id: 'EXM-001',
            exam_title: 'Mathematics Final Exam',
            room_id: 'RM-001',
            room_name: 'Room 101',
            participant_name: 'John Student',
            participant_id: 'STU-12345',
            status: 'present',
            check_in_time: '2025-11-20T08:50:00Z',
          },
        ],
        meta: {
          total: 120,
          page: 1,
          limit: 10,
          totalPages: 12,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() query: QueryAttendanceDto) {
    return this.attendanceService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get attendance record by ID',
    description: 'Retrieve detailed information about a specific attendance record.',
  })
  @ApiParam({ name: 'id', description: 'Attendance ID', example: 'ATT-001' })
  @ApiResponse({
    status: 200,
    description: 'Attendance record retrieved successfully',
    schema: {
      example: {
        id: 'ATT-001',
        exam_id: 'EXM-001',
        exam: {
          id: 'EXM-001',
          title: 'Mathematics Final Exam',
          exam_date: '2025-11-20',
        },
        room_id: 'RM-001',
        room: {
          id: 'RM-001',
          name: 'Room 101',
        },
        participant_name: 'John Student',
        participant_id: 'STU-12345',
        status: 'present',
        check_in_time: '2025-11-20T08:50:00Z',
        check_out_time: null,
        notes: 'Arrived on time',
        created_at: '2025-11-20T08:50:00Z',
        updated_at: '2025-11-20T08:50:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  findOne(@Param('id') id: string) {
    return this.attendanceService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPERVISOR, UserRole.VOLUNTEER, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Update attendance record',
    description: 'Update attendance record information including status and notes.',
  })
  @ApiParam({ name: 'id', description: 'Attendance ID', example: 'ATT-001' })
  @ApiResponse({
    status: 200,
    description: 'Attendance record updated successfully',
    schema: {
      example: {
        id: 'ATT-001',
        status: 'late',
        notes: 'Arrived 15 minutes late',
        updated_at: '2025-11-20T09:15:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  update(
    @Param('id') id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.update(id, updateAttendanceDto);
  }

  @Delete(':id')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete attendance record',
    description: 'Delete an attendance record. Only EXAM_DIRECTOR or BUILDING_MANAGER can perform this action.',
  })
  @ApiParam({ name: 'id', description: 'Attendance ID', example: 'ATT-001' })
  @ApiResponse({ status: 204, description: 'Attendance record deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  remove(@Param('id') id: string) {
    return this.attendanceService.remove(id);
  }

  @Patch(':id/mark/:status')
  @Roles(UserRole.SUPERVISOR, UserRole.VOLUNTEER, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Mark attendance status',
    description: 'Update attendance status. Valid statuses: present, absent, late, excused.',
  })
  @ApiParam({ name: 'id', description: 'Attendance ID', example: 'ATT-001' })
  @ApiParam({ name: 'status', description: 'Attendance status', enum: ['present', 'absent', 'late', 'excused'], example: 'present' })
  @ApiResponse({
    status: 200,
    description: 'Attendance status updated successfully',
    schema: {
      example: {
        id: 'ATT-001',
        status: 'present',
        updated_at: '2025-11-20T09:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid status value' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  markStatus(@Param('id') id: string, @Param('status') status: AttendanceStatus) {
    return this.attendanceService.markStatus(id, status);
  }
}
