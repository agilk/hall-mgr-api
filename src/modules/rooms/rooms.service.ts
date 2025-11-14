import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../../entities/room.entity';
import { Hall } from '../../entities/hall.entity';
import { Building } from '../../entities/building.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { QueryRoomDto } from './dto/query-room.dto';
import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Hall)
    private hallRepository: Repository<Hall>,
    @InjectRepository(Building)
    private buildingRepository: Repository<Building>,
    private logger: LoggerService,
  ) {
    this.logger.setContext('RoomsService');
  }

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    // Verify hall exists
    const hall = await this.hallRepository.findOne({
      where: { id: createRoomDto.hallId },
      relations: ['building'],
    });

    if (!hall) {
      throw new NotFoundException(
        `Hall with ID ${createRoomDto.hallId} not found`,
      );
    }

    // Set buildingId from hall if not provided
    const buildingId = createRoomDto.buildingId || hall.buildingId;

    // Verify building exists if provided
    if (createRoomDto.buildingId) {
      const building = await this.buildingRepository.findOne({
        where: { id: createRoomDto.buildingId },
      });
      if (!building) {
        throw new NotFoundException(
          `Building with ID ${createRoomDto.buildingId} not found`,
        );
      }
    }

    // Check if room with same number exists in this hall
    const existingRoom = await this.roomRepository.findOne({
      where: {
        number: createRoomDto.number,
        hallId: createRoomDto.hallId,
      },
    });

    if (existingRoom) {
      throw new ConflictException(
        `Room with number '${createRoomDto.number}' already exists in this hall`,
      );
    }

    const room = this.roomRepository.create({
      ...createRoomDto,
      buildingId,
      active: createRoomDto.active ?? true,
      capacity: createRoomDto.capacity ?? 0,
    });

    const savedRoom = await this.roomRepository.save(room);
    this.logger.log(`Room created: ${savedRoom.number} (ID: ${savedRoom.id})`);

    return this.findOne(savedRoom.id);
  }

  async findAll(query: QueryRoomDto) {
    const { search, hallId, buildingId, active, page, limit } = query;

    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.hall', 'hall')
      .leftJoinAndSelect('room.building', 'building');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(room.number ILIKE :search OR room.name ILIKE :search OR room.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Hall filter
    if (hallId) {
      queryBuilder.andWhere('room.hallId = :hallId', { hallId });
    }

    // Building filter
    if (buildingId) {
      queryBuilder.andWhere('room.buildingId = :buildingId', { buildingId });
    }

    // Active filter
    if (active !== undefined) {
      queryBuilder.andWhere('room.active = :active', { active });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by number
    queryBuilder.orderBy('room.number', 'ASC');

    const [rooms, total] = await queryBuilder.getManyAndCount();

    return {
      data: rooms,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['hall', 'building', 'assignments', 'assignments.supervisor'],
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(id);

    // Check if new number conflicts with existing room in the same hall
    if (updateRoomDto.number && updateRoomDto.number !== room.number) {
      const hallId = updateRoomDto.hallId || room.hallId;
      const existing = await this.roomRepository.findOne({
        where: { number: updateRoomDto.number, hallId },
      });
      if (existing) {
        throw new ConflictException(
          `Room with number '${updateRoomDto.number}' already exists in this hall`,
        );
      }
    }

    // Verify new hall exists if changing hall
    if (updateRoomDto.hallId && updateRoomDto.hallId !== room.hallId) {
      const hall = await this.hallRepository.findOne({
        where: { id: updateRoomDto.hallId },
      });
      if (!hall) {
        throw new NotFoundException(
          `Hall with ID ${updateRoomDto.hallId} not found`,
        );
      }
    }

    // Verify new building exists if changing building
    if (updateRoomDto.buildingId && updateRoomDto.buildingId !== room.buildingId) {
      const building = await this.buildingRepository.findOne({
        where: { id: updateRoomDto.buildingId },
      });
      if (!building) {
        throw new NotFoundException(
          `Building with ID ${updateRoomDto.buildingId} not found`,
        );
      }
    }

    Object.assign(room, updateRoomDto);

    const updatedRoom = await this.roomRepository.save(room);
    this.logger.log(`Room updated: ${updatedRoom.number} (ID: ${updatedRoom.id})`);

    return this.findOne(updatedRoom.id);
  }

  async remove(id: string): Promise<void> {
    const room = await this.findOne(id);
    await this.roomRepository.remove(room);
    this.logger.log(`Room deleted: ${room.number} (ID: ${id})`);
  }

  async toggleActive(id: string): Promise<Room> {
    const room = await this.findOne(id);
    room.active = !room.active;

    const updatedRoom = await this.roomRepository.save(room);
    this.logger.log(
      `Room ${room.number} (ID: ${id}) active status changed to: ${updatedRoom.active}`,
    );

    return this.findOne(updatedRoom.id);
  }
}
