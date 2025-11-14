import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SyncService } from './sync.service';
import { ExternalHallApiService } from './external-hall-api.service';
import {
  Building,
  BuildingSyncStatus,
  Room,
  RoomSyncStatus,
  Participant,
  SyncLog,
  SyncStatus,
  SyncType,
} from '../entities';
import { createMockRepository, createMockDataSource } from '../../test/test-utils';
import { MockType } from '../../test/types';
import { Repository } from 'typeorm';

describe('SyncService', () => {
  let service: SyncService;
  let buildingRepository: MockType<Repository<Building>>;
  let roomRepository: MockType<Repository<Room>>;
  let participantRepository: MockType<Repository<Participant>>;
  let syncLogRepository: MockType<Repository<SyncLog>>;
  let externalHallApi: MockType<ExternalHallApiService>;
  let dataSource: MockType<DataSource>;

  const mockExternalHall = {
    id: 1,
    uid: 'HALL-UID-1',
    name: 'External Hall 1',
    address: '123 External St',
    placeLimit: 500,
    regionId: 'region-1',
    isActive: 1,
    rooms: [
      {
        id: 1,
        name: 'Room A',
        capacity: 30,
        isActive: 1,
      },
    ],
  };

  const mockBuilding: Partial<Building> = {
    id: 'building-uuid-1',
    externalId: 1,
    externalUid: 'HALL-UID-1',
    name: 'External Hall 1',
    address: '123 External St',
    placeLimit: 500,
    syncStatus: BuildingSyncStatus.SYNCED,
  };

  const mockSyncLog: Partial<SyncLog> = {
    id: 'sync-log-uuid-1',
    syncType: SyncType.EXAM_HALLS,
    status: SyncStatus.IN_PROGRESS,
    startedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: getRepositoryToken(Building),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Room),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Participant),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(SyncLog),
          useValue: createMockRepository(),
        },
        {
          provide: ExternalHallApiService,
          useValue: {
            getExamHalls: jest.fn(),
            getRoomParticipants: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: createMockDataSource(),
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    buildingRepository = module.get(getRepositoryToken(Building));
    roomRepository = module.get(getRepositoryToken(Room));
    participantRepository = module.get(getRepositoryToken(Participant));
    syncLogRepository = module.get(getRepositoryToken(SyncLog));
    externalHallApi = module.get(ExternalHallApiService);
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('performExamHallsSync', () => {
    it('should sync exam halls successfully', async () => {
      const mockQueryRunner = dataSource.createQueryRunner();

      // Setup mocks
      syncLogRepository.create.mockReturnValue(mockSyncLog as SyncLog);
      syncLogRepository.save.mockResolvedValue(mockSyncLog as SyncLog);
      externalHallApi.getExamHalls.mockResolvedValue([mockExternalHall]);

      // Mock transaction
      mockQueryRunner.manager.findOne.mockResolvedValue(null); // No existing building
      mockQueryRunner.manager.create.mockReturnValue(mockBuilding as Building);
      mockQueryRunner.manager.save.mockResolvedValue(mockBuilding as Building);

      const result = await service.performExamHallsSync();

      expect(externalHallApi.getExamHalls).toHaveBeenCalled();
      expect(syncLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          syncType: SyncType.EXAM_HALLS,
          status: SyncStatus.IN_PROGRESS,
        }),
      );
      expect(result).toBeDefined();
      expect(result.status).toBe(SyncStatus.COMPLETED);
    });

    it('should update existing buildings', async () => {
      const mockQueryRunner = dataSource.createQueryRunner();

      syncLogRepository.create.mockReturnValue(mockSyncLog as SyncLog);
      syncLogRepository.save.mockResolvedValue(mockSyncLog as SyncLog);
      externalHallApi.getExamHalls.mockResolvedValue([mockExternalHall]);

      // Mock finding existing building
      mockQueryRunner.manager.findOne.mockResolvedValue(mockBuilding);
      mockQueryRunner.manager.save.mockResolvedValue(mockBuilding as Building);

      const result = await service.performExamHallsSync();

      expect(result).toBeDefined();
      expect(result.status).toBe(SyncStatus.COMPLETED);
    });

    it('should handle sync failures gracefully', async () => {
      syncLogRepository.create.mockReturnValue(mockSyncLog as SyncLog);
      syncLogRepository.save.mockResolvedValue(mockSyncLog as SyncLog);
      externalHallApi.getExamHalls.mockRejectedValue(
        new Error('API connection failed'),
      );

      await expect(service.performExamHallsSync()).rejects.toThrow(
        'API connection failed',
      );

      expect(syncLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SyncStatus.FAILED,
          errorMessage: 'API connection failed',
        }),
      );
    });

    it('should rollback transaction on error', async () => {
      const mockQueryRunner = dataSource.createQueryRunner();

      syncLogRepository.create.mockReturnValue(mockSyncLog as SyncLog);
      syncLogRepository.save.mockResolvedValue(mockSyncLog as SyncLog);
      externalHallApi.getExamHalls.mockResolvedValue([mockExternalHall]);

      mockQueryRunner.manager.findOne.mockResolvedValue(null);
      mockQueryRunner.manager.create.mockReturnValue(mockBuilding as Building);
      mockQueryRunner.manager.save.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.performExamHallsSync()).rejects.toThrow();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('syncParticipantsForDate', () => {
    const examDate = '2024-03-15';

    const mockParticipantData = [
      {
        startTime: '09:00:00',
        endTime: '11:00:00',
        participants: [
          {
            hallId: 1,
            roomId: 1,
            participantName: 'John Student',
            participantId: 'STU123',
            seatNumber: '15',
          },
        ],
      },
    ];

    it('should sync participants successfully', async () => {
      const mockQueryRunner = dataSource.createQueryRunner();
      const mockBuilding = { id: 'building-uuid-1' };
      const mockRoom = { id: 'room-uuid-1' };

      syncLogRepository.create.mockReturnValue(mockSyncLog as SyncLog);
      syncLogRepository.save.mockResolvedValue(mockSyncLog as SyncLog);
      externalHallApi.getRoomParticipants.mockResolvedValue(mockParticipantData);

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(mockBuilding)
        .mockResolvedValueOnce(mockRoom)
        .mockResolvedValueOnce(null);
      mockQueryRunner.manager.create.mockReturnValue({} as Participant);
      mockQueryRunner.manager.save.mockResolvedValue({} as Participant);

      const result = await service.syncParticipantsForDate(examDate);

      expect(externalHallApi.getRoomParticipants).toHaveBeenCalledWith(examDate);
      expect(result.status).toBe(SyncStatus.COMPLETED);
    });

    it('should handle participant sync failures', async () => {
      syncLogRepository.create.mockReturnValue(mockSyncLog as SyncLog);
      syncLogRepository.save.mockResolvedValue(mockSyncLog as SyncLog);
      externalHallApi.getRoomParticipants.mockRejectedValue(
        new Error('Participants API failed'),
      );

      await expect(service.syncParticipantsForDate(examDate)).rejects.toThrow(
        'Participants API failed',
      );

      expect(syncLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SyncStatus.FAILED,
        }),
      );
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status with last sync logs', async () => {
      const lastHallsSync = {
        ...mockSyncLog,
        syncType: SyncType.EXAM_HALLS,
        status: SyncStatus.COMPLETED,
        completedAt: new Date(),
      };

      const lastParticipantsSync = {
        ...mockSyncLog,
        syncType: SyncType.PARTICIPANTS,
        status: SyncStatus.COMPLETED,
        completedAt: new Date(),
      };

      syncLogRepository.findOne
        .mockResolvedValueOnce(lastHallsSync)
        .mockResolvedValueOnce(lastParticipantsSync);

      const result = await service.getSyncStatus();

      expect(result).toHaveProperty('examHalls');
      expect(result).toHaveProperty('participants');
      expect(result.examHalls).toEqual(lastHallsSync);
      expect(result.participants).toEqual(lastParticipantsSync);
    });
  });
});
