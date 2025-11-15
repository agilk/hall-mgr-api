import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Attendance, AttendanceStatus } from '../../entities/attendance.entity';
import { Exam } from '../../entities/exam.entity';
import { Room } from '../../entities/room.entity';
import { LoggerService } from '../../common/services/logger.service';
import { createMockRepository, createMockLogger } from '../../../test/test-utils';
import { MockType } from '../../../test/types';
import { Repository } from 'typeorm';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceRepository: MockType<Repository<Attendance>>;
  let examRepository: MockType<Repository<Exam>>;
  let roomRepository: MockType<Repository<Room>>;
  let logger: any;

  const mockExam: Partial<Exam> = {
    id: 'exam-uuid-1',
    name: 'Midterm Exam',
  };

  const mockRoom: Partial<Room> = {
    id: 'room-uuid-1',
    number: 'R101',
  };

  const mockAttendance: Partial<Attendance> = {
    id: 'attendance-uuid-1',
    examId: 'exam-uuid-1',
    roomId: 'room-uuid-1',
    participantName: 'John Student',
    participantId: 'STU123',
    status: AttendanceStatus.PRESENT,
    markedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getRepositoryToken(Attendance),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Exam),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Room),
          useValue: createMockRepository(),
        },
        {
          provide: LoggerService,
          useValue: createMockLogger(),
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    attendanceRepository = module.get(getRepositoryToken(Attendance));
    examRepository = module.get(getRepositoryToken(Exam));
    roomRepository = module.get(getRepositoryToken(Room));
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createAttendanceDto = {
      examId: 'exam-uuid-1',
      roomId: 'room-uuid-1',
      participantName: 'Jane Student',
      participantId: 'STU124',
      status: AttendanceStatus.PRESENT,
    };

    it('should create attendance successfully', async () => {
      examRepository.findOne.mockResolvedValue(mockExam);
      roomRepository.findOne.mockResolvedValue(mockRoom);
      attendanceRepository.create.mockReturnValue(mockAttendance as Attendance);
      attendanceRepository.save.mockResolvedValue(mockAttendance as Attendance);
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);

      const result = await service.create(createAttendanceDto);

      expect(examRepository.findOne).toHaveBeenCalled();
      expect(roomRepository.findOne).toHaveBeenCalled();
      expect(attendanceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createAttendanceDto,
          markedAt: expect.any(Date),
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if exam not found', async () => {
      examRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createAttendanceDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if room not found', async () => {
      examRepository.findOne.mockResolvedValue(mockExam);
      roomRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createAttendanceDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should set default status to PRESENT if not provided', async () => {
      const dtoWithoutStatus = {
        examId: 'exam-uuid-1',
        roomId: 'room-uuid-1',
        participantName: 'Jane Student',
        participantId: 'STU124',
      };

      examRepository.findOne.mockResolvedValue(mockExam);
      roomRepository.findOne.mockResolvedValue(mockRoom);
      attendanceRepository.create.mockReturnValue(mockAttendance as Attendance);
      attendanceRepository.save.mockResolvedValue(mockAttendance as Attendance);
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);

      await service.create(dtoWithoutStatus);

      expect(attendanceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AttendanceStatus.PRESENT,
        }),
      );
    });
  });

  describe('findAll', () => {
    const queryDto = {
      page: 1,
      limit: 10,
    };

    it('should return paginated attendance records', async () => {
      const attendances = [mockAttendance];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([attendances, 1]),
      };

      attendanceRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(queryDto);

      expect(result.data).toEqual(attendances);
      expect(result.meta.total).toBe(1);
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

      attendanceRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ ...queryDto, examId: 'exam-uuid-1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'attendance.examId = :examId',
        { examId: 'exam-uuid-1' },
      );
    });

    it('should apply room filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      attendanceRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ ...queryDto, roomId: 'room-uuid-1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'attendance.roomId = :roomId',
        { roomId: 'room-uuid-1' },
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

      attendanceRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ ...queryDto, status: AttendanceStatus.ABSENT });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'attendance.status = :status',
        { status: AttendanceStatus.ABSENT },
      );
    });

    it('should apply participant name filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      attendanceRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ ...queryDto, participantName: 'John' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'attendance.participantName ILIKE :participantName',
        { participantName: '%John%' },
      );
    });
  });

  describe('findOne', () => {
    it('should return an attendance record by id', async () => {
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);

      const result = await service.findOne('attendance-uuid-1');

      expect(result).toEqual(mockAttendance);
    });

    it('should throw NotFoundException if attendance not found', async () => {
      attendanceRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an attendance record successfully', async () => {
      const updateDto = { notes: 'Updated notes' };
      const updatedAttendance = { ...mockAttendance, notes: 'Updated notes' };

      attendanceRepository.findOne
        .mockResolvedValueOnce(mockAttendance)
        .mockResolvedValueOnce(updatedAttendance);
      attendanceRepository.save.mockResolvedValue(updatedAttendance as Attendance);

      const result = await service.update('attendance-uuid-1', updateDto);

      expect(result.notes).toBe('Updated notes');
    });
  });

  describe('remove', () => {
    it('should remove an attendance record', async () => {
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);
      attendanceRepository.remove.mockResolvedValue(mockAttendance);

      await service.remove('attendance-uuid-1');

      expect(attendanceRepository.remove).toHaveBeenCalledWith(mockAttendance);
    });
  });
});
