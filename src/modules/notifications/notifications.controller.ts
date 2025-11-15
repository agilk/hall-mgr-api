import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create notification',
    description: 'Create a system notification for a specific user or broadcast to multiple users.',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
    schema: {
      example: {
        id: 'NOT-001',
        user_id: 1,
        title: 'New Assignment',
        message: 'You have been assigned to supervise Room 101 on Nov 20',
        type: 'assignment',
        is_read: false,
        created_at: '2025-11-14T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all notifications',
    description: 'Retrieve notifications. Can filter by user ID to get notifications for a specific user.',
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    schema: {
      example: [
        {
          id: 'NOT-001',
          user_id: 1,
          user_name: 'Jane Doe',
          title: 'New Assignment',
          message: 'You have been assigned to supervise Room 101 on Nov 20',
          type: 'assignment',
          is_read: false,
          created_at: '2025-11-14T10:00:00Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query('userId') userId?: string) {
    return this.notificationsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get notification by ID',
    description: 'Retrieve a specific notification with detailed information.',
  })
  @ApiParam({ name: 'id', description: 'Notification ID', example: 'NOT-001' })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
    schema: {
      example: {
        id: 'NOT-001',
        user_id: 1,
        user: {
          id: 1,
          full_name: 'Jane Doe',
          email: 'jane@example.com',
        },
        title: 'New Assignment',
        message: 'You have been assigned to supervise Room 101 on Nov 20',
        type: 'assignment',
        is_read: false,
        read_at: null,
        metadata: {
          assignment_id: 'ASG-001',
          room_name: 'Room 101',
        },
        created_at: '2025-11-14T10:00:00Z',
        updated_at: '2025-11-14T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update notification',
    description: 'Update notification details. Typically used by system administrators.',
  })
  @ApiParam({ name: 'id', description: 'Notification ID', example: 'NOT-001' })
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully',
    schema: {
      example: {
        id: 'NOT-001',
        title: 'Updated: New Assignment',
        message: 'Updated message content',
        updated_at: '2025-11-14T11:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Delete a notification. Only the recipient or system admin can delete notifications.',
  })
  @ApiParam({ name: 'id', description: 'Notification ID', example: 'NOT-001' })
  @ApiResponse({ status: 204, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a single notification as read.',
  })
  @ApiParam({ name: 'id', description: 'Notification ID', example: 'NOT-001' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
    schema: {
      example: {
        id: 'NOT-001',
        is_read: true,
        read_at: '2025-11-14T12:00:00Z',
        updated_at: '2025-11-14T12:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('mark-all-read/:userId')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all notifications for a specific user as read.',
  })
  @ApiParam({ name: 'userId', description: 'User ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read successfully',
    schema: {
      example: {
        message: 'All notifications marked as read',
        count: 5,
        updated_at: '2025-11-14T12:30:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  markAllAsRead(@Param('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
