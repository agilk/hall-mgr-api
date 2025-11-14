import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.EXAM_DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleActive(id);
  }

  @Patch(':id/toggle-approved')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  toggleApproved(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleApproved(id);
  }

  @Post(':id/roles/:role')
  @Roles(UserRole.EXAM_DIRECTOR)
  assignRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('role') role: string,
  ) {
    return this.usersService.assignRole(id, role);
  }

  @Delete(':id/roles/:role')
  @Roles(UserRole.EXAM_DIRECTOR)
  removeRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('role') role: string,
  ) {
    return this.usersService.removeRole(id, role);
  }
}
