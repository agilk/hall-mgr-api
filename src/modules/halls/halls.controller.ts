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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { HallsService } from './halls.service';
import { CreateHallDto } from './dto/create-hall.dto';
import { UpdateHallDto } from './dto/update-hall.dto';
import { QueryHallDto } from './dto/query-hall.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Halls')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/halls')
export class HallsController {
  constructor(private readonly hallsService: HallsService) {}

  @Post()
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Create a new hall',
    description: 'Create a new hall within a building. Halls represent specific sections or floors within an exam building.',
  })
  @ApiResponse({
    status: 201,
    description: 'Hall created successfully',
    schema: {
      example: {
        id: 'HLL-001',
        name: 'Hall A',
        code: 'HA-01',
        building_id: 'BLD-001',
        floor: 1,
        capacity: 200,
        is_active: true,
        created_at: '2025-11-14T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Hall code already exists' })
  create(@Body() createHallDto: CreateHallDto) {
    return this.hallsService.create(createHallDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all halls',
    description: 'Retrieve a paginated list of halls with optional filtering by building.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by hall name or code' })
  @ApiQuery({ name: 'building_id', required: false, description: 'Filter by building ID' })
  @ApiQuery({ name: 'is_active', required: false, description: 'Filter by active status' })
  @ApiResponse({
    status: 200,
    description: 'Halls retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'HLL-001',
            name: 'Hall A',
            code: 'HA-01',
            building_id: 'BLD-001',
            building_name: 'Main Exam Hall',
            floor: 1,
            capacity: 200,
            is_active: true,
            rooms_count: 10,
          },
        ],
        meta: {
          total: 25,
          page: 1,
          limit: 10,
          totalPages: 3,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() query: QueryHallDto) {
    return this.hallsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get hall by ID',
    description: 'Retrieve detailed information about a specific hall including its rooms.',
  })
  @ApiParam({ name: 'id', description: 'Hall ID', example: 'HLL-001' })
  @ApiResponse({
    status: 200,
    description: 'Hall retrieved successfully',
    schema: {
      example: {
        id: 'HLL-001',
        name: 'Hall A',
        code: 'HA-01',
        building_id: 'BLD-001',
        building: {
          id: 'BLD-001',
          name: 'Main Exam Hall',
        },
        floor: 1,
        capacity: 200,
        is_active: true,
        rooms: [
          {
            id: 'RM-001',
            name: 'Room 101',
            capacity: 30,
          },
        ],
        created_at: '2025-11-14T10:00:00Z',
        updated_at: '2025-11-14T12:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Hall not found' })
  findOne(@Param('id') id: string) {
    return this.hallsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Update hall',
    description: 'Update hall information including name, floor, and capacity.',
  })
  @ApiParam({ name: 'id', description: 'Hall ID', example: 'HLL-001' })
  @ApiResponse({
    status: 200,
    description: 'Hall updated successfully',
    schema: {
      example: {
        id: 'HLL-001',
        name: 'Hall A - Updated',
        code: 'HA-01',
        floor: 2,
        capacity: 250,
        updated_at: '2025-11-14T13:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Hall not found' })
  update(@Param('id') id: string, @Body() updateHallDto: UpdateHallDto) {
    return this.hallsService.update(id, updateHallDto);
  }

  @Delete(':id')
  @Roles(UserRole.EXAM_DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete hall',
    description: 'Delete a hall. Only EXAM_DIRECTOR can perform this action.',
  })
  @ApiParam({ name: 'id', description: 'Hall ID', example: 'HLL-001' })
  @ApiResponse({ status: 204, description: 'Hall deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Hall not found' })
  remove(@Param('id') id: string) {
    return this.hallsService.remove(id);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Toggle hall active status',
    description: 'Activate or deactivate a hall.',
  })
  @ApiParam({ name: 'id', description: 'Hall ID', example: 'HLL-001' })
  @ApiResponse({
    status: 200,
    description: 'Hall status toggled successfully',
    schema: {
      example: {
        id: 'HLL-001',
        is_active: false,
        updated_at: '2025-11-14T14:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Hall not found' })
  toggleActive(@Param('id') id: string) {
    return this.hallsService.toggleActive(id);
  }
}
