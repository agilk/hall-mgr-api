import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment, AssignmentStatus } from '../../entities/assignment.entity';
import { User } from '../../entities/user.entity';
import { Room } from '../../entities/room.entity';
import { Exam } from '../../entities/exam.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { QueryAssignmentDto } from './dto/query-assignment.dto';
import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    private logger: LoggerService,
  ) {
    this.logger.setContext('AssignmentsService');
  }

  async create(createAssignmentDto: CreateAssignmentDto): Promise<Assignment> {
    // Verify exam exists
    const exam = await this.examRepository.findOne({
      where: { id: createAssignmentDto.examId },
    });
    if (!exam) {
      throw new NotFoundException(
        `Exam with ID ${createAssignmentDto.examId} not found`,
      );
    }

    // Verify room exists
    const room = await this.roomRepository.findOne({
      where: { id: createAssignmentDto.roomId },
    });
    if (!room) {
      throw new NotFoundException(
        `Room with ID ${createAssignmentDto.roomId} not found`,
      );
    }

    // Verify supervisor exists if provided
    if (createAssignmentDto.supervisorId) {
      const supervisor = await this.userRepository.findOne({
        where: { id: parseInt(createAssignmentDto.supervisorId) },
      });
      if (!supervisor) {
        throw new NotFoundException(
          `Supervisor with ID ${createAssignmentDto.supervisorId} not found`,
        );
      }
    } else if (!createAssignmentDto.noSupervisorNeeded) {
      throw new BadRequestException(
        'Supervisor is required unless noSupervisorNeeded is true',
      );
    }

    // Check if assignment already exists for this room and exam
    const existingAssignment = await this.assignmentRepository.findOne({
      where: {
        roomId: createAssignmentDto.roomId,
        examId: createAssignmentDto.examId,
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        'Assignment already exists for this room and exam',
      );
    }

    const assignment = this.assignmentRepository.create({
      ...createAssignmentDto,
      status: createAssignmentDto.status || AssignmentStatus.PENDING,
    });

    const savedAssignment = await this.assignmentRepository.save(assignment);
    this.logger.log(`Assignment created: ${savedAssignment.id}`);

    return this.findOne(savedAssignment.id);
  }

  async findAll(query: QueryAssignmentDto) {
    const { supervisorId, examId, roomId, status, page, limit } = query;

    const queryBuilder = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.supervisor', 'supervisor')
      .leftJoinAndSelect('assignment.room', 'room')
      .leftJoinAndSelect('assignment.exam', 'exam')
      .leftJoinAndSelect('room.hall', 'hall')
      .leftJoinAndSelect('room.building', 'building');

    // Filters
    if (supervisorId) {
      queryBuilder.andWhere('assignment.supervisorId = :supervisorId', {
        supervisorId,
      });
    }

    if (examId) {
      queryBuilder.andWhere('assignment.examId = :examId', { examId });
    }

    if (roomId) {
      queryBuilder.andWhere('assignment.roomId = :roomId', { roomId });
    }

    if (status) {
      queryBuilder.andWhere('assignment.status = :status', { status });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by creation date
    queryBuilder.orderBy('assignment.createdAt', 'DESC');

    const [assignments, total] = await queryBuilder.getManyAndCount();

    return {
      data: assignments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Assignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: [
        'supervisor',
        'room',
        'room.hall',
        'room.building',
        'exam',
        'violations',
      ],
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }

    return assignment;
  }

  async update(
    id: string,
    updateAssignmentDto: UpdateAssignmentDto,
  ): Promise<Assignment> {
    const assignment = await this.findOne(id);

    // Verify new supervisor if provided
    if (
      updateAssignmentDto.supervisorId &&
      updateAssignmentDto.supervisorId !== assignment.supervisorId
    ) {
      const supervisor = await this.userRepository.findOne({
        where: { id: parseInt(updateAssignmentDto.supervisorId) },
      });
      if (!supervisor) {
        throw new NotFoundException(
          `Supervisor with ID ${updateAssignmentDto.supervisorId} not found`,
        );
      }
    }

    Object.assign(assignment, updateAssignmentDto);

    const updatedAssignment = await this.assignmentRepository.save(assignment);
    this.logger.log(`Assignment updated: ${updatedAssignment.id}`);

    return this.findOne(updatedAssignment.id);
  }

  async remove(id: string): Promise<void> {
    const assignment = await this.findOne(id);
    await this.assignmentRepository.remove(assignment);
    this.logger.log(`Assignment deleted: ${id}`);
  }

  async updateStatus(id: string, status: AssignmentStatus): Promise<Assignment> {
    // Optimize: Use update() instead of save() to avoid loading the entity
    const result = await this.assignmentRepository.update(id, { status });

    if (result.affected === 0) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }

    this.logger.log(`Assignment ${id} status changed to: ${status}`);

    // Only load once after update
    return this.findOne(id);
  }

  async acceptAssignment(id: string): Promise<Assignment> {
    return this.updateStatus(id, AssignmentStatus.ACCEPTED);
  }

  async rejectAssignment(id: string): Promise<Assignment> {
    return this.updateStatus(id, AssignmentStatus.REJECTED);
  }

  async confirmAssignment(id: string): Promise<Assignment> {
    return this.updateStatus(id, AssignmentStatus.CONFIRMED);
  }

  async completeAssignment(id: string): Promise<Assignment> {
    return this.updateStatus(id, AssignmentStatus.COMPLETED);
  }

  async cancelAssignment(id: string): Promise<Assignment> {
    return this.updateStatus(id, AssignmentStatus.CANCELLED);
  }

  async recordArrival(id: string): Promise<Assignment> {
    // Optimize: Use update() instead of loading the full entity
    const result = await this.assignmentRepository.update(id, {
      arrivalTime: new Date(),
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }

    this.logger.log(`Assignment ${id} arrival time recorded`);

    // Only load once after update
    return this.findOne(id);
  }

  async recordDeparture(id: string): Promise<Assignment> {
    // Optimize: Use update() instead of loading the full entity
    const result = await this.assignmentRepository.update(id, {
      departureTime: new Date(),
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }

    this.logger.log(`Assignment ${id} departure time recorded`);

    // Only load once after update
    return this.findOne(id);
  }
}
