import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
import { Feedback } from '../../entities/feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: TreeRepository<Feedback>,
    private logger: LoggerService,
  ) {
    this.logger.setContext('FeedbackService');
  }

  async create(createFeedbackDto: CreateFeedbackDto): Promise<Feedback> {
    const feedback = this.feedbackRepository.create(createFeedbackDto);
    const saved = await this.feedbackRepository.save(feedback);
    this.logger.log(`Feedback created: ${saved.id}`);
    return this.findOne(saved.id);
  }

  async findAll() {
    return this.feedbackRepository.find({
      relations: ['author', 'recipient', 'assignment'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findOne({
      where: { id },
      relations: ['author', 'recipient', 'assignment', 'replies'],
    });
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }
    return feedback;
  }

  async update(id: string, updateFeedbackDto: UpdateFeedbackDto): Promise<Feedback> {
    const feedback = await this.findOne(id);
    Object.assign(feedback, updateFeedbackDto);
    await this.feedbackRepository.save(feedback);
    this.logger.log(`Feedback updated: ${id}`);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const feedback = await this.findOne(id);
    await this.feedbackRepository.remove(feedback);
    this.logger.log(`Feedback deleted: ${id}`);
  }

  async markAsRead(id: string): Promise<Feedback> {
    const feedback = await this.findOne(id);
    feedback.read = true;
    await this.feedbackRepository.save(feedback);
    return this.findOne(id);
  }
}
