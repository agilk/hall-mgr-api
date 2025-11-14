import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { Feedback } from '../../entities/feedback.entity';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback])],
  controllers: [FeedbackController],
  providers: [FeedbackService, LoggerService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
