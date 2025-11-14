import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Exam, ExamStatus } from '../../entities/exam.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { QueryExamDto } from './dto/query-exam.dto';
import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    private logger: LoggerService,
  ) {
    this.logger.setContext('ExamsService');
  }

  async create(createExamDto: CreateExamDto): Promise<Exam> {
    // Validate that end time is after start time
    if (createExamDto.startTime >= createExamDto.endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const exam = this.examRepository.create({
      ...createExamDto,
      status: createExamDto.status || ExamStatus.SCHEDULED,
      totalParticipants: createExamDto.totalParticipants || 0,
    });

    const savedExam = await this.examRepository.save(exam);
    this.logger.log(`Exam created: ${savedExam.name} (ID: ${savedExam.id})`);

    return savedExam;
  }

  async findAll(query: QueryExamDto) {
    const { search, status, startDate, endDate, page, limit } = query;

    const queryBuilder = this.examRepository
      .createQueryBuilder('exam')
      .leftJoinAndSelect('exam.assignments', 'assignments')
      .leftJoinAndSelect('assignments.supervisor', 'supervisor')
      .leftJoinAndSelect('assignments.room', 'room');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(exam.name ILIKE :search OR exam.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Status filter
    if (status) {
      queryBuilder.andWhere('exam.status = :status', { status });
    }

    // Date range filter
    if (startDate && endDate) {
      queryBuilder.andWhere('exam.examDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('exam.examDate >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('exam.examDate <= :endDate', { endDate });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by exam date and start time
    queryBuilder.orderBy('exam.examDate', 'DESC').addOrderBy('exam.startTime', 'ASC');

    const [exams, total] = await queryBuilder.getManyAndCount();

    return {
      data: exams,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { id },
      relations: [
        'assignments',
        'assignments.supervisor',
        'assignments.room',
        'assignments.room.hall',
        'assignments.room.building',
        'attendances',
      ],
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    return exam;
  }

  async update(id: string, updateExamDto: UpdateExamDto): Promise<Exam> {
    const exam = await this.findOne(id);

    // Validate time if both are provided or being updated
    const startTime = updateExamDto.startTime || exam.startTime;
    const endTime = updateExamDto.endTime || exam.endTime;

    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    Object.assign(exam, updateExamDto);

    const updatedExam = await this.examRepository.save(exam);
    this.logger.log(`Exam updated: ${updatedExam.name} (ID: ${updatedExam.id})`);

    return this.findOne(updatedExam.id);
  }

  async remove(id: string): Promise<void> {
    const exam = await this.findOne(id);
    await this.examRepository.remove(exam);
    this.logger.log(`Exam deleted: ${exam.name} (ID: ${id})`);
  }

  async updateStatus(id: string, status: ExamStatus): Promise<Exam> {
    const exam = await this.findOne(id);
    exam.status = status;

    const updatedExam = await this.examRepository.save(exam);
    this.logger.log(
      `Exam ${exam.name} (ID: ${id}) status changed to: ${updatedExam.status}`,
    );

    return this.findOne(updatedExam.id);
  }

  async startExam(id: string): Promise<Exam> {
    return this.updateStatus(id, ExamStatus.IN_PROGRESS);
  }

  async completeExam(id: string): Promise<Exam> {
    return this.updateStatus(id, ExamStatus.COMPLETED);
  }

  async cancelExam(id: string): Promise<Exam> {
    return this.updateStatus(id, ExamStatus.CANCELLED);
  }

  async getUpcomingExams(days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.examRepository.find({
      where: {
        examDate: Between(today, futureDate),
        status: ExamStatus.SCHEDULED,
      },
      relations: ['assignments', 'assignments.supervisor', 'assignments.room'],
      order: {
        examDate: 'ASC',
        startTime: 'ASC',
      },
    });
  }

  async getTodayExams() {
    const today = new Date().toISOString().split('T')[0];

    return this.examRepository.find({
      where: {
        examDate: new Date(today),
      },
      relations: ['assignments', 'assignments.supervisor', 'assignments.room'],
      order: {
        startTime: 'ASC',
      },
    });
  }
}
