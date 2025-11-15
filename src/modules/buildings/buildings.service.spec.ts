import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BuildingsService } from './buildings.service';
import { Building } from '../../entities/building.entity';
import { LoggerService } from '../../common/services/logger.service';
import { createMockRepository, createMockLogger } from '../../../test/test-utils';
import { MockType } from '../../../test/types';
import { Repository } from 'typeorm';

describe('BuildingsService', () => {
  let service: BuildingsService;
  let repository: MockType<Repository<Building>>;
  let logger: any;

  const mockBuilding: Partial<Building> = {
    id: 'uuid-1',
    name: 'Main Building',
    address: '123 Main St',
    description: 'Main exam building',
    active: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuildingsService,
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

    service = module.get<BuildingsService>(BuildingsService);
    repository = module.get(getRepositoryToken(Building));
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createBuildingDto = {
      name: 'New Building',
      address: '456 New St',
      description: 'A new building',
    };

    it('should create a building successfully', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockBuilding as Building);
      repository.save.mockResolvedValue(mockBuilding as Building);

      const result = await service.create(createBuildingDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { name: createBuildingDto.name },
      });
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createBuildingDto,
          active: true,
        }),
      );
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockBuilding);
    });

    it('should throw ConflictException if building name already exists', async () => {
      repository.findOne.mockResolvedValue(mockBuilding);

      await expect(service.create(createBuildingDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should respect active status from DTO', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockBuilding as Building);
      repository.save.mockResolvedValue(mockBuilding as Building);

      await service.create({ ...createBuildingDto, active: false });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ active: false }),
      );
    });
  });

  describe('findAll', () => {
    const queryDto = {
      page: 1,
      limit: 10,
    };

    it('should return paginated buildings', async () => {
      const buildings = [mockBuilding, { ...mockBuilding, id: 'uuid-2' }];
      const total = 2;

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([buildings, total]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(queryDto);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'building.deletedAt IS NULL',
      );
      expect(result).toEqual({
        data: buildings,
        meta: {
          total,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should apply search filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ ...queryDto, search: 'main' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.objectContaining({ search: '%main%' }),
      );
    });

    it('should apply active filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ ...queryDto, active: true });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'building.active = :active',
        { active: true },
      );
    });
  });

  describe('findOne', () => {
    it('should return a building by id', async () => {
      repository.findOne.mockResolvedValue(mockBuilding);

      const result = await service.findOne('uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1', deletedAt: expect.anything() },
        relations: ['halls', 'halls.rooms'],
      });
      expect(result).toEqual(mockBuilding);
    });

    it('should throw NotFoundException if building not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateBuildingDto = {
      description: 'Updated description',
    };

    it('should update a building successfully', async () => {
      const updatedBuilding = {
        ...mockBuilding,
        description: 'Updated description',
      };
      repository.findOne.mockResolvedValue(mockBuilding);
      repository.save.mockResolvedValue(updatedBuilding as Building);

      const result = await service.update('uuid-1', updateBuildingDto);

      expect(repository.save).toHaveBeenCalled();
      expect(result.description).toBe('Updated description');
    });

    it('should throw ConflictException if new name is taken', async () => {
      repository.findOne
        .mockResolvedValueOnce(mockBuilding)
        .mockResolvedValueOnce({ ...mockBuilding, id: 'uuid-2' });

      await expect(
        service.update('uuid-1', { name: 'Taken Name' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating to same name', async () => {
      repository.findOne.mockResolvedValue(mockBuilding);
      repository.save.mockResolvedValue(mockBuilding as Building);

      await service.update('uuid-1', { name: mockBuilding.name });

      // Should not check for existing name
      expect(repository.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should soft delete a building', async () => {
      const deletedBuilding = { ...mockBuilding, deletedAt: new Date() };
      repository.findOne.mockResolvedValue(mockBuilding);
      repository.save.mockResolvedValue(deletedBuilding as Building);

      await service.remove('uuid-1');

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
          active: false,
        }),
      );
    });

    it('should throw NotFoundException if building not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted building', async () => {
      const deletedBuilding = { ...mockBuilding, deletedAt: new Date() };
      const restoredBuilding = { ...mockBuilding, deletedAt: null };

      repository.findOne.mockResolvedValue(deletedBuilding);
      repository.save.mockResolvedValue(restoredBuilding as Building);

      const result = await service.restore('uuid-1');

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: null,
          active: true,
        }),
      );
      expect(result.deletedAt).toBeNull();
    });

    it('should throw NotFoundException if building not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.restore('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('toggleActive', () => {
    it('should toggle building active status', async () => {
      const inactiveBuilding = { ...mockBuilding, active: false };
      repository.findOne.mockResolvedValue(mockBuilding);
      repository.save.mockResolvedValue(inactiveBuilding as Building);

      const result = await service.toggleActive('uuid-1');

      expect(result.active).toBe(false);
    });
  });
});
