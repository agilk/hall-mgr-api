import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Building } from '../../entities/building.entity';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { QueryBuildingDto } from './dto/query-building.dto';
import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectRepository(Building)
    private buildingRepository: Repository<Building>,
    private logger: LoggerService,
  ) {
    this.logger.setContext('BuildingsService');
  }

  async create(createBuildingDto: CreateBuildingDto): Promise<Building> {
    // Check if building with same name already exists
    const existingBuilding = await this.buildingRepository.findOne({
      where: { name: createBuildingDto.name },
    });

    if (existingBuilding) {
      throw new ConflictException(
        `Building with name '${createBuildingDto.name}' already exists`,
      );
    }

    const building = this.buildingRepository.create({
      ...createBuildingDto,
      active: createBuildingDto.active ?? true,
    });

    const savedBuilding = await this.buildingRepository.save(building);
    this.logger.log(
      `Building created: ${savedBuilding.name} (ID: ${savedBuilding.id})`,
    );

    return savedBuilding;
  }

  async findAll(query: QueryBuildingDto) {
    const { search, active, page, limit } = query;

    const queryBuilder = this.buildingRepository
      .createQueryBuilder('building')
      .leftJoinAndSelect('building.halls', 'halls')
      .where('building.deletedAt IS NULL');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(building.name ILIKE :search OR building.address ILIKE :search OR building.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Active filter
    if (active !== undefined) {
      queryBuilder.andWhere('building.active = :active', { active });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by name
    queryBuilder.orderBy('building.name', 'ASC');

    const [buildings, total] = await queryBuilder.getManyAndCount();

    return {
      data: buildings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Building> {
    const building = await this.buildingRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['halls', 'halls.rooms'],
    });

    if (!building) {
      throw new NotFoundException(`Building with ID ${id} not found`);
    }

    return building;
  }

  async update(id: string, updateBuildingDto: UpdateBuildingDto): Promise<Building> {
    const building = await this.findOne(id);

    // Check if new name conflicts with existing building
    if (updateBuildingDto.name && updateBuildingDto.name !== building.name) {
      const existing = await this.buildingRepository.findOne({
        where: { name: updateBuildingDto.name },
      });
      if (existing) {
        throw new ConflictException(
          `Building with name '${updateBuildingDto.name}' already exists`,
        );
      }
    }

    Object.assign(building, updateBuildingDto);

    const updatedBuilding = await this.buildingRepository.save(building);
    this.logger.log(
      `Building updated: ${updatedBuilding.name} (ID: ${updatedBuilding.id})`,
    );

    return updatedBuilding;
  }

  async remove(id: string): Promise<void> {
    const building = await this.findOne(id);

    // Soft delete
    building.deletedAt = new Date();
    building.active = false;

    await this.buildingRepository.save(building);
    this.logger.log(`Building soft deleted: ${building.name} (ID: ${id})`);
  }

  async restore(id: string): Promise<Building> {
    const building = await this.buildingRepository.findOne({
      where: { id },
    });

    if (!building) {
      throw new NotFoundException(`Building with ID ${id} not found`);
    }

    building.deletedAt = null;
    building.active = true;

    const restoredBuilding = await this.buildingRepository.save(building);
    this.logger.log(`Building restored: ${restoredBuilding.name} (ID: ${id})`);

    return restoredBuilding;
  }

  async toggleActive(id: string): Promise<Building> {
    const building = await this.findOne(id);
    building.active = !building.active;

    const updatedBuilding = await this.buildingRepository.save(building);
    this.logger.log(
      `Building ${building.name} (ID: ${id}) active status changed to: ${updatedBuilding.active}`,
    );

    return updatedBuilding;
  }
}
