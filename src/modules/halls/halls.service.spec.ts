import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { HallsService } from './halls.service';
import { Hall } from '../../entities/hall.entity';
import { Building } from '../../entities/building.entity';
import { LoggerService } from '../../common/services/logger.service';
import { createMockRepository, createMockLogger } from '../../../test/test-utils';
import { MockType } from '../../../test/types';
import { Repository } from 'typeorm';

describe('HallsService', () => {
  let service: HallsService;
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
    description: 'Main exam hall',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HallsService,
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

    service = module.get<HallsService>(HallsService);
    hallRepository = module.get(getRepositoryToken(Hall));
    buildingRepository = module.get(getRepositoryToken(Building));
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createHallDto = {
      name: 'Hall B',
      buildingId: 'building-uuid-1',
      description: 'Second hall',
    };

    it('should create a hall successfully', async () => {
      buildingRepository.findOne.mockResolvedValue(mockBuilding);
      hallRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(mockHall);
      hallRepository.create.mockReturnValue(mockHall as Hall);
      hallRepository.save.mockResolvedValue(mockHall as Hall);

      const result = await service.create(createHallDto);

      expect(buildingRepository.findOne).toHaveBeenCalledWith({
        where: { id: createHallDto.buildingId },
      });
      expect(hallRepository.findOne).toHaveBeenCalledWith({
        where: {
          name: createHallDto.name,
          buildingId: createHallDto.buildingId,
        },
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if building not found', async () => {
      buildingRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createHallDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if hall name exists in building', async () => {
      buildingRepository.findOne.mockResolvedValue(mockBuilding);
      hallRepository.findOne.mockResolvedValue(mockHall);

      await expect(service.create(createHallDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    const queryDto = {
      page: 1,
      limit: 10,
    };

    it('should return paginated halls', async () => {
      const halls = [mockHall];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([halls, 1]),
      };

      hallRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(queryDto);

      expect(result.data).toEqual(halls);
      expect(result.meta.total).toBe(1);
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

      hallRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ ...queryDto, buildingId: 'building-uuid-1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'hall.buildingId = :buildingId',
        { buildingId: 'building-uuid-1' },
      );
    });
  });

  describe('findOne', () => {
    it('should return a hall by id', async () => {
      hallRepository.findOne.mockResolvedValue(mockHall);

      const result = await service.findOne('hall-uuid-1');

      expect(result).toEqual(mockHall);
    });

    it('should throw NotFoundException if hall not found', async () => {
      hallRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a hall successfully', async () => {
      const updateDto = { description: 'Updated description' };
      const updatedHall = { ...mockHall, ...updateDto };

      hallRepository.findOne
        .mockResolvedValueOnce(mockHall)
        .mockResolvedValueOnce(updatedHall);
      hallRepository.save.mockResolvedValue(updatedHall as Hall);

      const result = await service.update('hall-uuid-1', updateDto);

      expect(result.description).toBe('Updated description');
    });

    it('should throw ConflictException if new name is taken', async () => {
      hallRepository.findOne
        .mockResolvedValueOnce(mockHall)
        .mockResolvedValueOnce({ ...mockHall, id: 'different-id' });

      await expect(
        service.update('hall-uuid-1', { name: 'Taken Name' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if new building not found', async () => {
      hallRepository.findOne.mockResolvedValue(mockHall);
      buildingRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('hall-uuid-1', { buildingId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a hall', async () => {
      hallRepository.findOne.mockResolvedValue(mockHall);
      hallRepository.remove.mockResolvedValue(mockHall);

      await service.remove('hall-uuid-1');

      expect(hallRepository.remove).toHaveBeenCalledWith(mockHall);
    });
  });

  describe('toggleActive', () => {
    it('should toggle hall active status', async () => {
      const inactiveHall = { ...mockHall, active: false };
      hallRepository.findOne
        .mockResolvedValueOnce(mockHall)
        .mockResolvedValueOnce(inactiveHall);
      hallRepository.save.mockResolvedValue(inactiveHall as Hall);

      const result = await service.toggleActive('hall-uuid-1');

      expect(result.active).toBe(false);
    });
  });
});
