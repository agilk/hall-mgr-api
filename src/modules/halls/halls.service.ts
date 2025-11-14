import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hall } from '../../entities/hall.entity';
import { Building } from '../../entities/building.entity';
import { CreateHallDto } from './dto/create-hall.dto';
import { UpdateHallDto } from './dto/update-hall.dto';
import { QueryHallDto } from './dto/query-hall.dto';
import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class HallsService {
  constructor(
    @InjectRepository(Hall)
    private hallRepository: Repository<Hall>,
    @InjectRepository(Building)
    private buildingRepository: Repository<Building>,
    private logger: LoggerService,
  ) {
    this.logger.setContext('HallsService');
  }

  async create(createHallDto: CreateHallDto): Promise<Hall> {
    // Verify building exists
    const building = await this.buildingRepository.findOne({
      where: { id: createHallDto.buildingId },
    });

    if (!building) {
      throw new NotFoundException(
        `Building with ID ${createHallDto.buildingId} not found`,
      );
    }

    // Check if hall with same name exists in this building
    const existingHall = await this.hallRepository.findOne({
      where: {
        name: createHallDto.name,
        buildingId: createHallDto.buildingId,
      },
    });

    if (existingHall) {
      throw new ConflictException(
        `Hall with name '${createHallDto.name}' already exists in this building`,
      );
    }

    const hall = this.hallRepository.create({
      ...createHallDto,
      active: createHallDto.active ?? true,
    });

    const savedHall = await this.hallRepository.save(hall);
    this.logger.log(`Hall created: ${savedHall.name} (ID: ${savedHall.id})`);

    return this.findOne(savedHall.id);
  }

  async findAll(query: QueryHallDto) {
    const { search, buildingId, active, page, limit } = query;

    const queryBuilder = this.hallRepository
      .createQueryBuilder('hall')
      .leftJoinAndSelect('hall.building', 'building')
      .leftJoinAndSelect('hall.rooms', 'rooms');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(hall.name ILIKE :search OR hall.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Building filter
    if (buildingId) {
      queryBuilder.andWhere('hall.buildingId = :buildingId', { buildingId });
    }

    // Active filter
    if (active !== undefined) {
      queryBuilder.andWhere('hall.active = :active', { active });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by name
    queryBuilder.orderBy('hall.name', 'ASC');

    const [halls, total] = await queryBuilder.getManyAndCount();

    return {
      data: halls,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Hall> {
    const hall = await this.hallRepository.findOne({
      where: { id },
      relations: ['building', 'rooms'],
    });

    if (!hall) {
      throw new NotFoundException(`Hall with ID ${id} not found`);
    }

    return hall;
  }

  async update(id: string, updateHallDto: UpdateHallDto): Promise<Hall> {
    const hall = await this.findOne(id);

    // Check if new name conflicts with existing hall in the same building
    if (updateHallDto.name && updateHallDto.name !== hall.name) {
      const buildingId = updateHallDto.buildingId || hall.buildingId;
      const existing = await this.hallRepository.findOne({
        where: { name: updateHallDto.name, buildingId },
      });
      if (existing) {
        throw new ConflictException(
          `Hall with name '${updateHallDto.name}' already exists in this building`,
        );
      }
    }

    // Verify new building exists if changing building
    if (updateHallDto.buildingId && updateHallDto.buildingId !== hall.buildingId) {
      const building = await this.buildingRepository.findOne({
        where: { id: updateHallDto.buildingId },
      });
      if (!building) {
        throw new NotFoundException(
          `Building with ID ${updateHallDto.buildingId} not found`,
        );
      }
    }

    Object.assign(hall, updateHallDto);

    const updatedHall = await this.hallRepository.save(hall);
    this.logger.log(`Hall updated: ${updatedHall.name} (ID: ${updatedHall.id})`);

    return this.findOne(updatedHall.id);
  }

  async remove(id: string): Promise<void> {
    const hall = await this.findOne(id);
    await this.hallRepository.remove(hall);
    this.logger.log(`Hall deleted: ${hall.name} (ID: ${id})`);
  }

  async toggleActive(id: string): Promise<Hall> {
    const hall = await this.findOne(id);
    hall.active = !hall.active;

    const updatedHall = await this.hallRepository.save(hall);
    this.logger.log(
      `Hall ${hall.name} (ID: ${id}) active status changed to: ${updatedHall.active}`,
    );

    return this.findOne(updatedHall.id);
  }
}
