import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';
import { LoggerService } from '../../common/services/logger.service';
import { createMockRepository, createMockLogger } from '../../../test/test-utils';
import { MockType } from '../../../test/types';
import { Repository } from 'typeorm';

describe('AuditLogsService', () => {
  let service: AuditLogsService;
  let repository: MockType<Repository<AuditLog>>;
  let logger: any;

  const mockAuditLog: Partial<AuditLog> = {
    id: 'audit-uuid-1',
    userId: 'user-uuid-1',
    userEmail: 'supervisor@example.com',
    action: AuditAction.ASSIGNMENT_ACCEPTED,
    entityType: 'Assignment',
    entityId: 'assignment-uuid-1',
    oldValue: { status: 'pending' },
    newValue: { status: 'confirmed' },
    metadata: { examId: 'exam-uuid-1', roomId: 'room-uuid-1' },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: createMockRepository(),
        },
        {
          provide: LoggerService,
          useValue: createMockLogger(),
        },
      ],
    }).compile();

    service = module.get<AuditLogsService>(AuditLogsService);
    repository = module.get(getRepositoryToken(AuditLog));
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createAuditLogDto = {
      userId: 'user-uuid-1',
      userEmail: 'supervisor@example.com',
      action: AuditAction.ASSIGNMENT_ACCEPTED,
      entityType: 'Assignment',
      entityId: 'assignment-uuid-1',
      oldValue: { status: 'pending' },
      newValue: { status: 'confirmed' },
      metadata: { examId: 'exam-uuid-1', roomId: 'room-uuid-1' },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    };

    it('should create audit log successfully', async () => {
      repository.create.mockReturnValue(mockAuditLog as AuditLog);
      repository.save.mockResolvedValue(mockAuditLog as AuditLog);

      const result = await service.create(createAuditLogDto);

      expect(repository.create).toHaveBeenCalledWith(createAuditLogDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockAuditLog);
    });

    it('should create audit log with only required fields', async () => {
      const minimalDto = {
        action: AuditAction.LOGIN,
      };

      const minimalAuditLog = {
        id: 'audit-uuid-2',
        action: AuditAction.LOGIN,
        userId: null,
        userEmail: null,
        entityType: null,
        entityId: null,
        oldValue: null,
        newValue: null,
        metadata: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      };

      repository.create.mockReturnValue(minimalAuditLog as AuditLog);
      repository.save.mockResolvedValue(minimalAuditLog as AuditLog);

      const result = await service.create(minimalDto);

      expect(repository.create).toHaveBeenCalledWith(minimalDto);
      expect(result).toBeDefined();
      expect(result.action).toBe(AuditAction.LOGIN);
    });

    it('should create audit log without user context', async () => {
      const anonymousDto = {
        action: AuditAction.REGISTER,
        entityType: 'User',
        entityId: 'user-uuid-2',
        newValue: { username: 'newuser' },
        ipAddress: '10.0.0.1',
      };

      const anonymousLog = {
        ...mockAuditLog,
        userId: null,
        userEmail: null,
        action: AuditAction.REGISTER,
      };

      repository.create.mockReturnValue(anonymousLog as AuditLog);
      repository.save.mockResolvedValue(anonymousLog as AuditLog);

      const result = await service.create(anonymousDto);

      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all audit logs when no filters provided', async () => {
      const auditLogs = [
        mockAuditLog,
        { ...mockAuditLog, id: 'audit-uuid-2' },
      ];
      repository.find.mockResolvedValue(auditLogs);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(auditLogs);
    });

    it('should filter by userId when provided', async () => {
      const userLogs = [mockAuditLog];
      repository.find.mockResolvedValue(userLogs);

      const result = await service.findAll('user-uuid-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(userLogs);
    });

    it('should filter by action when provided', async () => {
      const actionLogs = [mockAuditLog];
      repository.find.mockResolvedValue(actionLogs);

      const result = await service.findAll(undefined, AuditAction.ASSIGNMENT_ACCEPTED);

      expect(repository.find).toHaveBeenCalledWith({
        where: { action: AuditAction.ASSIGNMENT_ACCEPTED },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(actionLogs);
    });

    it('should filter by both userId and action when provided', async () => {
      const filteredLogs = [mockAuditLog];
      repository.find.mockResolvedValue(filteredLogs);

      const result = await service.findAll(
        'user-uuid-1',
        AuditAction.ASSIGNMENT_ACCEPTED,
      );

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-uuid-1',
          action: AuditAction.ASSIGNMENT_ACCEPTED,
        },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(filteredLogs);
    });
  });

  describe('findOne', () => {
    it('should return audit log by id', async () => {
      repository.findOne.mockResolvedValue(mockAuditLog);

      const result = await service.findOne('audit-uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'audit-uuid-1' },
      });
      expect(result).toEqual(mockAuditLog);
    });

    it('should throw NotFoundException if audit log not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
