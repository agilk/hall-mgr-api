import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Violation, ViolationSeverity } from '../../entities/violation.entity';
import { Assignment } from '../../entities/assignment.entity';
import { CreateViolationDto } from './dto/create-violation.dto';
import { UpdateViolationDto } from './dto/update-violation.dto';
import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class ViolationsService {
  constructor(
    @InjectRepository(Violation)
    private violationRepository: Repository<Violation>,
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
    private logger: LoggerService,
  ) {
    this.logger.setContext('ViolationsService');
  }

  async create(createViolationDto: CreateViolationDto): Promise<Violation> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: createViolationDto.assignmentId },
    });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${createViolationDto.assignmentId} not found`);
    }

    const violation = this.violationRepository.create({
      ...createViolationDto,
      severity: createViolationDto.severity || ViolationSeverity.MEDIUM,
      occurredAt: createViolationDto.occurredAt ? new Date(createViolationDto.occurredAt) : new Date(),
    });

    const saved = await this.violationRepository.save(violation);
    this.logger.log(`Violation created: ${saved.id}`);
    return this.findOne(saved.id);
  }

  async findAll(assignmentId?: string, resolved?: boolean) {
    const where: any = {};
    if (assignmentId) where.assignmentId = assignmentId;
    if (resolved !== undefined) where.resolved = resolved;

    return this.violationRepository.find({
      where,
      relations: ['assignment', 'assignment.supervisor', 'assignment.room', 'assignment.exam'],
      order: { occurredAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Violation> {
    const violation = await this.violationRepository.findOne({
      where: { id },
      relations: ['assignment', 'assignment.supervisor', 'assignment.room', 'assignment.exam'],
    });
    if (!violation) {
      throw new NotFoundException(`Violation with ID ${id} not found`);
    }
    return violation;
  }

  async update(id: string, updateViolationDto: UpdateViolationDto): Promise<Violation> {
    const violation = await this.findOne(id);
    Object.assign(violation, updateViolationDto);
    await this.violationRepository.save(violation);
    this.logger.log(`Violation updated: ${id}`);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const violation = await this.findOne(id);
    await this.violationRepository.remove(violation);
    this.logger.log(`Violation deleted: ${id}`);
  }

  async resolve(id: string, resolution: string): Promise<Violation> {
    const violation = await this.findOne(id);
    violation.resolved = true;
    violation.resolution = resolution;
    await this.violationRepository.save(violation);
    this.logger.log(`Violation ${id} resolved`);
    return this.findOne(id);
  }
}
