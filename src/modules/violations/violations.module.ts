import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViolationsController } from './violations.controller';
import { ViolationsService } from './violations.service';
import { Violation } from '../../entities/violation.entity';
import { Assignment } from '../../entities/assignment.entity';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([Violation, Assignment])],
  controllers: [ViolationsController],
  providers: [ViolationsService, LoggerService],
  exports: [ViolationsService],
})
export class ViolationsModule {}
