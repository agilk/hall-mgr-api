import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { Exam, ExamStatus } from '../../entities/exam.entity';
import { LoggerService } from '../../common/services/logger.service';
import { createMockRepository, createMockLogger } from '../../../test/test-utils';
import { MockType } from '../../../test/types';
import { Repository } from 'typeorm';

describe('ExamsService', () => {
  let service: ExamsService;
  let repository: MockType<Repository<Exam>>;
  let logger: any;

  const mockExam: Partial<Exam> = {
    id: 'exam-uuid-1',
    name: 'Midterm Exam',
    description: 'Mathematics midterm',
    examDate: '2024-03-15',
    startTime: '2024-03-15T09:00:00',
    endTime: '2024-03-15T11:00:00',
    status: ExamStatus.SCHEDULED,
    totalParticipants: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        {
          provide: getRepositoryToken(Exam),
          useValue: createMockRepository(),
        },
        {
          provide: LoggerService,
          useValue: createMockLogger(),
        },
      ],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
    repository = module.get(getRepositoryToken(Exam));
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createExamDto = {
      name: 'Final Exam',
      description: 'Physics final',
      examDate: new Date('2024-05-20'),
      startTime: '2024-05-20T14:00:00',
      endTime: '2024-05-20T16:00:00',
    };

    it('should create an exam successfully', async () => {
      repository.create.mockReturnValue(mockExam as Exam);
      repository.save.mockResolvedValue(mockExam as Exam);

      const result = await service.create(createExamDto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createExamDto,
          status: ExamStatus.SCHEDULED,
          totalParticipants: 0,
        }),
      );
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockExam);
    });

    it('should throw BadRequestException if end time is before start time', async () => {
      const invalidDto = {
        ...createExamDto,
        startTime: '2024-05-20T16:00:00',
        endTime: '2024-05-20T14:00:00',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use provided status and totalParticipants', async () => {
      const dtoWithValues = {
        ...createExamDto,
        status: ExamStatus.IN_PROGRESS,
        totalParticipants: 50,
      };

      repository.create.mockReturnValue(mockExam as Exam);
      repository.save.mockResolvedValue(mockExam as Exam);

      await service.create(dtoWithValues);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ExamStatus.IN_PROGRESS,
          totalParticipants: 50,
        }),
      );
    });
  });

  describe('findAll', () => {
    const queryDto = {
      page: 1,
      limit: 10,
    };

    it('should return paginated exams', async () => {
      const exams = [mockExam];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([exams, 1]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(queryDto);

      expect(result.data).toEqual(exams);
      expect(result.meta.total).toBe(1);
    });

    it('should apply status filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ ...queryDto, status: ExamStatus.SCHEDULED });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'exam.status = :status',
        { status: ExamStatus.SCHEDULED },
      );
    });

    it('should apply date range filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const startDate = '2024-03-01';
      const endDate = '2024-03-31';

      await service.findAll({ ...queryDto, startDate, endDate });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'exam.examDate BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    });

    it('should apply only start date filter if end date not provided', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const startDate = '2024-03-01';

      await service.findAll({ ...queryDto, startDate });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'exam.examDate >= :startDate',
        { startDate },
      );
    });
  });

  describe('findOne', () => {
    it('should return an exam by id', async () => {
      repository.findOne.mockResolvedValue(mockExam);

      const result = await service.findOne('exam-uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'exam-uuid-1' },
        relations: expect.arrayContaining([
          'assignments',
          'assignments.supervisor',
          'attendances',
        ]),
      });
      expect(result).toEqual(mockExam);
    });

    it('should throw NotFoundException if exam not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      description: 'Updated description',
    };

    it('should update an exam successfully', async () => {
      const updatedExam = { ...mockExam, description: 'Updated description' };
      repository.findOne
        .mockResolvedValueOnce(mockExam)
        .mockResolvedValueOnce(updatedExam);
      repository.save.mockResolvedValue(updatedExam as Exam);

      const result = await service.update('exam-uuid-1', updateDto);

      expect(result.description).toBe('Updated description');
    });

    it('should throw BadRequestException if updated times are invalid', async () => {
      repository.findOne.mockResolvedValue(mockExam);

      await expect(
        service.update('exam-uuid-1', {
          startTime: '2024-03-15T16:00:00',
          endTime: '2024-03-15T14:00:00',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate time when only start time is updated', async () => {
      repository.findOne.mockResolvedValue(mockExam);

      await expect(
        service.update('exam-uuid-1', {
          startTime: '2024-03-15T12:00:00',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate time when only end time is updated', async () => {
      const updatedExam = {
        ...mockExam,
        endTime: '2024-03-15T13:00:00',
      };
      repository.findOne
        .mockResolvedValueOnce(mockExam)
        .mockResolvedValueOnce(updatedExam);
      repository.save.mockResolvedValue(updatedExam as Exam);

      const result = await service.update('exam-uuid-1', {
        endTime: '2024-03-15T13:00:00',
      });

      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should remove an exam', async () => {
      repository.findOne.mockResolvedValue(mockExam);
      repository.remove.mockResolvedValue(mockExam);

      await service.remove('exam-uuid-1');

      expect(repository.remove).toHaveBeenCalledWith(mockExam);
    });

    it('should throw NotFoundException if exam not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update exam status', async () => {
      const updatedExam = { ...mockExam, status: ExamStatus.IN_PROGRESS };
      repository.findOne
        .mockResolvedValueOnce(mockExam)
        .mockResolvedValueOnce(updatedExam);
      repository.save.mockResolvedValue(updatedExam as Exam);

      const result = await service.updateStatus(
        'exam-uuid-1',
        ExamStatus.IN_PROGRESS,
      );

      expect(result.status).toBe(ExamStatus.IN_PROGRESS);
    });
  });

  describe('startExam', () => {
    it('should start an exam', async () => {
      const updatedExam = { ...mockExam, status: ExamStatus.IN_PROGRESS };
      repository.findOne
        .mockResolvedValueOnce(mockExam)
        .mockResolvedValueOnce(updatedExam);
      repository.save.mockResolvedValue(updatedExam as Exam);

      const result = await service.startExam('exam-uuid-1');

      expect(result.status).toBe(ExamStatus.IN_PROGRESS);
    });
  });

  describe('completeExam', () => {
    it('should complete an exam', async () => {
      const updatedExam = { ...mockExam, status: ExamStatus.COMPLETED };
      repository.findOne
        .mockResolvedValueOnce(mockExam)
        .mockResolvedValueOnce(updatedExam);
      repository.save.mockResolvedValue(updatedExam as Exam);

      const result = await service.completeExam('exam-uuid-1');

      expect(result.status).toBe(ExamStatus.COMPLETED);
    });
  });

  describe('cancelExam', () => {
    it('should cancel an exam', async () => {
      const updatedExam = { ...mockExam, status: ExamStatus.CANCELLED };
      repository.findOne
        .mockResolvedValueOnce(mockExam)
        .mockResolvedValueOnce(updatedExam);
      repository.save.mockResolvedValue(updatedExam as Exam);

      const result = await service.cancelExam('exam-uuid-1');

      expect(result.status).toBe(ExamStatus.CANCELLED);
    });
  });

  describe('getUpcomingExams', () => {
    it('should return upcoming exams within default 7 days', async () => {
      const upcomingExams = [mockExam];
      repository.find.mockResolvedValue(upcomingExams);

      const result = await service.getUpcomingExams();

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ExamStatus.SCHEDULED,
          }),
        }),
      );
      expect(result).toEqual(upcomingExams);
    });

    it('should accept custom number of days', async () => {
      repository.find.mockResolvedValue([]);

      await service.getUpcomingExams(14);

      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('getTodayExams', () => {
    it('should return exams for today', async () => {
      const todayExams = [mockExam];
      repository.find.mockResolvedValue(todayExams);

      const result = await service.getTodayExams();

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            examDate: expect.any(Date),
          }),
        }),
      );
      expect(result).toEqual(todayExams);
    });
  });
});
