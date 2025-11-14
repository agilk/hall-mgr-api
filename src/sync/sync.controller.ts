import { Controller, Post, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SyncService } from './sync.service';

@ApiTags('Synchronization')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/sync')
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Post('exam-halls')
  @ApiOperation({
    summary: 'Manually trigger exam halls sync',
    description: 'Synchronizes exam halls and rooms from the external exam management system. This endpoint should be used when immediate synchronization is required outside of the scheduled 2 AM daily sync.'
  })
  @ApiResponse({
    status: 201,
    description: 'Exam halls sync completed successfully',
    schema: {
      example: {
        success: true,
        message: 'Exam halls sync completed',
        data: {
          buildingsCreated: 5,
          buildingsUpdated: 10,
          roomsCreated: 25,
          roomsUpdated: 30,
          duration: '2.5s',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Synchronization failed' })
  async syncExamHalls() {
    const result = await this.syncService.performExamHallsSync();
    return {
      success: true,
      message: 'Exam halls sync completed',
      data: result,
    };
  }

  @Post('participants/:date')
  @ApiOperation({
    summary: 'Manually trigger participants sync for a specific date',
    description: 'Synchronizes room participants from the external system for a specific exam date. Date format should be YYYY-MM-DD.',
  })
  @ApiParam({
    name: 'date',
    description: 'Exam date in YYYY-MM-DD format',
    example: '2025-11-15',
  })
  @ApiResponse({
    status: 201,
    description: 'Participants sync completed successfully',
    schema: {
      example: {
        success: true,
        message: 'Participants sync for 2025-11-15 completed',
        data: {
          participantsCreated: 150,
          participantsUpdated: 50,
          roomsProcessed: 20,
          duration: '1.8s',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid date format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Synchronization failed' })
  async syncParticipants(@Param('date') date: string) {
    const result = await this.syncService.syncParticipantsForDate(date);
    return {
      success: true,
      message: `Participants sync for ${date} completed`,
      data: result,
    };
  }

  @Post('participants/next-3-days')
  @ApiOperation({
    summary: 'Manually trigger participants sync for next 3 days',
    description: 'Synchronizes room participants for the next 3 days (today, tomorrow, and day after tomorrow). This is the same operation that runs automatically at 3 AM daily.',
  })
  @ApiResponse({
    status: 201,
    description: 'Participants sync for next 3 days initiated successfully',
    schema: {
      example: {
        success: true,
        message: 'Participants sync for next 3 days initiated',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Synchronization failed' })
  async syncParticipantsNext3Days() {
    await this.syncService.syncParticipantsScheduled();
    return {
      success: true,
      message: 'Participants sync for next 3 days initiated',
    };
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get sync status',
    description: 'Retrieves the current synchronization status including the last sync times, statistics, and any errors from recent sync operations.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync status retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          lastExamHallsSync: '2025-11-14T02:00:00Z',
          lastParticipantsSync: '2025-11-14T03:00:00Z',
          totalBuildings: 15,
          totalRooms: 55,
          totalParticipants: 450,
          recentErrors: [],
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSyncStatus() {
    const status = await this.syncService.getSyncStatus();
    return {
      success: true,
      data: status,
    };
  }
}
