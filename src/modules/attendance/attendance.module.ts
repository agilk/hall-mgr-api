import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { Attendance } from '../../entities/attendance.entity';
import { Exam } from '../../entities/exam.entity';
import { Room } from '../../entities/room.entity';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, Exam, Room])],
  controllers: [AttendanceController],
  providers: [AttendanceService, LoggerService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
