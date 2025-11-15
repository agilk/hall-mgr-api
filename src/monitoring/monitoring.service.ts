import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Exam, ExamStatus } from '../entities/exam.entity';
import { Assignment, AssignmentStatus } from '../entities/assignment.entity';
import { Violation } from '../entities/violation.entity';
import { Document } from '../entities/document.entity';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class MonitoringService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
    @InjectRepository(Violation)
    private violationRepository: Repository<Violation>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async getSystemStats() {
    const [
      totalUsers,
      activeUsers,
      totalExams,
      scheduledExams,
      totalAssignments,
      pendingAssignments,
      totalViolations,
      totalDocuments,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.examRepository.count(),
      this.examRepository.count({ where: { status: ExamStatus.SCHEDULED } }),
      this.assignmentRepository.count(),
      this.assignmentRepository.count({ where: { status: AssignmentStatus.PENDING } }),
      this.violationRepository.count(),
      this.documentRepository.count(),
    ]);

    // Calculate total document size
    const documents = await this.documentRepository.find({
      select: ['fileSize'],
    });
    const totalSize = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      exams: {
        total: totalExams,
        scheduled: scheduledExams,
      },
      assignments: {
        total: totalAssignments,
        pending: pendingAssignments,
      },
      violations: {
        total: totalViolations,
      },
      documents: {
        total: totalDocuments,
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
      },
      system: {
        uptime: process.uptime(),
        uptimeFormatted: this.formatUptime(process.uptime()),
        memoryUsage: formatBytes(process.memoryUsage().heapUsed),
        nodeVersion: process.version,
      },
    };
  }

  async getPerformanceMetrics() {
    const memoryUsage = process.memoryUsage();

    return {
      uptime: process.uptime(),
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
      },
      process: {
        pid: process.pid,
        platform: process.platform,
        arch: process.arch,
        version: process.version,
      },
    };
  }

  async getRecentActivity() {
    // Get recent audit logs
    const recentLogs = await this.auditLogRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Get recent exams
    const recentExams = await this.examRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Get recent violations
    const recentViolations = await this.violationRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      recentLogs: recentLogs.map((log) => ({
        userId: log.userId,
        action: log.action,
        timestamp: log.createdAt,
        ipAddress: log.ipAddress,
      })),
      recentExams: recentExams.map((exam) => ({
        id: exam.id,
        name: exam.name,
        status: exam.status,
        date: exam.examDate,
      })),
      recentViolations: recentViolations.map((violation) => ({
        id: violation.id,
        description: violation.description,
        severity: violation.severity,
        timestamp: violation.createdAt,
      })),
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.length > 0 ? parts.join(' ') : '0m';
  }
}
