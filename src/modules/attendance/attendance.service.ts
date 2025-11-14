import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance, AttendanceStatus } from '../../entities/attendance.entity';
import { Exam } from '../../entities/exam.entity';
import { Room } from '../../entities/room.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private logger: LoggerService,
  ) {
    this.logger.setContext('AttendanceService');
  }

  async create(createAttendanceDto: CreateAttendanceDto): Promise<Attendance> {
    // Verify exam exists
    const exam = await this.examRepository.findOne({
      where: { id: createAttendanceDto.examId },
    });
    if (!exam) {
      throw new NotFoundException(
        `Exam with ID ${createAttendanceDto.examId} not found`,
      );
    }

    // Verify room exists
    const room = await this.roomRepository.findOne({
      where: { id: createAttendanceDto.roomId },
    });
    if (!room) {
      throw new NotFoundException(
        `Room with ID ${createAttendanceDto.roomId} not found`,
      );
    }

    const attendance = this.attendanceRepository.create({
      ...createAttendanceDto,
      status: createAttendanceDto.status || AttendanceStatus.PRESENT,
      markedAt: new Date(),
    });

    const savedAttendance = await this.attendanceRepository.save(attendance);
    this.logger.log(`Attendance created: ${savedAttendance.id}`);

    return this.findOne(savedAttendance.id);
  }

  async findAll(query: QueryAttendanceDto) {
    const { examId, roomId, status, participantName, page, limit } = query;

    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.exam', 'exam')
      .leftJoinAndSelect('attendance.room', 'room');

    // Filters
    if (examId) {
      queryBuilder.andWhere('attendance.examId = :examId', { examId });
    }

    if (roomId) {
      queryBuilder.andWhere('attendance.roomId = :roomId', { roomId });
    }

    if (status) {
      queryBuilder.andWhere('attendance.status = :status', { status });
    }

    if (participantName) {
      queryBuilder.andWhere('attendance.participantName ILIKE :participantName', {
        participantName: `%${participantName}%`,
      });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by creation date
    queryBuilder.orderBy('attendance.createdAt', 'DESC');

    const [attendances, total] = await queryBuilder.getManyAndCount();

    return {
      data: attendances,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
      relations: ['exam', 'room'],
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    return attendance;
  }

  async update(
    id: string,
    updateAttendanceDto: UpdateAttendanceDto,
  ): Promise<Attendance> {
    const attendance = await this.findOne(id);

    Object.assign(attendance, updateAttendanceDto);

    const updatedAttendance = await this.attendanceRepository.save(attendance);
    this.logger.log(`Attendance updated: ${updatedAttendance.id}`);

    return this.findOne(updatedAttendance.id);
  }

  async remove(id: string): Promise<void> {
    const attendance = await this.findOne(id);
    await this.attendanceRepository.remove(attendance);
    this.logger.log(`Attendance deleted: ${id}`);
  }

  async markStatus(id: string, status: AttendanceStatus): Promise<Attendance> {
    const attendance = await this.findOne(id);
    attendance.status = status;
    attendance.markedAt = new Date();

    const updatedAttendance = await this.attendanceRepository.save(attendance);
    this.logger.log(`Attendance ${id} status changed to: ${updatedAttendance.status}`);

    return this.findOne(updatedAttendance.id);
  }
}
