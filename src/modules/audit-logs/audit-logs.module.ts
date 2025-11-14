import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { AuditLog } from '../../entities/audit-log.entity';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, LoggerService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
