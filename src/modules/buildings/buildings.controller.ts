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
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { QueryBuildingDto } from './dto/query-building.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Buildings')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/buildings')
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Post()
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Create a new building',
    description: 'Create a new exam hall building. Buildings are typically synced from the external system but can be created manually if needed.',
  })
  @ApiResponse({
    status: 201,
    description: 'Building created successfully',
    schema: {
      example: {
        id: 'BLD-001',
        name: 'Main Exam Hall',
        code: 'MEH-01',
        address: '123 University Ave',
        campus: 'Main Campus',
        is_active: true,
        external_id: 'ext_123',
        sync_status: 'synced',
        created_at: '2025-11-14T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Building code already exists' })
  create(@Body() createBuildingDto: CreateBuildingDto) {
    return this.buildingsService.create(createBuildingDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all buildings',
    description: 'Retrieve a paginated list of buildings with optional filtering.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by building name or code' })
  @ApiQuery({ name: 'campus', required: false, description: 'Filter by campus' })
  @ApiQuery({ name: 'is_active', required: false, description: 'Filter by active status' })
  @ApiResponse({
    status: 200,
    description: 'Buildings retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'BLD-001',
            name: 'Main Exam Hall',
            code: 'MEH-01',
            address: '123 University Ave',
            campus: 'Main Campus',
            is_active: true,
            rooms_count: 15,
          },
        ],
        meta: {
          total: 10,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() query: QueryBuildingDto) {
    return this.buildingsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get building by ID',
    description: 'Retrieve detailed information about a specific building including its halls and rooms.',
  })
  @ApiParam({ name: 'id', description: 'Building ID', example: 'BLD-001' })
  @ApiResponse({
    status: 200,
    description: 'Building retrieved successfully',
    schema: {
      example: {
        id: 'BLD-001',
        name: 'Main Exam Hall',
        code: 'MEH-01',
        address: '123 University Ave',
        campus: 'Main Campus',
        is_active: true,
        external_id: 'ext_123',
        sync_status: 'synced',
        last_synced_at: '2025-11-14T02:00:00Z',
        halls: [
          {
            id: 'HLL-001',
            name: 'Hall A',
            floor: 1,
          },
        ],
        created_at: '2025-11-14T10:00:00Z',
        updated_at: '2025-11-14T12:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  findOne(@Param('id') id: string) {
    return this.buildingsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Update building',
    description: 'Update building information. Note that externally synced buildings may be overwritten on next sync.',
  })
  @ApiParam({ name: 'id', description: 'Building ID', example: 'BLD-001' })
  @ApiResponse({
    status: 200,
    description: 'Building updated successfully',
    schema: {
      example: {
        id: 'BLD-001',
        name: 'Main Exam Hall - Updated',
        code: 'MEH-01',
        address: '123 University Ave',
        updated_at: '2025-11-14T13:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  update(@Param('id') id: string, @Body() updateBuildingDto: UpdateBuildingDto) {
    return this.buildingsService.update(id, updateBuildingDto);
  }

  @Delete(':id')
  @Roles(UserRole.EXAM_DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft delete building',
    description: 'Soft delete a building. The building can be restored later. Only EXAM_DIRECTOR can perform this action.',
  })
  @ApiParam({ name: 'id', description: 'Building ID', example: 'BLD-001' })
  @ApiResponse({ status: 204, description: 'Building deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  remove(@Param('id') id: string) {
    return this.buildingsService.remove(id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.EXAM_DIRECTOR)
  @ApiOperation({
    summary: 'Restore deleted building',
    description: 'Restore a soft-deleted building.',
  })
  @ApiParam({ name: 'id', description: 'Building ID', example: 'BLD-001' })
  @ApiResponse({
    status: 200,
    description: 'Building restored successfully',
    schema: {
      example: {
        id: 'BLD-001',
        name: 'Main Exam Hall',
        deleted_at: null,
        updated_at: '2025-11-14T14:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  restore(@Param('id') id: string) {
    return this.buildingsService.restore(id);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.EXAM_DIRECTOR, UserRole.BUILDING_MANAGER)
  @ApiOperation({
    summary: 'Toggle building active status',
    description: 'Activate or deactivate a building.',
  })
  @ApiParam({ name: 'id', description: 'Building ID', example: 'BLD-001' })
  @ApiResponse({
    status: 200,
    description: 'Building status toggled successfully',
    schema: {
      example: {
        id: 'BLD-001',
        is_active: false,
        updated_at: '2025-11-14T14:30:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  toggleActive(@Param('id') id: string) {
    return this.buildingsService.toggleActive(id);
  }
}
