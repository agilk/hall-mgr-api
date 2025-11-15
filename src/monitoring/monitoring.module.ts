import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { User } from '../entities/user.entity';
import { Exam } from '../entities/exam.entity';
import { Assignment } from '../entities/assignment.entity';
import { Violation } from '../entities/violation.entity';
import { Document } from '../entities/document.entity';
import { AuditLog } from '../entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Exam,
      Assignment,
      Violation,
      Document,
      AuditLog,
    ]),
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService],
})
export class MonitoringModule {}
