import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { Feedback, FeedbackType } from '../../entities/feedback.entity';
import { LoggerService } from '../../common/services/logger.service';
import { createMockLogger } from '../../../test/test-utils';
import { MockType } from '../../../test/types';
import { TreeRepository } from 'typeorm';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let repository: MockType<TreeRepository<Feedback>>;
  let logger: any;

  const mockFeedback: Partial<Feedback> = {
    id: 'feedback-uuid-1',
    authorId: 'user-uuid-1',
    recipientId: 'user-uuid-2',
    assignmentId: 'assignment-uuid-1',
    type: FeedbackType.SUPERVISOR_TO_BM,
    content: 'Great supervision!',
    rating: 5,
    read: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create mock TreeRepository
  const createMockTreeRepository = <T = any>(): MockType<TreeRepository<T>> => ({
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    findTrees: jest.fn(),
    findRoots: jest.fn(),
    findDescendants: jest.fn(),
    findDescendantsTree: jest.fn(),
    findAncestors: jest.fn(),
    findAncestorsTree: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: getRepositoryToken(Feedback),
          useValue: createMockTreeRepository(),
        },
        {
          provide: LoggerService,
          useValue: createMockLogger(),
        },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
    repository = module.get(getRepositoryToken(Feedback));
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createFeedbackDto = {
      authorId: 'user-uuid-1',
      recipientId: 'user-uuid-2',
      assignmentId: 'assignment-uuid-1',
      type: FeedbackType.SUPERVISOR_TO_BM,
      content: 'Great supervision!',
      rating: 5,
    };

    it('should create feedback successfully', async () => {
      repository.create.mockReturnValue(mockFeedback as Feedback);
      repository.save.mockResolvedValue(mockFeedback as Feedback);
      repository.findOne.mockResolvedValue(mockFeedback as Feedback);

      const result = await service.create(createFeedbackDto);

      expect(repository.create).toHaveBeenCalledWith(createFeedbackDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockFeedback);
    });

    it('should create feedback without optional fields', async () => {
      const minimalDto = {
        authorId: 'user-uuid-1',
        type: FeedbackType.SUPERVISOR_TO_EM,
        content: 'Need assistance',
      };

      const minimalFeedback = {
        ...mockFeedback,
        recipientId: undefined,
        assignmentId: undefined,
        rating: undefined,
      };

      repository.create.mockReturnValue(minimalFeedback as Feedback);
      repository.save.mockResolvedValue(minimalFeedback as Feedback);
      repository.findOne.mockResolvedValue(minimalFeedback as Feedback);

      const result = await service.create(minimalDto);

      expect(repository.create).toHaveBeenCalledWith(minimalDto);
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all feedback', async () => {
      const feedbacks = [mockFeedback, { ...mockFeedback, id: 'feedback-uuid-2' }];
      repository.find.mockResolvedValue(feedbacks);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: ['author', 'recipient', 'assignment'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(feedbacks);
    });
  });

  describe('findOne', () => {
    it('should return feedback by id', async () => {
      repository.findOne.mockResolvedValue(mockFeedback);

      const result = await service.findOne('feedback-uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'feedback-uuid-1' },
        relations: ['author', 'recipient', 'assignment', 'replies'],
      });
      expect(result).toEqual(mockFeedback);
    });

    it('should throw NotFoundException if feedback not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateFeedbackDto = {
      content: 'Updated content',
      rating: 4,
    };

    it('should update feedback successfully', async () => {
      const updatedFeedback = {
        ...mockFeedback,
        content: 'Updated content',
        rating: 4,
      };

      repository.findOne
        .mockResolvedValueOnce(mockFeedback)
        .mockResolvedValueOnce(updatedFeedback);
      repository.save.mockResolvedValue(updatedFeedback as Feedback);

      const result = await service.update('feedback-uuid-1', updateFeedbackDto);

      expect(repository.save).toHaveBeenCalled();
      expect(result.content).toBe('Updated content');
      expect(result.rating).toBe(4);
    });

    it('should throw NotFoundException if feedback not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', updateFeedbackDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove feedback', async () => {
      repository.findOne.mockResolvedValue(mockFeedback);
      repository.remove.mockResolvedValue(mockFeedback);

      await service.remove('feedback-uuid-1');

      expect(repository.remove).toHaveBeenCalledWith(mockFeedback);
    });

    it('should throw NotFoundException if feedback not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark feedback as read', async () => {
      const readFeedback = { ...mockFeedback, read: true };

      repository.findOne
        .mockResolvedValueOnce(mockFeedback)
        .mockResolvedValueOnce(readFeedback);
      repository.save.mockResolvedValue(readFeedback as Feedback);

      const result = await service.markAsRead('feedback-uuid-1');

      expect(result.read).toBe(true);
    });

    it('should throw NotFoundException if feedback not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.markAsRead('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
