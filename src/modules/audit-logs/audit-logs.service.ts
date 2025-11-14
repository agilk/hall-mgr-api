import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private logger: LoggerService,
  ) {
    this.logger.setContext('AuditLogsService');
  }

  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(createAuditLogDto);
    const saved = await this.auditLogRepository.save(auditLog);
    this.logger.log(`Audit log created: ${saved.id}`);
    return saved;
  }

  async findAll(userId?: string, action?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;

    return this.auditLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AuditLog> {
    const auditLog = await this.auditLogRepository.findOne({ where: { id } });
    if (!auditLog) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }
    return auditLog;
  }
}
