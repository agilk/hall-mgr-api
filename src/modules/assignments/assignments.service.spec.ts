import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { Assignment, AssignmentStatus } from '../../entities/assignment.entity';
import { User } from '../../entities/user.entity';
import { Room } from '../../entities/room.entity';
import { Exam } from '../../entities/exam.entity';
import { LoggerService } from '../../common/services/logger.service';
import { createMockRepository, createMockLogger } from '../../../test/test-utils';
import { MockType } from '../../../test/types';
import { Repository } from 'typeorm';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let assignmentRepository: MockType<Repository<Assignment>>;
  let userRepository: MockType<Repository<User>>;
  let roomRepository: MockType<Repository<Room>>;
  let examRepository: MockType<Repository<Exam>>;
  let logger: any;

  const mockUser: Partial<User> = {
    id: 1,
    username: 'supervisor1',
    fullName: 'John Supervisor',
  };

  const mockRoom: Partial<Room> = {
    id: 'room-uuid-1',
    number: 'R101',
    name: 'Room 101',
  };

  const mockExam: Partial<Exam> = {
    id: 'exam-uuid-1',
    name: 'Midterm Exam',
  };

  const mockAssignment: Partial<Assignment> = {
    id: 'assignment-uuid-1',
    supervisorId: '1',
    roomId: 'room-uuid-1',
    examId: 'exam-uuid-1',
    status: AssignmentStatus.PENDING,
    noSupervisorNeeded: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        {
          provide: getRepositoryToken(Assignment),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Room),
          useValue: createMockRepository(),
        },
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

    service = module.get<AssignmentsService>(AssignmentsService);
    assignmentRepository = module.get(getRepositoryToken(Assignment));
    userRepository = module.get(getRepositoryToken(User));
    roomRepository = module.get(getRepositoryToken(Room));
    examRepository = module.get(getRepositoryToken(Exam));
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createAssignmentDto = {
      supervisorId: '1',
      roomId: 'room-uuid-1',
      examId: 'exam-uuid-1',
      noSupervisorNeeded: false,
    };

    it('should create an assignment successfully', async () => {
      examRepository.findOne.mockResolvedValue(mockExam);
      roomRepository.findOne.mockResolvedValue(mockRoom);
      userRepository.findOne.mockResolvedValue(mockUser);
      assignmentRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockAssignment);
      assignmentRepository.create.mockReturnValue(mockAssignment as Assignment);
      assignmentRepository.save.mockResolvedValue(mockAssignment as Assignment);

      const result = await service.create(createAssignmentDto);

      expect(examRepository.findOne).toHaveBeenCalled();
      expect(roomRepository.findOne).toHaveBeenCalled();
      expect(userRepository.findOne).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if exam not found', async () => {
      examRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createAssignmentDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if room not found', async () => {
      examRepository.findOne.mockResolvedValue(mockExam);
      roomRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createAssignmentDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if supervisor not found', async () => {
      examRepository.findOne.mockResolvedValue(mockExam);
      roomRepository.findOne.mockResolvedValue(mockRoom);
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createAssignmentDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if supervisor not provided and noSupervisorNeeded is false', async () => {
      examRepository.findOne.mockResolvedValue(mockExam);
      roomRepository.findOne.mockResolvedValue(mockRoom);

      await expect(
        service.create({
          ...createAssignmentDto,
          supervisorId: undefined,
          noSupervisorNeeded: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow creation without supervisor if noSupervisorNeeded is true', async () => {
      const dtoWithoutSupervisor = {
        ...createAssignmentDto,
        supervisorId: undefined,
        noSupervisorNeeded: true,
      };

      examRepository.findOne.mockResolvedValue(mockExam);
      roomRepository.findOne.mockResolvedValue(mockRoom);
      assignmentRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockAssignment);
      assignmentRepository.create.mockReturnValue(mockAssignment as Assignment);
      assignmentRepository.save.mockResolvedValue(mockAssignment as Assignment);

      const result = await service.create(dtoWithoutSupervisor);

      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ConflictException if assignment already exists', async () => {
      examRepository.findOne.mockResolvedValue(mockExam);
      roomRepository.findOne.mockResolvedValue(mockRoom);
      userRepository.findOne.mockResolvedValue(mockUser);
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);

      await expect(service.create(createAssignmentDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    const queryDto = {
      page: 1,
      limit: 10,
    };

    it('should return paginated assignments', async () => {
      const assignments = [mockAssignment];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([assignments, 1]),
      };

      assignmentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(queryDto);

      expect(result.data).toEqual(assignments);
      expect(result.meta.total).toBe(1);
    });

    it('should apply supervisor filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      assignmentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ ...queryDto, supervisorId: '1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'assignment.supervisorId = :supervisorId',
        { supervisorId: '1' },
      );
    });

    it('should apply exam filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      assignmentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ ...queryDto, examId: 'exam-uuid-1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'assignment.examId = :examId',
        { examId: 'exam-uuid-1' },
      );
    });

    it('should apply status filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      assignmentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ ...queryDto, status: AssignmentStatus.CONFIRMED });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'assignment.status = :status',
        { status: AssignmentStatus.CONFIRMED },
      );
    });
  });

  describe('findOne', () => {
    it('should return an assignment by id', async () => {
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);

      const result = await service.findOne('assignment-uuid-1');

      expect(result).toEqual(mockAssignment);
    });

    it('should throw NotFoundException if assignment not found', async () => {
      assignmentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an assignment successfully', async () => {
      const updateDto = { paymentConfirmed: true };
      const updatedAssignment = { ...mockAssignment, paymentConfirmed: true };

      assignmentRepository.findOne
        .mockResolvedValueOnce(mockAssignment)
        .mockResolvedValueOnce(updatedAssignment);
      assignmentRepository.save.mockResolvedValue(updatedAssignment as Assignment);

      const result = await service.update('assignment-uuid-1', updateDto);

      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should remove an assignment', async () => {
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);
      assignmentRepository.remove.mockResolvedValue(mockAssignment);

      await service.remove('assignment-uuid-1');

      expect(assignmentRepository.remove).toHaveBeenCalledWith(mockAssignment);
    });
  });
});
