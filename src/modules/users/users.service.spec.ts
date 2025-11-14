import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { Building } from '../../entities/building.entity';
import { LoggerService } from '../../common/services/logger.service';
import { createMockRepository, createMockLogger } from '../../../test/test-utils';
import { MockType } from '../../../test/types';
import { Repository } from 'typeorm';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockType<Repository<User>>;
  let buildingRepository: MockType<Repository<Building>>;
  let logger: any;

  const mockUser: Partial<User> = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    phone: '+1234567890',
    fullName: 'Test User',
    roles: ['supervisor'],
    isActive: true,
    isApproved: true,
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
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

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    buildingRepository = module.get(getRepositoryToken(Building));
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto = {
      username: 'newuser',
      email: 'new@example.com',
      phone: '+9876543210',
      fullName: 'New User',
      password: 'password123',
    };

    it('should create a user successfully', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser as User);
      userRepository.save.mockResolvedValue(mockUser as User);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.create(createUserDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: [
          { username: createUserDto.username },
          { email: createUserDto.email },
          { phone: createUserDto.phone },
        ],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
    });

    it('should throw ConflictException if user already exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should set default roles if not provided', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const createdUser = { ...mockUser, roles: ['supervisor'] };
      userRepository.create.mockReturnValue(createdUser as User);
      userRepository.save.mockResolvedValue(createdUser as User);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await service.create(createUserDto);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: ['supervisor'],
        }),
      );
    });
  });

  describe('findAll', () => {
    const queryDto = {
      page: 1,
      limit: 10,
    };

    it('should return paginated users', async () => {
      const users = [mockUser, { ...mockUser, id: 2 }];
      const total = 2;

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([users, total]),
      };

      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(queryDto);

      expect(result).toEqual({
        data: users,
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
        select: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ ...queryDto, search: 'test' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.objectContaining({ search: '%test%' }),
      );
    });

    it('should apply role filter', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ ...queryDto, roles: ['supervisor'] });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.roles && :roles',
        { roles: ['supervisor'] },
      );
    });

    it('should apply active filter', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ ...queryDto, isActive: true });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.isActive = :isActive',
        { isActive: true },
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['preferredBuildings', 'managedBuildings'],
        select: expect.any(Object),
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUsername', () => {
    it('should return a user by username', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateUserDto = {
      fullName: 'Updated Name',
    };

    it('should update a user successfully', async () => {
      const updatedUser = { ...mockUser, fullName: 'Updated Name' };
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(updatedUser as User);

      const result = await service.update(1, updateUserDto);

      expect(userRepository.save).toHaveBeenCalled();
      expect(result.fullName).toBe('Updated Name');
      expect(result.password).toBeUndefined();
    });

    it('should throw ConflictException if username is taken', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, id: 2 });

      await expect(
        service.update(1, { username: 'taken' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if email is taken', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...mockUser, id: 2 });

      await expect(
        service.update(1, { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password if provided', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser as User);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      await service.update(1, { password: 'newpassword' });

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
    });

    it('should update building relationships if provided', async () => {
      const buildings = [{ id: 1 }, { id: 2 }];
      userRepository.findOne.mockResolvedValue(mockUser);
      buildingRepository.findBy.mockResolvedValue(buildings);
      userRepository.save.mockResolvedValue(mockUser as User);

      await service.update(1, { preferredBuildingIds: [1, 2] });

      expect(buildingRepository.findBy).toHaveBeenCalledWith({
        id: expect.anything(),
      });
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.remove.mockResolvedValue(mockUser);

      await service.remove(1);

      expect(userRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleActive', () => {
    it('should toggle user active status', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(inactiveUser as User);

      const result = await service.toggleActive(1);

      expect(result.isActive).toBe(false);
      expect(result.password).toBeUndefined();
    });
  });

  describe('toggleApproved', () => {
    it('should toggle user approved status', async () => {
      const unapprovedUser = { ...mockUser, isApproved: false };
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(unapprovedUser as User);

      const result = await service.toggleApproved(1);

      expect(result.isApproved).toBe(false);
      expect(result.password).toBeUndefined();
    });
  });

  describe('assignRole', () => {
    it('should assign a new role to user', async () => {
      const userWithNewRole = {
        ...mockUser,
        roles: ['supervisor', 'manager'],
      };
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(userWithNewRole as User);

      const result = await service.assignRole(1, 'manager');

      expect(result.roles).toContain('manager');
      expect(result.password).toBeUndefined();
    });

    it('should not assign role if already exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.assignRole(1, 'supervisor');

      expect(userRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe('removeRole', () => {
    it('should remove a role from user', async () => {
      const userWithMultipleRoles = {
        ...mockUser,
        roles: ['supervisor', 'manager'],
      };
      const userAfterRemoval = { ...mockUser, roles: ['supervisor'] };

      userRepository.findOne.mockResolvedValue(userWithMultipleRoles);
      userRepository.save.mockResolvedValue(userAfterRemoval as User);

      const result = await service.removeRole(1, 'manager');

      expect(result.roles).not.toContain('manager');
      expect(result.password).toBeUndefined();
    });
  });
});
