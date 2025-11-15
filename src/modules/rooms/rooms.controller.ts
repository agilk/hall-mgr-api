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
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { QueryRoomDto } from './dto/query-room.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Rooms')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Create a new room',
    description: 'Create a new exam room within a hall. Rooms are typically synced from the external system but can be created manually.',
  })
  @ApiResponse({
    status: 201,
    description: 'Room created successfully',
    schema: {
      example: {
        id: 'RM-001',
        name: 'Room 101',
        code: 'R-101',
        hall_id: 'HLL-001',
        building_id: 'BLD-001',
        capacity: 30,
        is_active: true,
        external_id: 'ext_room_123',
        created_at: '2025-11-14T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Room code already exists' })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all rooms',
    description: 'Retrieve a paginated list of rooms with optional filtering by hall or building.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by room name or code' })
  @ApiQuery({ name: 'hall_id', required: false, description: 'Filter by hall ID' })
  @ApiQuery({ name: 'building_id', required: false, description: 'Filter by building ID' })
  @ApiQuery({ name: 'is_active', required: false, description: 'Filter by active status' })
  @ApiResponse({
    status: 200,
    description: 'Rooms retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'RM-001',
            name: 'Room 101',
            code: 'R-101',
            hall_id: 'HLL-001',
            hall_name: 'Hall A',
            building_id: 'BLD-001',
            building_name: 'Main Exam Hall',
            capacity: 30,
            is_active: true,
          },
        ],
        meta: {
          total: 50,
          page: 1,
          limit: 10,
          totalPages: 5,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() query: QueryRoomDto) {
    return this.roomsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get room by ID',
    description: 'Retrieve detailed information about a specific room including hall and building details.',
  })
  @ApiParam({ name: 'id', description: 'Room ID', example: 'RM-001' })
  @ApiResponse({
    status: 200,
    description: 'Room retrieved successfully',
    schema: {
      example: {
        id: 'RM-001',
        name: 'Room 101',
        code: 'R-101',
        hall_id: 'HLL-001',
        hall: {
          id: 'HLL-001',
          name: 'Hall A',
          floor: 1,
        },
        building_id: 'BLD-001',
        building: {
          id: 'BLD-001',
          name: 'Main Exam Hall',
        },
        capacity: 30,
        is_active: true,
        external_id: 'ext_room_123',
        sync_status: 'synced',
        created_at: '2025-11-14T10:00:00Z',
        updated_at: '2025-11-14T12:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Update room',
    description: 'Update room information. Note that externally synced rooms may be overwritten on next sync.',
  })
  @ApiParam({ name: 'id', description: 'Room ID', example: 'RM-001' })
  @ApiResponse({
    status: 200,
    description: 'Room updated successfully',
    schema: {
      example: {
        id: 'RM-001',
        name: 'Room 101 - Updated',
        code: 'R-101',
        capacity: 35,
        updated_at: '2025-11-14T13:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Delete(':id')
  @Roles(UserRole.EXAM_DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete room',
    description: 'Delete a room. Only EXAM_DIRECTOR can perform this action.',
  })
  @ApiParam({ name: 'id', description: 'Room ID', example: 'RM-001' })
  @ApiResponse({ status: 204, description: 'Room deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Toggle room active status',
    description: 'Activate or deactivate a room.',
  })
  @ApiParam({ name: 'id', description: 'Room ID', example: 'RM-001' })
  @ApiResponse({
    status: 200,
    description: 'Room status toggled successfully',
    schema: {
      example: {
        id: 'RM-001',
        is_active: false,
        updated_at: '2025-11-14T14:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  toggleActive(@Param('id') id: string) {
    return this.roomsService.toggleActive(id);
  }
}
