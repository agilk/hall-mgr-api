import { Type } from 'class-transformer';
import { IsOptional, IsDateString, IsEnum, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DateRangeFilterDto {
  @ApiPropertyOptional({
    description: 'Start date (ISO 8601)',
    example: '2025-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601)',
    example: '2025-12-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class IdFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by ID',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  id?: number;
}

export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  LIKE = 'like',
  IN = 'in',
}

/**
 * Advanced filter builder for complex queries
 * Example usage: /api/v1/users?filter=role:eq:supervisor&filter=status:in:active,pending
 */
export class AdvancedFilterDto {
  @ApiPropertyOptional({
    description: 'Advanced filters in format: field:operator:value',
    type: [String],
    example: ['role:eq:supervisor', 'status:in:active,pending'],
  })
  @IsOptional()
  filter?: string[];
}
