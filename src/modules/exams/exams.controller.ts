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
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { QueryExamDto } from './dto/query-exam.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Exams')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Create a new exam',
    description: 'Create a new exam with schedule, room assignments, and metadata.',
  })
  @ApiResponse({
    status: 201,
    description: 'Exam created successfully',
    schema: {
      example: {
        id: 'EXM-001',
        title: 'Mathematics Final Exam',
        code: 'MATH-101-FINAL',
        exam_date: '2025-11-20',
        start_time: '09:00',
        end_time: '11:00',
        duration_minutes: 120,
        status: 'scheduled',
        room_id: 'RM-001',
        created_at: '2025-11-14T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  create(@Body() createExamDto: CreateExamDto) {
    return this.examsService.create(createExamDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all exams',
    description: 'Retrieve a paginated list of exams with optional filtering by status, date, or room.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by exam title or code' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by exam status' })
  @ApiQuery({ name: 'room_id', required: false, description: 'Filter by room ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by exam date (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: 'Exams retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'EXM-001',
            title: 'Mathematics Final Exam',
            code: 'MATH-101-FINAL',
            exam_date: '2025-11-20',
            start_time: '09:00',
            end_time: '11:00',
            status: 'scheduled',
            room_name: 'Room 101',
          },
        ],
        meta: {
          total: 30,
          page: 1,
          limit: 10,
          totalPages: 3,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() query: QueryExamDto) {
    return this.examsService.findAll(query);
  }

  @Get('upcoming')
  @ApiOperation({
    summary: 'Get upcoming exams',
    description: 'Retrieve exams scheduled in the next N days (default: 7 days).',
  })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days ahead (default: 7)', example: 7 })
  @ApiResponse({
    status: 200,
    description: 'Upcoming exams retrieved successfully',
    schema: {
      example: [
        {
          id: 'EXM-001',
          title: 'Mathematics Final Exam',
          code: 'MATH-101-FINAL',
          exam_date: '2025-11-20',
          start_time: '09:00',
          status: 'scheduled',
          room_name: 'Room 101',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUpcomingExams(@Query('days') days?: number) {
    return this.examsService.getUpcomingExams(days);
  }

  @Get('today')
  @ApiOperation({
    summary: 'Get today\'s exams',
    description: 'Retrieve all exams scheduled for today.',
  })
  @ApiResponse({
    status: 200,
    description: 'Today\'s exams retrieved successfully',
    schema: {
      example: [
        {
          id: 'EXM-001',
          title: 'Mathematics Final Exam',
          code: 'MATH-101-FINAL',
          exam_date: '2025-11-14',
          start_time: '09:00',
          end_time: '11:00',
          status: 'in_progress',
          room_name: 'Room 101',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTodayExams() {
    return this.examsService.getTodayExams();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get exam by ID',
    description: 'Retrieve detailed information about a specific exam including room, assignments, and participants.',
  })
  @ApiParam({ name: 'id', description: 'Exam ID', example: 'EXM-001' })
  @ApiResponse({
    status: 200,
    description: 'Exam retrieved successfully',
    schema: {
      example: {
        id: 'EXM-001',
        title: 'Mathematics Final Exam',
        code: 'MATH-101-FINAL',
        exam_date: '2025-11-20',
        start_time: '09:00',
        end_time: '11:00',
        duration_minutes: 120,
        status: 'scheduled',
        room_id: 'RM-001',
        room: {
          id: 'RM-001',
          name: 'Room 101',
          capacity: 30,
        },
        assignments: [],
        created_at: '2025-11-14T10:00:00Z',
        updated_at: '2025-11-14T12:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  findOne(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Update exam',
    description: 'Update exam information including schedule, room, and metadata.',
  })
  @ApiParam({ name: 'id', description: 'Exam ID', example: 'EXM-001' })
  @ApiResponse({
    status: 200,
    description: 'Exam updated successfully',
    schema: {
      example: {
        id: 'EXM-001',
        title: 'Mathematics Final Exam - Updated',
        exam_date: '2025-11-21',
        start_time: '10:00',
        updated_at: '2025-11-14T13:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  update(@Param('id') id: string, @Body() updateExamDto: UpdateExamDto) {
    return this.examsService.update(id, updateExamDto);
  }

  @Delete(':id')
  @Roles(UserRole.EXAM_DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete exam',
    description: 'Delete an exam. Only EXAM_DIRECTOR can perform this action.',
  })
  @ApiParam({ name: 'id', description: 'Exam ID', example: 'EXM-001' })
  @ApiResponse({ status: 204, description: 'Exam deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  remove(@Param('id') id: string) {
    return this.examsService.remove(id);
  }

  @Patch(':id/start')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Start exam',
    description: 'Mark an exam as started. Changes status from scheduled to in_progress.',
  })
  @ApiParam({ name: 'id', description: 'Exam ID', example: 'EXM-001' })
  @ApiResponse({
    status: 200,
    description: 'Exam started successfully',
    schema: {
      example: {
        id: 'EXM-001',
        status: 'in_progress',
        started_at: '2025-11-20T09:00:00Z',
        updated_at: '2025-11-20T09:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  @ApiResponse({ status: 400, description: 'Exam cannot be started (invalid status)' })
  startExam(@Param('id') id: string) {
    return this.examsService.startExam(id);
  }

  @Patch(':id/complete')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Complete exam',
    description: 'Mark an exam as completed. Changes status from in_progress to completed.',
  })
  @ApiParam({ name: 'id', description: 'Exam ID', example: 'EXM-001' })
  @ApiResponse({
    status: 200,
    description: 'Exam completed successfully',
    schema: {
      example: {
        id: 'EXM-001',
        status: 'completed',
        completed_at: '2025-11-20T11:00:00Z',
        updated_at: '2025-11-20T11:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  @ApiResponse({ status: 400, description: 'Exam cannot be completed (invalid status)' })
  completeExam(@Param('id') id: string) {
    return this.examsService.completeExam(id);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.EXAM_DIRECTOR)
  @ApiOperation({
    summary: 'Cancel exam',
    description: 'Cancel an exam. Only EXAM_DIRECTOR can perform this action.',
  })
  @ApiParam({ name: 'id', description: 'Exam ID', example: 'EXM-001' })
  @ApiResponse({
    status: 200,
    description: 'Exam cancelled successfully',
    schema: {
      example: {
        id: 'EXM-001',
        status: 'cancelled',
        cancelled_at: '2025-11-19T10:00:00Z',
        updated_at: '2025-11-19T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  cancelExam(@Param('id') id: string) {
    return this.examsService.cancelExam(id);
  }
}
