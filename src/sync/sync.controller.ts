import { Controller, Post, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SyncService } from './sync.service';

@ApiTags('Synchronization')
@Controller('api/v1/sync')
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Post('exam-halls')
  @ApiOperation({ summary: 'Manually trigger exam halls sync' })
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
  })
  async syncParticipants(@Param('date') date: string) {
    const result = await this.syncService.syncParticipantsForDate(date);
    return {
      success: true,
      message: `Participants sync for ${date} completed`,
      data: result,
    };
  }

  @Post('participants/next-3-days')
  @ApiOperation({ summary: 'Manually trigger participants sync for next 3 days' })
  async syncParticipantsNext3Days() {
    await this.syncService.syncParticipantsScheduled();
    return {
      success: true,
      message: 'Participants sync for next 3 days initiated',
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get sync status' })
  async getSyncStatus() {
    const status = await this.syncService.getSyncStatus();
    return {
      success: true,
      data: status,
    };
  }
}
