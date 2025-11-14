import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { Building } from '../../entities/building.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Building)
    private buildingRepository: Repository<Building>,
    private logger: LoggerService,
  ) {
    this.logger.setContext('UsersService');
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { username: createUserDto.username },
        { email: createUserDto.email },
        { phone: createUserDto.phone },
      ],
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this username, email, or phone already exists',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      roles: createUserDto.roles || ['supervisor'],
      isActive: createUserDto.isActive ?? false,
      isApproved: createUserDto.isApproved ?? false,
    });

    const savedUser = await this.userRepository.save(user);
    this.logger.log(`User created: ${savedUser.username} (ID: ${savedUser.id})`);

    // Remove password from response
    delete savedUser.password;
    return savedUser;
  }

  async findAll(query: QueryUserDto) {
    const { search, roles, isActive, isApproved, page, limit } = query;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.uid',
        'user.email',
        'user.username',
        'user.fullName',
        'user.phone',
        'user.firstName',
        'user.lastName',
        'user.middleName',
        'user.roles',
        'user.isActive',
        'user.isApproved',
        'user.institution',
        'user.specialty',
        'user.createdAt',
        'user.updatedAt',
      ]);

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(user.username ILIKE :search OR user.email ILIKE :search OR user.fullName ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Role filter
    if (roles && roles.length > 0) {
      queryBuilder.andWhere('user.roles && :roles', { roles });
    }

    // Active filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    // Approved filter
    if (isApproved !== undefined) {
      queryBuilder.andWhere('user.isApproved = :isApproved', { isApproved });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by creation date
    queryBuilder.orderBy('user.createdAt', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['preferredBuildings', 'managedBuildings'],
      select: {
        id: true,
        uid: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
        firstName: true,
        lastName: true,
        middleName: true,
        personalId: true,
        gender: true,
        birthday: true,
        profilePhoto: true,
        institution: true,
        specialty: true,
        contactDetails: true,
        roles: true,
        isActive: true,
        isApproved: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check for unique constraint violations
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existing = await this.findByUsername(updateUserDto.username);
      if (existing) {
        throw new ConflictException('Username already taken');
      }
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = await this.findByEmail(updateUserDto.email);
      if (existing) {
        throw new ConflictException('Email already taken');
      }
    }

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update building relationships if provided
    if (updateUserDto.preferredBuildingIds) {
      user.preferredBuildings = await this.buildingRepository.findBy({
        id: In(updateUserDto.preferredBuildingIds),
      });
    }

    if (updateUserDto.managedBuildingIds) {
      user.managedBuildings = await this.buildingRepository.findBy({
        id: In(updateUserDto.managedBuildingIds),
      });
    }

    // Update other fields
    Object.assign(user, updateUserDto);

    const updatedUser = await this.userRepository.save(user);
    this.logger.log(`User updated: ${updatedUser.username} (ID: ${updatedUser.id})`);

    // Remove password from response
    delete updatedUser.password;
    return updatedUser;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    this.logger.log(`User deleted: ${user.username} (ID: ${id})`);
  }

  async toggleActive(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = !user.isActive;
    const updatedUser = await this.userRepository.save(user);
    this.logger.log(
      `User ${user.username} (ID: ${id}) active status changed to: ${updatedUser.isActive}`,
    );
    delete updatedUser.password;
    return updatedUser;
  }

  async toggleApproved(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isApproved = !user.isApproved;
    const updatedUser = await this.userRepository.save(user);
    this.logger.log(
      `User ${user.username} (ID: ${id}) approved status changed to: ${updatedUser.isApproved}`,
    );
    delete updatedUser.password;
    return updatedUser;
  }

  async assignRole(id: number, role: string): Promise<User> {
    const user = await this.findOne(id);
    if (!user.roles.includes(role)) {
      user.roles.push(role);
      const updatedUser = await this.userRepository.save(user);
      this.logger.log(`Role ${role} assigned to user ${user.username} (ID: ${id})`);
      delete updatedUser.password;
      return updatedUser;
    }
    return user;
  }

  async removeRole(id: number, role: string): Promise<User> {
    const user = await this.findOne(id);
    user.roles = user.roles.filter((r) => r !== role);
    const updatedUser = await this.userRepository.save(user);
    this.logger.log(`Role ${role} removed from user ${user.username} (ID: ${id})`);
    delete updatedUser.password;
    return updatedUser;
  }
}
