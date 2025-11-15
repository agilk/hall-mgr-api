import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@ApiTags('Feedback')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({
    summary: 'Create feedback',
    description: 'Submit feedback or communication message. Supports tree structure with parent-child relationships for conversations.',
  })
  @ApiResponse({
    status: 201,
    description: 'Feedback created successfully',
    schema: {
      example: {
        id: 'FDB-001',
        subject: 'Question about exam schedule',
        message: 'Can we reschedule the exam to a different time?',
        sender_id: 1,
        receiver_id: 2,
        is_read: false,
        parent_id: null,
        created_at: '2025-11-14T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.create(createFeedbackDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all feedback',
    description: 'Retrieve all feedback messages. Returns conversation threads with parent-child relationships.',
  })
  @ApiResponse({
    status: 200,
    description: 'Feedback retrieved successfully',
    schema: {
      example: [
        {
          id: 'FDB-001',
          subject: 'Question about exam schedule',
          message: 'Can we reschedule the exam to a different time?',
          sender_id: 1,
          sender_name: 'John Supervisor',
          receiver_id: 2,
          receiver_name: 'Building Manager',
          is_read: true,
          parent_id: null,
          replies_count: 2,
          created_at: '2025-11-14T10:00:00Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll() {
    return this.feedbackService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get feedback by ID',
    description: 'Retrieve a specific feedback message including sender, receiver, and reply thread.',
  })
  @ApiParam({ name: 'id', description: 'Feedback ID', example: 'FDB-001' })
  @ApiResponse({
    status: 200,
    description: 'Feedback retrieved successfully',
    schema: {
      example: {
        id: 'FDB-001',
        subject: 'Question about exam schedule',
        message: 'Can we reschedule the exam to a different time?',
        sender_id: 1,
        sender: {
          id: 1,
          full_name: 'John Supervisor',
          email: 'john@example.com',
        },
        receiver_id: 2,
        receiver: {
          id: 2,
          full_name: 'Building Manager',
          email: 'manager@example.com',
        },
        is_read: true,
        parent_id: null,
        replies: [
          {
            id: 'FDB-002',
            message: 'Yes, we can discuss alternative times.',
            sender_name: 'Building Manager',
            created_at: '2025-11-14T11:00:00Z',
          },
        ],
        created_at: '2025-11-14T10:00:00Z',
        updated_at: '2025-11-14T12:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  findOne(@Param('id') id: string) {
    return this.feedbackService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update feedback',
    description: 'Update feedback message. Only the sender can update their own messages.',
  })
  @ApiParam({ name: 'id', description: 'Feedback ID', example: 'FDB-001' })
  @ApiResponse({
    status: 200,
    description: 'Feedback updated successfully',
    schema: {
      example: {
        id: 'FDB-001',
        subject: 'Updated: Question about exam schedule',
        message: 'Can we reschedule the exam to next Monday?',
        updated_at: '2025-11-14T13:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  update(@Param('id') id: string, @Body() updateFeedbackDto: UpdateFeedbackDto) {
    return this.feedbackService.update(id, updateFeedbackDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete feedback',
    description: 'Delete a feedback message. Only the sender or EXAM_DIRECTOR can delete messages.',
  })
  @ApiParam({ name: 'id', description: 'Feedback ID', example: 'FDB-001' })
  @ApiResponse({ status: 204, description: 'Feedback deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  remove(@Param('id') id: string) {
    return this.feedbackService.remove(id);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark feedback as read',
    description: 'Mark a feedback message as read. Only the receiver can mark messages as read.',
  })
  @ApiParam({ name: 'id', description: 'Feedback ID', example: 'FDB-001' })
  @ApiResponse({
    status: 200,
    description: 'Feedback marked as read successfully',
    schema: {
      example: {
        id: 'FDB-001',
        is_read: true,
        updated_at: '2025-11-14T14:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  markAsRead(@Param('id') id: string) {
    return this.feedbackService.markAsRead(id);
  }
}
