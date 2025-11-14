import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ViolationsService } from './violations.service';
import { Violation, ViolationSeverity, ViolationType } from '../../entities/violation.entity';
import { Assignment } from '../../entities/assignment.entity';
import { LoggerService } from '../../common/services/logger.service';
import { createMockRepository, createMockLogger } from '../../../test/test-utils';
import { MockType } from '../../../test/types';
import { Repository } from 'typeorm';

describe('ViolationsService', () => {
  let service: ViolationsService;
  let violationRepository: MockType<Repository<Violation>>;
  let assignmentRepository: MockType<Repository<Assignment>>;
  let logger: any;

  const mockAssignment: Partial<Assignment> = {
    id: 'assignment-uuid-1',
    supervisorId: '1',
    roomId: 'room-uuid-1',
    examId: 'exam-uuid-1',
  };

  const mockViolation: Partial<Violation> = {
    id: 'violation-uuid-1',
    assignmentId: 'assignment-uuid-1',
    participantName: 'John Student',
    participantId: 'STU123',
    violationType: 'cheating',
    description: 'Caught using unauthorized materials',
    severity: ViolationSeverity.HIGH,
    occurredAt: new Date(),
    resolved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ViolationsService,
        {
          provide: getRepositoryToken(Violation),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Assignment),
          useValue: createMockRepository(),
        },
        {
          provide: LoggerService,
          useValue: createMockLogger(),
        },
      ],
    }).compile();

    service = module.get<ViolationsService>(ViolationsService);
    violationRepository = module.get(getRepositoryToken(Violation));
    assignmentRepository = module.get(getRepositoryToken(Assignment));
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createViolationDto = {
      assignmentId: 'assignment-uuid-1',
      participantName: 'Jane Student',
      participantId: 'STU124',
      type: ViolationType.PROHIBITED_MATERIAL,
      description: 'Using phone during exam',
      severity: ViolationSeverity.MEDIUM,
      reportedBy: 'supervisor-1',
    };

    it('should create a violation successfully', async () => {
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);
      violationRepository.create.mockReturnValue(mockViolation as Violation);
      violationRepository.save.mockResolvedValue(mockViolation as Violation);
      violationRepository.findOne.mockResolvedValue(mockViolation);

      const result = await service.create(createViolationDto);

      expect(assignmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: createViolationDto.assignmentId },
      });
      expect(violationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createViolationDto,
          occurredAt: expect.any(Date),
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if assignment not found', async () => {
      assignmentRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createViolationDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should set default severity to MEDIUM if not provided', async () => {
      const dtoWithoutSeverity = {
        assignmentId: 'assignment-uuid-1',
        participantName: 'Jane Student',
        participantId: 'STU124',
        type: ViolationType.LATE_ARRIVAL,
        description: 'Arrived 10 minutes late',
        reportedBy: 'supervisor-1',
      };

      assignmentRepository.findOne.mockResolvedValue(mockAssignment);
      violationRepository.create.mockReturnValue(mockViolation as Violation);
      violationRepository.save.mockResolvedValue(mockViolation as Violation);
      violationRepository.findOne.mockResolvedValue(mockViolation);

      await service.create(dtoWithoutSeverity);

      expect(violationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: ViolationSeverity.MEDIUM,
        }),
      );
    });

    it('should use provided occurredAt if specified', async () => {
      const customDate = new Date('2024-03-15T10:00:00');
      const dtoWithDate = {
        ...createViolationDto,
        occurredAt: customDate.toISOString(),
      };

      assignmentRepository.findOne.mockResolvedValue(mockAssignment);
      violationRepository.create.mockReturnValue(mockViolation as Violation);
      violationRepository.save.mockResolvedValue(mockViolation as Violation);
      violationRepository.findOne.mockResolvedValue(mockViolation);

      await service.create(dtoWithDate);

      expect(violationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          occurredAt: expect.any(Date),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all violations without filters', async () => {
      const violations = [mockViolation];
      violationRepository.find.mockResolvedValue(violations);

      const result = await service.findAll();

      expect(violationRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: expect.arrayContaining([
          'assignment',
          'assignment.supervisor',
          'assignment.room',
          'assignment.exam',
        ]),
        order: { occurredAt: 'DESC' },
      });
      expect(result).toEqual(violations);
    });

    it('should filter by assignmentId', async () => {
      const violations = [mockViolation];
      violationRepository.find.mockResolvedValue(violations);

      const result = await service.findAll('assignment-uuid-1');

      expect(violationRepository.find).toHaveBeenCalledWith({
        where: { assignmentId: 'assignment-uuid-1' },
        relations: expect.any(Array),
        order: { occurredAt: 'DESC' },
      });
      expect(result).toEqual(violations);
    });

    it('should filter by resolved status', async () => {
      const violations = [mockViolation];
      violationRepository.find.mockResolvedValue(violations);

      const result = await service.findAll(undefined, false);

      expect(violationRepository.find).toHaveBeenCalledWith({
        where: { resolved: false },
        relations: expect.any(Array),
        order: { occurredAt: 'DESC' },
      });
      expect(result).toEqual(violations);
    });

    it('should filter by both assignmentId and resolved status', async () => {
      const violations = [mockViolation];
      violationRepository.find.mockResolvedValue(violations);

      const result = await service.findAll('assignment-uuid-1', true);

      expect(violationRepository.find).toHaveBeenCalledWith({
        where: { assignmentId: 'assignment-uuid-1', resolved: true },
        relations: expect.any(Array),
        order: { occurredAt: 'DESC' },
      });
      expect(result).toEqual(violations);
    });
  });

  describe('findOne', () => {
    it('should return a violation by id', async () => {
      violationRepository.findOne.mockResolvedValue(mockViolation);

      const result = await service.findOne('violation-uuid-1');

      expect(violationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'violation-uuid-1' },
        relations: expect.arrayContaining([
          'assignment',
          'assignment.supervisor',
        ]),
      });
      expect(result).toEqual(mockViolation);
    });

    it('should throw NotFoundException if violation not found', async () => {
      violationRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a violation successfully', async () => {
      const updateDto = { description: 'Updated description' };
      const updatedViolation = {
        ...mockViolation,
        description: 'Updated description',
      };

      violationRepository.findOne
        .mockResolvedValueOnce(mockViolation)
        .mockResolvedValueOnce(updatedViolation);
      violationRepository.save.mockResolvedValue(updatedViolation as Violation);

      const result = await service.update('violation-uuid-1', updateDto);

      expect(violationRepository.save).toHaveBeenCalled();
      expect(result.description).toBe('Updated description');
    });

    it('should throw NotFoundException if violation not found', async () => {
      violationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { description: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a violation', async () => {
      violationRepository.findOne.mockResolvedValue(mockViolation);
      violationRepository.remove.mockResolvedValue(mockViolation);

      await service.remove('violation-uuid-1');

      expect(violationRepository.remove).toHaveBeenCalledWith(mockViolation);
    });

    it('should throw NotFoundException if violation not found', async () => {
      violationRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('resolve', () => {
    it('should resolve a violation with resolution text', async () => {
      const resolution = 'Warning issued to student';
      const resolvedViolation = {
        ...mockViolation,
        resolved: true,
        resolution,
      };

      violationRepository.findOne
        .mockResolvedValueOnce(mockViolation)
        .mockResolvedValueOnce(resolvedViolation);
      violationRepository.save.mockResolvedValue(resolvedViolation as Violation);

      const result = await service.resolve('violation-uuid-1', resolution);

      expect(violationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          resolved: true,
          resolution,
        }),
      );
      expect(result.resolved).toBe(true);
      expect(result.resolution).toBe(resolution);
    });

    it('should throw NotFoundException if violation not found', async () => {
      violationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.resolve('nonexistent', 'resolution'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
