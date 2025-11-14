import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('api/v1/audit-logs')
@Roles(UserRole.EXAM_DIRECTOR)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Post()
  create(@Body() createAuditLogDto: CreateAuditLogDto) {
    return this.auditLogsService.create(createAuditLogDto);
  }

  @Get()
  findAll(@Query('userId') userId?: string, @Query('action') action?: string) {
    return this.auditLogsService.findAll(userId, action);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditLogsService.findOne(id);
  }
}
