import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  Notification,
  NotificationType,
  NotificationPriority,
} from '../../entities/notification.entity';
import { LoggerService } from '../../common/services/logger.service';
import { createMockRepository, createMockLogger } from '../../../test/test-utils';
import { MockType } from '../../../test/types';
import { Repository } from 'typeorm';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: MockType<Repository<Notification>>;
  let logger: any;

  const mockNotification: Partial<Notification> = {
    id: 'notification-uuid-1',
    userId: 'user-uuid-1',
    type: NotificationType.ASSIGNMENT_OFFER,
    priority: NotificationPriority.HIGH,
    title: 'New Assignment',
    message: 'You have been assigned to Room 101',
    metadata: { assignmentId: 'assignment-uuid-1' },
    read: false,
    readAt: null,
    emailSent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: createMockRepository(),
        },
        {
          provide: LoggerService,
          useValue: createMockLogger(),
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repository = module.get(getRepositoryToken(Notification));
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createNotificationDto = {
      userId: 'user-uuid-1',
      type: NotificationType.ASSIGNMENT_OFFER,
      priority: NotificationPriority.HIGH,
      title: 'New Assignment',
      message: 'You have been assigned to Room 101',
      metadata: { assignmentId: 'assignment-uuid-1' },
    };

    it('should create notification successfully', async () => {
      repository.create.mockReturnValue(mockNotification as Notification);
      repository.save.mockResolvedValue(mockNotification as Notification);

      const result = await service.create(createNotificationDto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createNotificationDto,
          priority: NotificationPriority.HIGH,
        }),
      );
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });

    it('should default to MEDIUM priority if not provided', async () => {
      const dtoWithoutPriority = {
        userId: 'user-uuid-1',
        type: NotificationType.SYSTEM_MESSAGE,
        title: 'System Notification',
        message: 'System maintenance scheduled',
      };

      const notificationWithDefaultPriority = {
        ...mockNotification,
        priority: NotificationPriority.MEDIUM,
      };

      repository.create.mockReturnValue(notificationWithDefaultPriority as Notification);
      repository.save.mockResolvedValue(notificationWithDefaultPriority as Notification);

      const result = await service.create(dtoWithoutPriority);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: NotificationPriority.MEDIUM,
        }),
      );
      expect(result.priority).toBe(NotificationPriority.MEDIUM);
    });

    it('should create notification without metadata', async () => {
      const minimalDto = {
        userId: 'user-uuid-1',
        type: NotificationType.EXAM_REMINDER,
        title: 'Exam Reminder',
        message: 'Exam starts in 1 hour',
      };

      const minimalNotification = {
        ...mockNotification,
        metadata: undefined,
      };

      repository.create.mockReturnValue(minimalNotification as Notification);
      repository.save.mockResolvedValue(minimalNotification as Notification);

      const result = await service.create(minimalDto);

      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all notifications when userId not provided', async () => {
      const notifications = [
        mockNotification,
        { ...mockNotification, id: 'notification-uuid-2' },
      ];
      repository.find.mockResolvedValue(notifications);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(notifications);
    });

    it('should filter by userId when provided', async () => {
      const userNotifications = [mockNotification];
      repository.find.mockResolvedValue(userNotifications);

      const result = await service.findAll('user-uuid-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(userNotifications);
    });
  });

  describe('findOne', () => {
    it('should return notification by id', async () => {
      repository.findOne.mockResolvedValue(mockNotification);

      const result = await service.findOne('notification-uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'notification-uuid-1' },
      });
      expect(result).toEqual(mockNotification);
    });

    it('should throw NotFoundException if notification not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateNotificationDto = {
      title: 'Updated Title',
      message: 'Updated message',
    };

    it('should update notification successfully', async () => {
      const updatedNotification = {
        ...mockNotification,
        title: 'Updated Title',
        message: 'Updated message',
      };

      repository.findOne.mockResolvedValue(mockNotification);
      repository.save.mockResolvedValue(updatedNotification as Notification);

      const result = await service.update(
        'notification-uuid-1',
        updateNotificationDto,
      );

      expect(repository.save).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
      expect(result.message).toBe('Updated message');
    });

    it('should throw NotFoundException if notification not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', updateNotificationDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove notification', async () => {
      repository.findOne.mockResolvedValue(mockNotification);
      repository.remove.mockResolvedValue(mockNotification);

      await service.remove('notification-uuid-1');

      expect(repository.remove).toHaveBeenCalledWith(mockNotification);
    });

    it('should throw NotFoundException if notification not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read with timestamp', async () => {
      const readNotification = {
        ...mockNotification,
        read: true,
        readAt: new Date(),
      };

      repository.findOne.mockResolvedValue(mockNotification);
      repository.save.mockResolvedValue(readNotification as Notification);

      const result = await service.markAsRead('notification-uuid-1');

      expect(result.read).toBe(true);
      expect(result.readAt).toBeDefined();
    });

    it('should throw NotFoundException if notification not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.markAsRead('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for user', async () => {
      repository.update.mockResolvedValue({ affected: 3 } as any);

      await service.markAllAsRead('user-uuid-1');

      expect(repository.update).toHaveBeenCalledWith(
        { userId: 'user-uuid-1', read: false },
        { read: true, readAt: expect.any(Date) },
      );
    });

    it('should handle case when no unread notifications exist', async () => {
      repository.update.mockResolvedValue({ affected: 0 } as any);

      await service.markAllAsRead('user-uuid-1');

      expect(repository.update).toHaveBeenCalled();
    });
  });
});
