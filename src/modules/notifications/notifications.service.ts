import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationPriority } from '../../entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private logger: LoggerService,
  ) {
    this.logger.setContext('NotificationsService');
  }

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      priority: createNotificationDto.priority || NotificationPriority.MEDIUM,
    });
    const saved = await this.notificationRepository.save(notification);
    this.logger.log(`Notification created: ${saved.id}`);
    return saved;
  }

  async findAll(userId?: string) {
    const where = userId ? { userId } : {};
    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return notification;
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.findOne(id);
    Object.assign(notification, updateNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async remove(id: string): Promise<void> {
    const notification = await this.findOne(id);
    await this.notificationRepository.remove(notification);
    this.logger.log(`Notification deleted: ${id}`);
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.findOne(id);
    notification.read = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true, readAt: new Date() },
    );
    this.logger.log(`All notifications marked as read for user ${userId}`);
  }
}
