import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ViolationsService } from './violations.service';
import { CreateViolationDto } from './dto/create-violation.dto';
import { UpdateViolationDto } from './dto/update-violation.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('api/v1/violations')
export class ViolationsController {
  constructor(private readonly violationsService: ViolationsService) {}

  @Post()
  @Roles(UserRole.SUPERVISOR, UserRole.VOLUNTEER, UserRole.BUILDING_MANAGER)
  create(@Body() createViolationDto: CreateViolationDto) {
    return this.violationsService.create(createViolationDto);
  }

  @Get()
  findAll(@Query('assignmentId') assignmentId?: string, @Query('resolved') resolved?: string) {
    return this.violationsService.findAll(assignmentId, resolved === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.violationsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  update(@Param('id') id: string, @Body() updateViolationDto: UpdateViolationDto) {
    return this.violationsService.update(id, updateViolationDto);
  }

  @Delete(':id')
  @Roles(UserRole.EXAM_DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.violationsService.remove(id);
  }

  @Patch(':id/resolve')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  resolve(@Param('id') id: string, @Body('resolution') resolution: string) {
    return this.violationsService.resolve(id, resolution);
  }
}
