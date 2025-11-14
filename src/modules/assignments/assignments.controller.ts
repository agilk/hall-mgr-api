import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { QueryAssignmentDto } from './dto/query-assignment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('api/v1/assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  create(@Body() createAssignmentDto: CreateAssignmentDto) {
    return this.assignmentsService.create(createAssignmentDto);
  }

  @Get()
  findAll(@Query() query: QueryAssignmentDto) {
    return this.assignmentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(id, updateAssignmentDto);
  }

  @Delete(':id')
  @Roles(UserRole.EXAM_DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.assignmentsService.remove(id);
  }

  @Patch(':id/accept')
  @Roles(UserRole.SUPERVISOR, UserRole.VOLUNTEER)
  acceptAssignment(@Param('id') id: string) {
    return this.assignmentsService.acceptAssignment(id);
  }

  @Patch(':id/reject')
  @Roles(UserRole.SUPERVISOR, UserRole.VOLUNTEER)
  rejectAssignment(@Param('id') id: string) {
    return this.assignmentsService.rejectAssignment(id);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  confirmAssignment(@Param('id') id: string) {
    return this.assignmentsService.confirmAssignment(id);
  }

  @Patch(':id/complete')
  @Roles(UserRole.SUPERVISOR, UserRole.VOLUNTEER, UserRole.BUILDING_MANAGER)
  completeAssignment(@Param('id') id: string) {
    return this.assignmentsService.completeAssignment(id);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  cancelAssignment(@Param('id') id: string) {
    return this.assignmentsService.cancelAssignment(id);
  }

  @Patch(':id/arrival')
  @Roles(UserRole.SUPERVISOR, UserRole.VOLUNTEER)
  recordArrival(@Param('id') id: string) {
    return this.assignmentsService.recordArrival(id);
  }

  @Patch(':id/departure')
  @Roles(UserRole.SUPERVISOR, UserRole.VOLUNTEER)
  recordDeparture(@Param('id') id: string) {
    return this.assignmentsService.recordDeparture(id);
  }
}
