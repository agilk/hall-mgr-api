import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Room } from '../../entities/room.entity';
import { Hall } from '../../entities/hall.entity';
import { Building } from '../../entities/building.entity';
import { LoggerService } from '../../common/services/logger.service';
import { createMockRepository, createMockLogger } from '../../../test/test-utils';
import { MockType } from '../../../test/types';
import { Repository } from 'typeorm';

describe('RoomsService', () => {
  let service: RoomsService;
  let roomRepository: MockType<Repository<Room>>;
  let hallRepository: MockType<Repository<Hall>>;
  let buildingRepository: MockType<Repository<Building>>;
  let logger: any;

  const mockBuilding: Partial<Building> = {
    id: 'building-uuid-1',
    name: 'Main Building',
  };

  const mockHall: Partial<Hall> = {
    id: 'hall-uuid-1',
    name: 'Hall A',
    buildingId: 'building-uuid-1',
  };

  const mockRoom: Partial<Room> = {
    id: 'room-uuid-1',
    number: 'R101',
    name: 'Room 101',
    hallId: 'hall-uuid-1',
    buildingId: 'building-uuid-1',
    capacity: 30,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: getRepositoryToken(Room),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Hall),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Building),
          useValue: createMockRepository(),
        },
        {
          provide: LoggerService,
          useValue: createMockLogger(),
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    roomRepository = module.get(getRepositoryToken(Room));
    hallRepository = module.get(getRepositoryToken(Hall));
    buildingRepository = module.get(getRepositoryToken(Building));
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createRoomDto = {
      number: 'R102',
      name: 'Room 102',
      hallId: 'hall-uuid-1',
      capacity: 30,
    };

    it('should create a room successfully', async () => {
      const hallWithBuilding = { ...mockHall, building: mockBuilding };
      hallRepository.findOne.mockResolvedValue(hallWithBuilding);
      roomRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(mockRoom);
      roomRepository.create.mockReturnValue(mockRoom as Room);
      roomRepository.save.mockResolvedValue(mockRoom as Room);

      const result = await service.create(createRoomDto);

      expect(hallRepository.findOne).toHaveBeenCalledWith({
        where: { id: createRoomDto.hallId },
        relations: ['building'],
      });
      expect(roomRepository.findOne).toHaveBeenCalledWith({
        where: {
          number: createRoomDto.number,
          hallId: createRoomDto.hallId,
        },
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if hall not found', async () => {
      hallRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createRoomDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if room number exists in hall', async () => {
      const hallWithBuilding = { ...mockHall, building: mockBuilding };
      hallRepository.findOne.mockResolvedValue(hallWithBuilding);
      roomRepository.findOne.mockResolvedValue(mockRoom);

      await expect(service.create(createRoomDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should verify building if buildingId is provided', async () => {
      const createDtoWithBuilding = {
        ...createRoomDto,
        buildingId: 'building-uuid-1',
      };

      const hallWithBuilding = { ...mockHall, building: mockBuilding };
      hallRepository.findOne.mockResolvedValue(hallWithBuilding);
      buildingRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDtoWithBuilding)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    const queryDto = {
      page: 1,
      limit: 10,
    };

    it('should return paginated rooms', async () => {
      const rooms = [mockRoom];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([rooms, 1]),
      };

      roomRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(queryDto);

      expect(result.data).toEqual(rooms);
      expect(result.meta.total).toBe(1);
    });

    it('should apply hall filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      roomRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ ...queryDto, hallId: 'hall-uuid-1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'room.hallId = :hallId',
        { hallId: 'hall-uuid-1' },
      );
    });

    it('should apply building filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      roomRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ ...queryDto, buildingId: 'building-uuid-1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'room.buildingId = :buildingId',
        { buildingId: 'building-uuid-1' },
      );
    });
  });

  describe('findOne', () => {
    it('should return a room by id', async () => {
      roomRepository.findOne.mockResolvedValue(mockRoom);

      const result = await service.findOne('room-uuid-1');

      expect(result).toEqual(mockRoom);
    });

    it('should throw NotFoundException if room not found', async () => {
      roomRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a room successfully', async () => {
      const updateDto = { capacity: 40 };
      const updatedRoom = { ...mockRoom, capacity: 40 };

      roomRepository.findOne
        .mockResolvedValueOnce(mockRoom)
        .mockResolvedValueOnce(updatedRoom);
      roomRepository.save.mockResolvedValue(updatedRoom as Room);

      const result = await service.update('room-uuid-1', updateDto);

      expect(result.capacity).toBe(40);
    });

    it('should throw ConflictException if new number is taken', async () => {
      roomRepository.findOne
        .mockResolvedValueOnce(mockRoom)
        .mockResolvedValueOnce({ ...mockRoom, id: 'different-id' });

      await expect(
        service.update('room-uuid-1', { number: 'R999' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a room', async () => {
      roomRepository.findOne.mockResolvedValue(mockRoom);
      roomRepository.remove.mockResolvedValue(mockRoom);

      await service.remove('room-uuid-1');

      expect(roomRepository.remove).toHaveBeenCalledWith(mockRoom);
    });
  });

  describe('toggleActive', () => {
    it('should toggle room active status', async () => {
      const inactiveRoom = { ...mockRoom, active: false };
      roomRepository.findOne
        .mockResolvedValueOnce(mockRoom)
        .mockResolvedValueOnce(inactiveRoom);
      roomRepository.save.mockResolvedValue(inactiveRoom as Room);

      const result = await service.toggleActive('room-uuid-1');

      expect(result.active).toBe(false);
    });
  });
});
