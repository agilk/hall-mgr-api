import { SelectQueryBuilder } from 'typeorm';
import { PaginationDto, PaginationMeta, PaginatedResponse } from '../dto/pagination.dto';

/**
 * Pagination utility for TypeORM queries
 */
export class PaginationUtil {
  /**
   * Apply pagination to a TypeORM query builder
   * @param queryBuilder - TypeORM SelectQueryBuilder
   * @param paginationDto - Pagination options
   * @returns Modified query builder with pagination applied
   */
  static applyPagination<T>(
    queryBuilder: SelectQueryBuilder<T>,
    paginationDto: PaginationDto,
  ): SelectQueryBuilder<T> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    return queryBuilder.skip(skip).take(limit);
  }

  /**
   * Apply sorting to a TypeORM query builder
   * @param queryBuilder - TypeORM SelectQueryBuilder
   * @param paginationDto - Pagination options
   * @param alias - Table alias
   * @param allowedSortFields - Allowed fields for sorting (defaults to sortBy field)
   * @returns Modified query builder with sorting applied
   */
  static applySorting<T>(
    queryBuilder: SelectQueryBuilder<T>,
    paginationDto: PaginationDto,
    alias: string,
    allowedSortFields?: string[],
  ): SelectQueryBuilder<T> {
    const { sortBy = 'createdAt', sortOrder = 'DESC' } = paginationDto;

    // Validate sort field if allowed fields are specified
    if (allowedSortFields && !allowedSortFields.includes(sortBy)) {
      // Use default field if invalid field is provided
      queryBuilder.orderBy(`${alias}.createdAt`, sortOrder);
    } else {
      queryBuilder.orderBy(`${alias}.${sortBy}`, sortOrder);
    }

    return queryBuilder;
  }

  /**
   * Create pagination metadata
   * @param total - Total number of items
   * @param page - Current page
   * @param limit - Items per page
   * @returns Pagination metadata
   */
  static createMeta(total: number, page: number, limit: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Create paginated response
   * @param data - Array of items
   * @param total - Total number of items
   * @param paginationDto - Pagination options
   * @returns Paginated response with data and metadata
   */
  static createResponse<T>(
    data: T[],
    total: number,
    paginationDto: PaginationDto,
  ): PaginatedResponse<T> {
    const { page = 1, limit = 10 } = paginationDto;
    const meta = this.createMeta(total, page, limit);

    return {
      data,
      meta,
    };
  }

  /**
   * Execute paginated query
   * @param queryBuilder - TypeORM SelectQueryBuilder
   * @param paginationDto - Pagination options
   * @param alias - Table alias
   * @param allowedSortFields - Allowed fields for sorting
   * @returns Paginated response
   */
  static async execute<T>(
    queryBuilder: SelectQueryBuilder<T>,
    paginationDto: PaginationDto,
    alias: string,
    allowedSortFields?: string[],
  ): Promise<PaginatedResponse<T>> {
    // Apply sorting
    this.applySorting(queryBuilder, paginationDto, alias, allowedSortFields);

    // Get total count before applying pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    this.applyPagination(queryBuilder, paginationDto);

    // Execute query
    const data = await queryBuilder.getMany();

    // Create response
    return this.createResponse(data, total, paginationDto);
  }
}
