import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { Assignment } from '../../entities/assignment.entity';
import { User } from '../../entities/user.entity';
import { Room } from '../../entities/room.entity';
import { Exam } from '../../entities/exam.entity';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([Assignment, User, Room, Exam])],
  controllers: [AssignmentsController],
  providers: [AssignmentsService, LoggerService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
